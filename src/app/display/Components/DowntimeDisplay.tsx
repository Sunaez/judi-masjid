// src/app/display/Components/DowntimeDisplay.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { usePrayerTimesContext } from '../context/PrayerTimesContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getPrayerTimesByDate, getTomorrowDateString } from '@/lib/firebase/prayerTimes';
import type { RawPrayerTimes } from '@/app/FetchPrayerTimes';

interface WeatherData {
  temp: number;
  condition: string;
  iconCode: string;
}

// Prayer display order for the table
const PRAYER_ORDER = [
  { key: 'fajrJamaat', label: 'Fajr' },
  { key: 'dhuhrJamaat', label: 'Dhuhr' },
  { key: 'asrJamaat', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'ishaJamaat', label: 'Isha' },
] as const;

/**
 * Simplified display for off-peak hours.
 * Uses the same CSS variables as the main display but with dimmed styling.
 * - Current time (large)
 * - Current date (Gregorian + Hijri)
 * - Weather (fetched hourly from cache)
 * - Next day's prayer times table
 */
export default function DowntimeDisplay() {
  const { prayerTimes, isRamadan } = usePrayerTimesContext();
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [tomorrowPrayerTimes, setTomorrowPrayerTimes] = useState<RawPrayerTimes | null>(null);
  const [tomorrowDateLabel, setTomorrowDateLabel] = useState<string>('');

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const weatherRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Entry animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Fade in container
      tl.from(containerRef.current, {
        autoAlpha: 0,
        duration: 1.2,
        ease: 'power2.out',
      });

      // Time fade in and scale
      tl.from(
        timeRef.current,
        {
          autoAlpha: 0,
          scale: 0.9,
          y: 30,
          duration: 0.8,
          ease: 'power2.out',
        },
        '-=0.6'
      );

      // Date slide in
      tl.from(
        dateRef.current,
        {
          autoAlpha: 0,
          y: 20,
          duration: 0.6,
          ease: 'power2.out',
        },
        '-=0.4'
      );

      // Weather fade in
      if (weatherRef.current) {
        tl.from(
          weatherRef.current,
          {
            autoAlpha: 0,
            x: -20,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.3'
        );
      }

      // Prayer times table fade in
      if (tableRef.current) {
        tl.from(
          tableRef.current,
          {
            autoAlpha: 0,
            y: 20,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.2'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Fetch cached weather from Firebase (no direct API calls during downtime)
  const fetchWeather = useCallback(async () => {
    try {
      const weatherDoc = await getDoc(doc(db, 'weather', 'current'));
      if (weatherDoc.exists()) {
        const data = weatherDoc.data();
        setWeather({
          temp: data.temp,
          condition: data.condition,
          iconCode: data.iconCode,
        });
      }
    } catch (error) {
      console.error('[DowntimeDisplay] Failed to fetch weather:', error);
    }
  }, []);

  // Fetch weather on mount and every hour (reduced frequency for downtime)
  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 60 * 60_000); // Every hour
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Fetch tomorrow's prayer times
  useEffect(() => {
    async function fetchTomorrowTimes() {
      try {
        const tomorrowDate = getTomorrowDateString();
        const times = await getPrayerTimesByDate(tomorrowDate);
        setTomorrowPrayerTimes(times);

        // Create a nice label for tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setTomorrowDateLabel(
          tomorrow.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
          })
        );
      } catch (error) {
        console.error('[DowntimeDisplay] Failed to fetch tomorrow prayer times:', error);
      }
    }

    fetchTomorrowTimes();
  }, []);

  // Format time
  const time = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const seconds = now.toLocaleTimeString('en-GB', { second: '2-digit' }).slice(-2);

  // Format dates - same as DateTimeWeather component
  const gregorianDate = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const hijriDate = new Intl.DateTimeFormat('en-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen flex flex-col items-center justify-center p-8 relative"
      style={{
        backgroundImage: 'linear-gradient(var(--background-start), var(--background-end))',
        color: 'var(--text-color)',
      }}
    >
      {/* Dimming overlay for off-peak feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
        }}
      />

      {/* Content wrapper (above overlay) */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Main time display - matches DateTimeWeather font sizes */}
        <div ref={timeRef} className="text-center mb-8">
          <div className="flex items-baseline justify-center">
            <span className="text-9xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>
              {time}
            </span>
            <span className="text-5xl font-light opacity-50 ml-2">:{seconds}</span>
          </div>
        </div>

        {/* Date row - matches DateTimeWeather styling */}
        <div ref={dateRef} className="text-center mb-12 space-y-2">
          <div className="text-5xl font-bold opacity-90">{gregorianDate}</div>
          <div className="text-4xl opacity-70">{hijriDate}</div>
        </div>

        {/* Weather row - matches DateTimeWeather layout */}
        {weather && (
          <div ref={weatherRef} className="flex items-center gap-6 mb-12">
            <div
              className="p-4 rounded-2xl"
              style={{ backgroundColor: 'var(--secondary-color)', opacity: 0.8 }}
            >
              <img
                src={`https://openweathermap.org/img/wn/${weather.iconCode}@4x.png`}
                alt={weather.condition}
                className="w-32 h-32"
              />
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-7xl font-extrabold">{weather.temp}°C</span>
              <span className="text-3xl uppercase opacity-80">{weather.condition}</span>
            </div>
          </div>
        )}

        {/* Tomorrow's Prayer Times Table - matches PrayerTimeline styling */}
        {tomorrowPrayerTimes && (
          <div ref={tableRef} className="mt-4">
            <div
              className="text-2xl font-semibold uppercase tracking-wider opacity-60 mb-6 text-center"
              style={{ letterSpacing: '0.1em' }}
            >
              Tomorrow&apos;s Prayer Times • {tomorrowDateLabel}
            </div>
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${PRAYER_ORDER.length}, 1fr)`,
              }}
            >
              {PRAYER_ORDER.map(({ key, label }) => (
                <div
                  key={key}
                  className="text-center py-4 px-6 rounded-xl"
                  style={{
                    backgroundColor: 'var(--secondary-color)',
                    opacity: 0.9,
                  }}
                >
                  <div className="text-xl font-semibold uppercase tracking-wide opacity-80 mb-2">
                    {label}
                  </div>
                  <div className="text-4xl font-bold">
                    {tomorrowPrayerTimes[key as keyof RawPrayerTimes]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's next Fajr if tomorrow's times not available */}
        {!tomorrowPrayerTimes && prayerTimes && (
          <div className="text-center mt-4">
            <div className="text-2xl font-semibold uppercase tracking-wider opacity-60 mb-2">
              Next Fajr
            </div>
            <div className="text-6xl font-bold">{prayerTimes.fajrJamaat}</div>
          </div>
        )}
      </div>

      {/* Subtle branding at bottom */}
      <div
        className="absolute bottom-8 text-lg font-light uppercase opacity-30 z-10"
        style={{ letterSpacing: '0.2em' }}
      >
        Off-Peak Mode{isRamadan ? ' • Ramadan' : ''}
      </div>
    </div>
  );
}
