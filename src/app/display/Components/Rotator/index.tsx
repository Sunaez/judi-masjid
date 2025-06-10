// src/app/display/Components/Rotator/index.tsx
'use client';

import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import useMessages, { MessageWithConditions } from './Messages';
import useValidMessages from './Conditions';
import Specials from './Specials';
import Footer from './Footer';
import { fetchPrayerTimes, RawPrayerTimes } from '@/app/FetchPrayerTimes';

// env
const {
  NEXT_PUBLIC_OPENWEATHER_API_KEY: KEY,
  NEXT_PUBLIC_OPENWEATHER_LAT: LAT,
  NEXT_PUBLIC_OPENWEATHER_LON: LON,
} = process.env;

// rotation interval
const DISPLAY_MS = 45_000;

export default function Rotator() {
  // load & filter
  const all = useMessages();
  const [prayerTimes, setPrayerTimes]       = useState<RawPrayerTimes | null>(null);
  const [currentWeather, setCurrentWeather] = useState<string | null>(null);
  const valid = useValidMessages(all, prayerTimes, currentWeather);

  // current pick
  const [current, setCurrent] = useState<MessageWithConditions | null>(null);

  // refs for overflow
  const arabicRef  = useRef<HTMLDivElement | null>(null);
  const englishRef = useRef<HTMLDivElement | null>(null);
  const [arabicScroll,  setArabicScroll]  = useState({ distance: 0, duration: 0 });
  const [englishScroll, setEnglishScroll] = useState({ distance: 0, duration: 0 });

  // fetch prayer-times once
  useEffect(() => {
    fetchPrayerTimes().then(setPrayerTimes).catch(console.error);
  }, []);

  // fetch weather every 10 min
  useEffect(() => {
    async function loadWeather() {
      try {
        const res  = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${KEY}`
        );
        const js   = await res.json();
        const main = js.weather?.[0]?.main as string;
        let grp     = 'Clear';
        if (main === 'Clouds')       grp = 'Cloudy';
        else if (main === 'Rain')    grp = 'Rain';
        else if (main === 'Drizzle') grp = 'Drizzle';
        else if (main === 'Snow')    grp = 'Snow';
        else if (main === 'Thunderstorm') grp = 'Thunder';
        setCurrentWeather(grp);
      } catch {
        setCurrentWeather(null);
      }
    }
    loadWeather();
    const iv = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  // weighted random rotation
  useEffect(() => {
    if (!valid.length) {
      setCurrent(null);
      return;
    }
    const pool: MessageWithConditions[] = [];
    valid.forEach(m => {
      const special = m.conditions.some(c => c.type !== 'normal');
      const w = special ? 2 : 1;
      for (let i = 0; i < w; i++) pool.push(m);
    });
    const pick = () => setCurrent(pool[Math.floor(Math.random() * pool.length)]);
    pick();
    const iv = setInterval(pick, DISPLAY_MS);
    return () => clearInterval(iv);
  }, [valid]);

  // detect overflow & compute scroll
  useLayoutEffect(() => {
    if (arabicRef.current) {
      const d = arabicRef.current.scrollHeight - arabicRef.current.clientHeight;
      setArabicScroll(d > 0 ? { distance: d, duration: d / 20 } : { distance: 0, duration: 0 });
    }
    if (englishRef.current) {
      const d = englishRef.current.scrollHeight - englishRef.current.clientHeight;
      setEnglishScroll(d > 0 ? { distance: d, duration: d / 20 } : { distance: 0, duration: 0 });
    }
  }, [current]);

  if (!current) {
    return (
      <div className="flex-1 flex items-center justify-center">
        Loading…
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col h-full w-full p-8"
      style={{
        backgroundImage: 'linear-gradient(var(--background-start),var(--background-end))',
        '--rotator-text-size': '2.5rem',
      } as React.CSSProperties}
    >
      {/* scrolling keyframes */}
      <style jsx>{`
        @keyframes scrollUp {
          from { transform: translateY(0); }
          to   { transform: translateY(calc(-1 * var(--distance))); }
        }
      `}</style>

      {/* special conditions header */}
      <Specials conditions={current.conditions} />

      {/* content columns: fill all space, no manual scroll */}
      <div className="flex-1 flex items-center justify-between gap-8">
        {/* Arabic */}
        <div
          ref={arabicRef}
          className="w-1/2 h-full overflow-hidden"
          style={{ color: 'var(--text-color)' }}
        >
          <div
            dir="rtl"
            style={{
              fontSize: 'var(--rotator-text-size)',
              animation: arabicScroll.distance > 0
                ? `scrollUp ${arabicScroll.duration}s linear infinite alternate`
                : 'none',
              '--distance': `${arabicScroll.distance}px`,
            } as React.CSSProperties}
          >
            {current.sourceType === 'quran'
              ? current.quran?.arabicText
              : current.sourceType === 'hadith'
                ? current.hadith?.arabicText
                : current.other?.arabicText}
          </div>
        </div>

        {/* English */}
        <div
          ref={englishRef}
          className="w-1/2 h-full overflow-hidden"
          style={{ color: 'var(--text-color)' }}
        >
          <div
            style={{
              fontSize: 'var(--rotator-text-size)',
              animation: englishScroll.distance > 0
                ? `scrollUp ${englishScroll.duration}s linear infinite alternate`
                : 'none',
              '--distance': `${englishScroll.distance}px`,
            } as React.CSSProperties}
          >
            {current.sourceType === 'quran'
              ? current.quran?.englishText
              : current.sourceType === 'hadith'
                ? current.hadith?.englishText
                : current.other?.englishText}
          </div>
        </div>
      </div>

      {/* footer now shows “start-end” Ayah range */}
      <Footer message={current} />
    </div>
  );
}
