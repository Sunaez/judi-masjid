// src/app/display/Components/Rotator/index.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import useMessages, { MessageWithConditions } from './Messages';
import useValidMessages from './Conditions';
import Welcome from './Specials/Welcome';
import DateTimeWeather from './Specials/DateTimeWeather';
import Donation from './Specials/Donation';
import Feedback from './Specials/Feedback';
import PrayerTable from './Specials/PrayerTable';
import Footer from './Footer';
import { fetchPrayerTimes, RawPrayerTimes } from '@/app/FetchPrayerTimes';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Environment variable keys for OpenWeather API
const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY!;
const OPENWEATHER_LAT = process.env.NEXT_PUBLIC_OPENWEATHER_LAT!;
const OPENWEATHER_LON = process.env.NEXT_PUBLIC_OPENWEATHER_LON!;

// Firestore document reference for caching weather
const weatherDocRef = doc(db, 'weather', 'current');

// Duration each slot is displayed (in milliseconds)
const DISPLAY_MS = 20_000;
// How old the cached weather data can be before refetch (1 minute)
const RELOAD_THRESHOLD = 60 * 1000;
// Interval at which to check/update weather (30 seconds)
const CHECK_INTERVAL = 30 * 1000;

// Order of slots: specials (custom components) and messages
const slots = [
  // { type: 'special', component: Welcome },
  { type: 'special', component: PrayerTable },
  { type: 'message' },
  // { type: 'special', component: DateTimeWeather },
  // { type: 'message' },
  // { type: 'special', component: Donation },
  // { type: 'message' },
  // { type: 'special', component: Feedback },
];

interface WeatherData {
  temp: number;
  condition: string;
  iconCode: string;
  forecastTemp: number;
  forecastCondition: string;
}

