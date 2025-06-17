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
import PrayerTable from './Specials/PrayerTable'; // New special component
import Footer from './Footer';
import { fetchPrayerTimes, RawPrayerTimes } from '@/app/FetchPrayerTimes';

// Firebase import
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Environment variables
const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY!;
const OPENWEATHER_LAT = process.env.NEXT_PUBLIC_OPENWEATHER_LAT!;
const OPENWEATHER_LON = process.env.NEXT_PUBLIC_OPENWEATHER_LON!;

// Firestore document reference
const weatherDocRef = doc(db, 'weather', 'current');

// Timing constants
const DISPLAY_MS = 20_000;
const RELOAD_THRESHOLD = 60 * 1000;   // 1 minute
const CHECK_INTERVAL = 30 * 1000;     // 30 seconds

// Slot sequence, including new PrayerTable special
const slots = [
  { type: 'special', component: Welcome },
  { type: 'special', component: PrayerTable },
  { type: 'message' },
  { type: 'special', component: DateTimeWeather },
  { type: 'message' },
  { type: 'special', component: Donation },
  { type: 'message' },
  { type: 'special', component: Feedback },
];

interface WeatherData {
  temp: number;
  condition: string;
  iconCode: string;
  forecastTemp: number;
  forecastCondition: string;
}

export default function Rotator() {
  // State & refs
  const all = useMessages();
  const [prayerTimes, setPrayerTimes] = useState<RawPrayerTimes | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const valid = useValidMessages(all, prayerTimes, weatherData?.condition || null);

  const [index, setIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState<MessageWithConditions | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Fetch prayer times
  useEffect(() => {
    fetchPrayerTimes()
      .then(data => setPrayerTimes(data))
      .catch(err => console.error('[prayer] Error:', err));
  }, []);

  // Weather fetch + cache icon code in Firestore
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
        console.log('[weather] Current status:', curRes.status);
        const curJson = await curRes.json();

        // Fetch next forecast
        const fcRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${OPENWEATHER_LAT}&lon=${OPENWEATHER_LON}&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=1`
        );
        console.log('[weather] Forecast status:', fcRes.status);
        const fcJson = await fcRes.json();

        // Extract values
        const temp = Math.round(curJson.main.temp);
        const condition = curJson.weather[0].main;
        const iconCode = curJson.weather[0].icon;
        const forecastTemp = Math.round(fcJson.list[0].main.temp);
        const forecastCondition = fcJson.list[0].weather[0].main;

        const timestamp = Date.now();
        const docData = { temp, condition, iconCode, forecastTemp, forecastCondition, timestamp };
        await setDoc(weatherDocRef, docData);
        setWeatherData({ temp, condition, iconCode, forecastTemp, forecastCondition });
      } catch (error) {
        console.error('[weather] Error:', error);
      }
    }

    updateWeather();
    const id = setInterval(() => updateWeather(), CHECK_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // On message slot: pick random valid
  useEffect(() => {
    if (slots[index].type === 'message') {
      setCurrentMessage(valid.length ? valid[Math.floor(Math.random() * valid.length)] : null);
    }
  }, [index, valid]);

  // Advance slot
  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % slots.length), DISPLAY_MS);
    return () => clearInterval(id);
  }, []);

  // Animation with GSAP
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from(containerRef.current, { autoAlpha: 0, y: 30, duration: 0.6, ease: 'power2.out' });
      tl.set(progressRef.current, { width: '0%' });
      tl.to(progressRef.current, { width: '100%', duration: DISPLAY_MS / 1000, ease: 'none' }, '<');
      tl.to(containerRef.current, { autoAlpha: 0, y: -30, duration: 0.6, ease: 'power1.in' }, `-=${0.6}`);
    }, containerRef);
    return () => ctx.revert();
  }, [index]);

  // Render
  const slot = slots[index];
  let content: React.ReactNode;

  if (slot.type === 'message') {
    content = currentMessage ? (
      <>
        <div className="flex-1 flex items-start justify-between gap-8 overflow-hidden">
          <div className="flex-1 arabic-text rtl" dir="rtl" style={{ fontSize: 'var(--rotator-text-size)' }}>
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
    const Special = slot.component as React.ComponentType<any>;
    // Build props based on special
    const specialProps: Record<string, any> =
      Special === DateTimeWeather
        ? { temperature: weatherData?.temp ?? 0, condition: weatherData?.condition ?? 'Unknown', iconCode: weatherData?.iconCode ?? '01d', displayDuration: DISPLAY_MS }
        : Special === PrayerTable
        ? { prayerTimes, displayDuration: DISPLAY_MS }
        : { displayDuration: DISPLAY_MS };

    content = (
      <div className="flex-1 flex items-center justify-center p-8">
        <Special {...specialProps} />
      </div>
    );
  }

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
