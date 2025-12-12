// src/app/display/Components/Rotator/index.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import useMessages, { MessageWithConditions } from './Messages';
import useValidMessages, { useWeatherMessages } from './Conditions';
import type { AnimationConfig, AnimationType } from './types';
import Welcome from './Specials/Welcome';
import DateTimeWeather from './Specials/DateTimeWeather';
import Donation from './Specials/Donation';
import Feedback from './Specials/Feedback';
import PrayerTable from './Specials/PrayerTable';
import Footer from './Footer';
import { RawPrayerTimes } from '@/app/FetchPrayerTimes';
import { usePrayerTimesContext } from '@/app/display/context/PrayerTimesContext';
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
  { type: 'special', component: Welcome },
  { type: 'special', component: PrayerTable },
  { type: 'message' },
  { type: 'special', component: DateTimeWeather },
  { type: 'weather-message' },  // Weather-conditional message after weather display
  { type: 'special', component: Donation },
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
  // Raw messages fetched from various sources
  const all = useMessages();
  // Prayer times from Firebase context
  const { prayerTimes } = usePrayerTimesContext();
  // Current + forecast weather data
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  // Counter to trigger re-renders after prayer times +1min
  const [prayerRefresh, setPrayerRefresh] = useState(0);
  // Filter messages by validity (e.g. time-based conditions)
  const valid = useValidMessages(all, prayerTimes, weatherData?.condition || null);
  // Filter messages that have weather conditions matching current weather
  const weatherMessages = useWeatherMessages(all, weatherData?.condition || null);

  // Index of the current slot (cycles through `slots`)
  const [index, setIndex] = useState(0);
  // The message object to show when in a message slot
  const [currentMessage, setCurrentMessage] = useState<MessageWithConditions | null>(null);
  // The weather-conditional message to show when in a weather-message slot
  const [currentWeatherMessage, setCurrentWeatherMessage] = useState<MessageWithConditions | null>(null);

  // Refs for container (for animation + blur) and progress bar
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  // Refs for message text elements to apply custom animations
  const arabicTextRef = useRef<HTMLDivElement>(null);
  const englishTextRef = useRef<HTMLDivElement>(null);

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
  const updateWeather = useCallback(async (force = false) => {
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
  }, []);

  // Initial weather fetch and periodic refresh
  useEffect(() => {
    updateWeather();
    const interval = setInterval(() => updateWeather(), CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [updateWeather]);

  // ─── Refresh Weather When Entering Welcome Slot ────────────────────────────────
  // Force a fresh weather fetch at the start of each rotation cycle (Welcome slot),
  // so weather data is ready before DateTimeWeather and weather-message slots.
  useEffect(() => {
    const slot = slots[index];
    if (slot.type === 'special' && slot.component === Welcome) {
      updateWeather(true);
    }
  }, [index, updateWeather]);

  // ─── Pick Random Message for "message" Slots ─────────────────────────────────
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

  // ─── Pick Random Weather Message for "weather-message" Slots ─────────────────
  // Whenever the slot index changes to a weather-message, choose one matching at random.
  // If no matching messages exist, skip to the next slot immediately.
  useEffect(() => {
    if (slots[index].type === 'weather-message') {
      if (weatherMessages.length > 0) {
        const random = Math.floor(Math.random() * weatherMessages.length);
        setCurrentWeatherMessage(weatherMessages[random]);
      } else {
        // No matching weather messages - skip to next slot
        setIndex(i => (i + 1) % slots.length);
      }
    }
  }, [index, weatherMessages]);

  // ─── Skip PrayerTable When All Prayers Have Passed ─────────────────────────────
  // After Isha is finished for the day, skip the PrayerTable slot entirely.
  useEffect(() => {
    const slot = slots[index];
    if (slot.type === 'special' && slot.component === PrayerTable && prayerTimes) {
      const toMin = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();

      // Check if all prayers have passed (Isha Jamaat is the last prayer)
      const allTimes = [
        toMin(prayerTimes.fajrJamaat),
        toMin(prayerTimes.dhuhrJamaat),
        toMin(prayerTimes.asrJamaat),
        toMin(prayerTimes.maghrib),
        toMin(prayerTimes.ishaJamaat),
      ];
      const allPassed = allTimes.every(t => currentMin > t);

      if (allPassed) {
        // Skip to next slot
        setIndex(i => (i + 1) % slots.length);
      }
    }
  }, [index, prayerTimes]);

  // ─── Advance Through Slots on Interval ───────────────────────────────────────
  // Every DISPLAY_MS, advance index by 1 (looping)
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % slots.length);
    }, DISPLAY_MS);
    return () => clearInterval(interval);
  }, []);

  // ─── Helper: Apply Animation to Element ───────────────────────────────────────
  // Applies GSAP animation based on the animation config
  // Duration is stored in ms but GSAP uses seconds
  const applyAnimation = useCallback((
    element: HTMLElement | null,
    config: AnimationConfig | undefined,
    content: string,
    isArabic: boolean,
    delay: number = 0
  ) => {
    if (!element) return;

    // Default animation config if none specified (300ms default)
    const effectiveConfig: AnimationConfig = config?.enabled
      ? config
      : { enabled: true, animation: 'fade' as AnimationType, duration: 300 };

    const { animation, duration } = effectiveConfig;
    // Convert ms to seconds for GSAP
    const durationSec = duration / 1000;

    if (animation === 'word-appear') {
      // Word-appear: split into spans and animate each
      element.textContent = '';

      if (isArabic) {
        // Split into words for Arabic
        const words = content.trim().split(/\s+/);
        words.forEach((word, i) => {
          const span = document.createElement('span');
          span.textContent = word;
          span.style.display = 'inline-block';
          span.style.opacity = '0';
          element.appendChild(span);
          if (i < words.length - 1) element.appendChild(document.createTextNode(' '));
        });
      } else {
        // Split into characters for English
        const chars = content.split('');
        chars.forEach((char) => {
          if (char === ' ') {
            element.appendChild(document.createTextNode(' '));
          } else {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            element.appendChild(span);
          }
        });
      }

      const targets = element.querySelectorAll<HTMLElement>('span');
      const numTargets = targets.length;

      if (numTargets === 0) return;

      // Calculate timing so TOTAL animation = durationSec
      // Total time = elementDuration + stagger * (N - 1)
      let elementDuration: number;
      let stagger: number;

      if (numTargets === 1) {
        elementDuration = durationSec;
        stagger = 0;
      } else {
        // Use 20% of total time for each element's fade-in (min 50ms)
        elementDuration = Math.max(durationSec * 0.2, 0.05);
        // Calculate stagger to fit remaining time
        stagger = (durationSec - elementDuration) / (numTargets - 1);
        // If stagger would be negative or zero, spread evenly
        if (stagger <= 0) {
          stagger = durationSec / numTargets;
          elementDuration = stagger;
        }
      }

      gsap.fromTo(
        targets,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          ease: 'power3.out',
          duration: elementDuration,
          stagger: stagger,
          delay: delay,
        }
      );
    } else {
      // Standard animations
      const fromVars: gsap.TweenVars = { opacity: 0 };
      const toVars: gsap.TweenVars = { opacity: 1, duration: durationSec, ease: 'power3.out', delay: delay };

      switch (animation) {
        case 'slide':
          fromVars.x = isArabic ? 50 : -50;
          toVars.x = 0;
          break;
        case 'bounce':
          fromVars.scale = 0.3;
          toVars.scale = 1;
          toVars.ease = 'bounce.out';
          break;
        case 'zoom':
          fromVars.scale = 0.5;
          toVars.scale = 1;
          break;
        case 'fade':
        default:
          break;
      }

      gsap.fromTo(element, fromVars, toVars);
    }
  }, []);

  // ─── Apply Custom Message Animations ─────────────────────────────────────────
  // Applies custom animations to Arabic and English text when message changes
  useEffect(() => {
    const slot = slots[index];
    const msg = slot.type === 'message' ? currentMessage : slot.type === 'weather-message' ? currentWeatherMessage : null;

    if (!msg) return;

    // Wait a small delay to ensure DOM elements are rendered
    const timeout = setTimeout(() => {
      // Get the animation keys based on source type
      const arabicKey = msg.sourceType === 'quran' ? 'quranArabic'
        : msg.sourceType === 'hadith' ? 'hadithArabic'
        : 'otherArabic';
      const englishKey = msg.sourceType === 'quran' ? 'quranEnglish'
        : msg.sourceType === 'hadith' ? 'hadithEnglish'
        : 'otherEnglish';

      // Get the text content
      const arabicContent = msg.sourceType === 'quran' ? msg.quran?.arabicText
        : msg.sourceType === 'hadith' ? msg.hadith?.arabicText
        : msg.other?.arabicText;
      const englishContent = msg.sourceType === 'quran' ? msg.quran?.englishText
        : msg.sourceType === 'hadith' ? msg.hadith?.englishText
        : msg.other?.englishText;

      // Apply animations with staggered delay
      if (arabicContent) {
        applyAnimation(arabicTextRef.current, msg.animations?.[arabicKey], arabicContent, true, 0.3);
      }
      if (englishContent) {
        applyAnimation(englishTextRef.current, msg.animations?.[englishKey], englishContent, false, 0.5);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [index, currentMessage, currentWeatherMessage, applyAnimation]);

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

  // Helper to render a message (used by both 'message' and 'weather-message' slots)
  const renderMessage = (msg: MessageWithConditions | null) => {
    if (!msg) {
      return <div className="flex-1 flex items-center justify-center">Loading…</div>;
    }

    // Get text content based on source type
    const arabicText = msg.sourceType === 'quran'
      ? msg.quran?.arabicText
      : msg.sourceType === 'hadith'
      ? msg.hadith?.arabicText
      : msg.other?.arabicText;
    const englishText = msg.sourceType === 'quran'
      ? msg.quran?.englishText
      : msg.sourceType === 'hadith'
      ? msg.hadith?.englishText
      : msg.other?.englishText;

    return (
      <>
        <div className="flex-1 flex items-start justify-between gap-8 overflow-hidden">
          <div
            ref={arabicTextRef}
            className="flex-1 arabic-text rtl"
            dir="rtl"
            style={{ fontSize: 'var(--rotator-text-size)' }}
          >
            {arabicText}
          </div>
          <div
            ref={englishTextRef}
            className="flex-1"
            style={{ fontSize: 'var(--rotator-text-size)' }}
          >
            {englishText}
          </div>
        </div>
        <Footer message={msg} />
      </>
    );
  };

  if (slot.type === 'message') {
    // Show the two-panel Arabic/English message + footer
    content = renderMessage(currentMessage);
  } else if (slot.type === 'weather-message') {
    // Show a weather-conditional message (same layout as regular messages)
    // Note: If no weather messages match, the slot is skipped entirely (see useEffect above)
    content = renderMessage(currentWeatherMessage);
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