export default function Rotator() {
  // Raw messages fetched from various sources
  const all = useMessages();
  // Prayer times loaded from Google Sheets
  const [prayerTimes, setPrayerTimes] = useState<RawPrayerTimes | null>(null);
  // Current + forecast weather data
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  // Counter to trigger re-renders after prayer times +1min
  const [prayerRefresh, setPrayerRefresh] = useState(0);
  // Filter messages by validity (e.g. time-based conditions)
  const valid = useValidMessages(all, prayerTimes, weatherData?.condition || null);

  // Index of the current slot (cycles through `slots`)
  const [index, setIndex] = useState(0);
  // The message object to show when in a message slot
  const [currentMessage, setCurrentMessage] = useState<MessageWithConditions | null>(null);

  // Refs for container (for animation + blur) and progress bar
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // ─── Fetch Prayer Times ───────────────────────────────────────────────────────
  // Runs once on mount to load today's prayer times
  useEffect(() => {
    fetchPrayerTimes()
      .then(data => setPrayerTimes(data))
      .catch(err => console.error('[prayer] Error:', err));
  }, []);

  // ─── Schedule Re-Render After Jama‘at/Maghrib ─────────────────────────────────
  // Sets up a timeout for each prayer's jama‘at time +1 minute or maghrib +1 minute.
  // When each fires, bump `prayerRefresh` to trigger a re-render & animation replay.
  useEffect(() => {
    if (!prayerTimes) return;

    // Keys we want to observe (+1min after these triggers)
    type Key = keyof RawPrayerTimes;
    const triggerKeys: Key[] = [
      'fajrJamaat',
      'dhuhrJamaat',
      'asrJamaat',
      'ishaJamaat',
      'maghrib',
    ];

    const now = Date.now();
    const timers: number[] = [];

    triggerKeys.forEach(key => {
      const timeStr = prayerTimes[key];      // e.g. "18:45"
      const [h, m] = timeStr.split(':').map(Number);
      const fire = new Date();
      fire.setHours(h, m + 1, 0, 0);         // schedule at HH:(MM+1):00
      const delay = fire.getTime() - now;
      if (delay > 0) {
        const id = window.setTimeout(() => {
          setPrayerRefresh(x => x + 1);
        }, delay);
        timers.push(id);
      }
    });

    // Cleanup on unmount or if prayerTimes changes
    return () => timers.forEach(id => clearTimeout(id));
  }, [prayerTimes]);

  // ─── Brief Blur on Prayer Refresh ────────────────────────────────────────────
  // Applies a small blur class for 1 second whenever prayerRefresh increments.
  useEffect(() => {
    if (prayerRefresh === 0) return;
    const el = containerRef.current;
    if (!el) return;

    el.classList.add('filter', 'blur-sm');
    const timeout = window.setTimeout(() => {
      el.classList.remove('filter', 'blur-sm');
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [prayerRefresh]);

  // ─── Fetch & Cache Weather ───────────────────────────────────────────────────
  // Tries to load cached weather from Firestore first; if stale or missing, fetches
  // from OpenWeather (current + 1-slot forecast), saves to Firestore, updates state.
  useEffect(() => {
    async function updateWeather(force = false) {
      try {
        const snap = await getDoc(weatherDocRef);
        if (!force && snap.exists()) {
          const data = snap.data();
          const age = Date.now() - (data.timestamp as number);
          if (age < RELOAD_THRESHOLD) {
            setWeatherData({
              temp: data.temp,
              condition: data.condition,
              iconCode: data.iconCode,
              forecastTemp: data.forecastTemp,
              forecastCondition: data.forecastCondition,
            });
            return;
          }
        }

        // Fetch current weather
        const curRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${OPENWEATHER_LAT}&lon=${OPENWEATHER_LON}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        const curJson = await curRes.json();

        // Fetch next forecast entry
        const fcRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${OPENWEATHER_LAT}&lon=${OPENWEATHER_LON}&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=1`
        );
        const fcJson = await fcRes.json();

        // Extract and round temps, main condition strings, icon code
        const temp = Math.round(curJson.main.temp);
        const condition = curJson.weather[0].main;
        const iconCode = curJson.weather[0].icon;
        const forecastTemp = Math.round(fcJson.list[0].main.temp);
        const forecastCondition = fcJson.list[0].weather[0].main;

        // Cache in Firestore
        const timestamp = Date.now();
        await setDoc(weatherDocRef, {
          temp,
          condition,
          iconCode,
          forecastTemp,
          forecastCondition,
          timestamp,
        });

        setWeatherData({ temp, condition, iconCode, forecastTemp, forecastCondition });
      } catch (error) {
        console.error('[weather] Error:', error);
      }
    }

    updateWeather();
    const interval = setInterval(() => updateWeather(), CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // ─── Pick Random Message for “message” Slots ─────────────────────────────────
  // Whenever the slot index changes to a message, choose one valid at random.
  useEffect(() => {
    if (slots[index].type === 'message') {
      if (valid.length > 0) {
        const random = Math.floor(Math.random() * valid.length);
        setCurrentMessage(valid[random]);
      } else {
        setCurrentMessage(null);
      }
    }
  }, [index, valid]);

  // ─── Advance Through Slots on Interval ───────────────────────────────────────
  // Every DISPLAY_MS, advance index by 1 (looping)
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % slots.length);
    }, DISPLAY_MS);
    return () => clearInterval(interval);
  }, []);

  // ─── GSAP Entry/Exit Animation ───────────────────────────────────────────────
  // Runs on every change of `index` or `prayerRefresh` to replay the fade-in/progress/fade-out.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from(containerRef.current, {
        autoAlpha: 0,
        y: 30,
        duration: 0.6,
        ease: 'power2.out',
      });
      tl.set(progressRef.current, { width: '0%' });
      tl.to(
        progressRef.current,
        { width: '100%', duration: DISPLAY_MS / 1000, ease: 'none' },
        '<'
      );
      tl.to(
        containerRef.current,
        { autoAlpha: 0, y: -30, duration: 0.6, ease: 'power1.in' },
        `-=${0.6}`
      );
    }, containerRef);

    return () => ctx.revert();
  }, [index, prayerRefresh]);

  // ─── Render Logic ───────────────────────────────────────────────────────────
  const slot = slots[index];
  let content: React.ReactNode;

  if (slot.type === 'message') {
    // Show the two-panel Arabic/English message + footer
    content = currentMessage ? (
      <>
        <div className="flex-1 flex items-start justify-between gap-8 overflow-hidden">
          <div
            className="flex-1 arabic-text rtl"
            dir="rtl"
            style={{ fontSize: 'var(--rotator-text-size)' }}
          >
            {currentMessage.sourceType === 'quran'
              ? currentMessage.quran?.arabicText
              : currentMessage.sourceType === 'hadith'
              ? currentMessage.hadith?.arabicText
              : currentMessage.other?.arabicText}
          </div>
          <div className="flex-1" style={{ fontSize: 'var(--rotator-text-size)' }}>
            {currentMessage.sourceType === 'quran'
              ? currentMessage.quran?.englishText
              : currentMessage.sourceType === 'hadith'
              ? currentMessage.hadith?.englishText
              : currentMessage.other?.englishText}
          </div>
        </div>
        <Footer message={currentMessage} />
      </>
    ) : (
      <div className="flex-1 flex items-center justify-center">Loading…</div>
    );
  } else {
    // Render a special component with its specific props
    const Special = slot.component as React.ComponentType<any>;
    const specialProps: Record<string, any> =
      Special === DateTimeWeather
        ? {
            temperature: weatherData?.temp ?? 0,
            condition: weatherData?.condition ?? 'Unknown',
            iconCode: weatherData?.iconCode ?? '01d',
            displayDuration: DISPLAY_MS,
          }
        : Special === PrayerTable
        ? { prayerTimes, displayDuration: DISPLAY_MS }
        : { displayDuration: DISPLAY_MS };

    content = (
      <div className="flex-1 flex items-center justify-center p-8">
        <Special {...specialProps} />
      </div>
    );
  }

  // ─── Main Container ─────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-full w-full p-8"
      style={{
        backgroundImage: 'linear-gradient(var(--background-start), var(--background-end))',
        '--rotator-text-size': '3.5rem',
      } as React.CSSProperties}
    >
      {content}
      <div ref={progressRef} className="absolute bottom-0 left-0 h-1 w-0 bg-accent" />
    </div>
  );
}
