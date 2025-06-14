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
import Footer from './Footer';
import { fetchPrayerTimes, RawPrayerTimes } from '@/app/FetchPrayerTimes';

// Environment variables
const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY!;
const OPENWEATHER_LAT = process.env.NEXT_PUBLIC_OPENWEATHER_LAT!;
const OPENWEATHER_LON = process.env.NEXT_PUBLIC_OPENWEATHER_LON!;

// Display durations
const DISPLAY_MS = 20_000;
const CACHE_DURATION = 10 * 60 * 1000;

// Slot sequence
const slots = [
  { type: 'special', component: Welcome },
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
}

export default function Rotator() {
  const all = useMessages();
  const [prayerTimes, setPrayerTimes] = useState<RawPrayerTimes | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const valid = useValidMessages(all, prayerTimes, weatherData?.condition || null);

  const [index, setIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState<MessageWithConditions | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Fetch prayer times on mount
  useEffect(() => {
    fetchPrayerTimes()
      .then(setPrayerTimes)
      .catch(err => console.error('[prayer] Failed to load:', err));
  }, []);

  // Fetch & cache weather data
  useEffect(() => {
    async function loadWeather(force = false) {
      try {
        const stored = localStorage.getItem('weatherData');
        const ts = localStorage.getItem('weatherTimestamp');
        if (!force && stored && ts && Date.now() - +ts < CACHE_DURATION) {
          setWeatherData(JSON.parse(stored));
        } else {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${OPENWEATHER_LAT}&lon=${OPENWEATHER_LON}&appid=${OPENWEATHER_API_KEY}`
          );
          const data = await res.json();
          const temp = Math.round((data.main?.temp ?? 273.15) - 273.15);
          const map: Record<string, string> = {
            Clouds: 'Cloudy',
            Rain: 'Rain',
            Drizzle: 'Drizzle',
            Snow: 'Snow',
            Thunderstorm: 'Thunder',
          };
          const condition = map[data.weather?.[0]?.main] ?? 'Clear';
          const wd = { temp, condition };
          setWeatherData(wd);
          localStorage.setItem('weatherData', JSON.stringify(wd));
          localStorage.setItem('weatherTimestamp', Date.now().toString());
        }
      } catch (err) {
        console.error('[weather] Failed to load:', err);
        setWeatherData(null);
      }
    }
    loadWeather();
    const iv = setInterval(() => loadWeather(true), CACHE_DURATION);
    return () => clearInterval(iv);
  }, []);

  // On message slot: pick a random valid
  useEffect(() => {
    if (slots[index].type === 'message') {
      setCurrentMessage(
        valid.length ? valid[Math.floor(Math.random() * valid.length)] : null
      );
    }
  }, [index, valid]);

  // Advance slot on fixed interval
  useEffect(() => {
    const iv = setInterval(() => {
      setIndex(i => (i + 1) % slots.length);
    }, DISPLAY_MS);
    return () => clearInterval(iv);
  }, []);

  // GSAP entry/progress/exit timeline
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      // entry
      tl.from(containerRef.current, {
        autoAlpha: 0,
        y: 30,
        duration: 0.6,
        ease: 'power2.out',
      });
      // progress bar
      tl.set(progressRef.current, {
        width: '0%',
        backgroundColor: 'var(--accent-color)',
      });
      tl.to(
        progressRef.current,
        {
          width: '100%',
          backgroundColor: 'var(--x-accent-color)',
          duration: DISPLAY_MS / 1000,
          ease: 'none',
        },
        '<'
      );
      // exit
      tl.to(
        containerRef.current,
        {
          autoAlpha: 0,
          y: -30,
          duration: 0.6,
          ease: 'power1.in',
        },
        `-=${0.6}`
      );
    }, containerRef);

    return () => ctx.revert();
  }, [index]);

  // Render logic
  let content: React.ReactNode;
  const slot = slots[index];

  if (slot.type === 'message') {
    if (!currentMessage) {
      content = (
        <div className="flex-1 flex items-center justify-center">
          Loading…
        </div>
      );
    } else {
      const cm = currentMessage;
      content = (
        <>
          <div className="flex-1 flex items-center justify-between gap-8 overflow-hidden">
            <div
              className="flex-1 h-full overflow-hidden arabic-text rtl"
              style={{
                color: 'var(--text-color)',
                fontSize: 'var(--rotator-text-size)',
              }}
              dir="rtl"
            >
              {cm.sourceType === 'quran'
                ? cm.quran?.arabicText
                : cm.sourceType === 'hadith'
                ? cm.hadith?.arabicText
                : cm.other?.arabicText}
            </div>
            <div
              className="flex-1 h-full overflow-hidden"
              style={{
                color: 'var(--text-color)',
                fontSize: 'var(--rotator-text-size)',
              }}
            >
              {cm.sourceType === 'quran'
                ? cm.quran?.englishText
                : cm.sourceType === 'hadith'
                ? cm.hadith?.englishText
                : cm.other?.englishText}
            </div>
          </div>
          <Footer message={cm} />
        </>
      );
    }
  } else {
    // special slot
    const Special = slot.component as React.ComponentType<any>;

    // build props for each special
    const specialProps: Record<string, any> =
      Special === DateTimeWeather
        ? {
            temperature: weatherData?.temp ?? 0,
            condition: weatherData?.condition ?? 'Unknown',
            displayDuration: DISPLAY_MS,
          }
        : { displayDuration: DISPLAY_MS };

    content = (
      <div className="flex-1 flex items-center justify-center overflow-hidden p-8">
        <Special {...specialProps} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-full w-full overflow-hidden p-8"
      style={{
        backgroundImage:
          'linear-gradient(var(--background-start), var(--background-end))',
        '--rotator-text-size': '3.5rem',
      } as React.CSSProperties}
    >
      {content}
      <div
        ref={progressRef}
        className="absolute bottom-0 left-0 h-1 w-0"
      />
    </div>
  );
}
