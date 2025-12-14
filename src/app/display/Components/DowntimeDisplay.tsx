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
 * Two-column layout:
 * - Left: Date, time, and weather
 * - Right: Prayer times for the upcoming day
 */
export default function DowntimeDisplay() {
  const { prayerTimes, isRamadan } = usePrayerTimesContext();
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [nextDayPrayerTimes, setNextDayPrayerTimes] = useState<RawPrayerTimes | null>(null);
  const [nextDayDateLabel, setNextDayDateLabel] = useState<string>('');

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine if we're past midnight (showing "today's" times instead of "tomorrow's")
  // After midnight, the "next day" times are actually today's times
  const isAfterMidnight = now.getHours() < 12; // Before noon means we crossed midnight

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

      // Left column slide in from left
      tl.from(
        leftColRef.current,
        {
          autoAlpha: 0,
          x: -50,
          duration: 0.8,
          ease: 'power2.out',
        },
        '-=0.6'
      );

      // Right column slide in from right
      tl.from(
        rightColRef.current,
        {
          autoAlpha: 0,
          x: 50,
          duration: 0.8,
          ease: 'power2.out',
        },
        '-=0.6'
      );
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

  // Fetch next day's prayer times
  useEffect(() => {
    async function fetchNextDayTimes() {
      try {
        const tomorrowDate = getTomorrowDateString();
        const times = await getPrayerTimesByDate(tomorrowDate);
        setNextDayPrayerTimes(times);

        // Create a nice label for the date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setNextDayDateLabel(
          tomorrow.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
          })
        );
      } catch (error) {
        console.error('[DowntimeDisplay] Failed to fetch next day prayer times:', error);
      }
    }

    fetchNextDayTimes();
  }, []);

  // Format time - larger display
  const time = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const seconds = now.toLocaleTimeString('en-GB', { second: '2-digit' }).slice(-2);

  // Format dates
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

  // Prayer times label - "Today's" if after midnight, "Tomorrow's" if before
  const prayerTimesLabel = isAfterMidnight ? "Today's Prayer Times" : "Tomorrow's Prayer Times";

  return (
    <div
      ref={containerRef}
      className="w-full h-screen flex items-center justify-center p-12 relative"
      style={{
        backgroundImage: 'linear-gradient(var(--background-start), var(--background-end))',
        color: 'var(--text-color)',
      }}
    >
      {/* Dimming overlay for off-peak feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'var(--overlay-dark)',
        }}
      />

      {/* Two-column layout */}
      <div className="relative z-10 grid grid-cols-2 gap-16 w-full max-w-[1800px] h-full items-center">
        {/* Left Column: Date, Time, Weather */}
        <div ref={leftColRef} className="flex flex-col justify-center space-y-8">
          {/* Main time display - extra large */}
          <div className="text-center">
            <div className="flex items-baseline justify-center">
              <span
                className="font-extrabold"
                style={{ fontSize: '14rem', lineHeight: 1, letterSpacing: '-0.02em' }}
              >
                {time}
              </span>
              <span
                className="font-light opacity-50 ml-4"
                style={{ fontSize: '4rem' }}
              >
                :{seconds}
              </span>
            </div>
          </div>

          {/* Date display - larger */}
          <div className="text-center space-y-3">
            <div className="text-6xl font-bold opacity-90">{gregorianDate}</div>
            <div className="text-5xl opacity-70">{hijriDate}</div>
          </div>

          {/* Weather display - larger */}
          {weather && (
            <div className="flex items-center justify-center gap-8 mt-8">
              <div
                className="p-6 rounded-3xl"
                style={{ backgroundColor: 'var(--secondary-color)', opacity: 0.8 }}
              >
                <img
                  src={`https://openweathermap.org/img/wn/${weather.iconCode}@4x.png`}
                  alt={weather.condition}
                  className="w-40 h-40"
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-8xl font-extrabold">{weather.temp}°C</span>
                <span className="text-4xl uppercase opacity-80">{weather.condition}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Prayer Times */}
        <div ref={rightColRef} className="flex flex-col justify-center">
          {/* Header */}
          <div
            className="text-4xl font-semibold uppercase tracking-wider opacity-70 mb-8 text-center"
            style={{ letterSpacing: '0.1em' }}
          >
            {prayerTimesLabel}
          </div>

          {/* Date label */}
          {nextDayDateLabel && (
            <div className="text-3xl opacity-60 mb-10 text-center">
              {nextDayDateLabel}
            </div>
          )}

          {/* Prayer times grid - vertical layout for larger display */}
          {nextDayPrayerTimes ? (
            <div className="flex flex-col gap-5">
              {PRAYER_ORDER.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-6 px-10 rounded-2xl"
                  style={{
                    backgroundColor: 'var(--secondary-color)',
                    opacity: 0.9,
                  }}
                >
                  <span className="text-4xl font-semibold uppercase tracking-wide opacity-90">
                    {label}
                  </span>
                  <span className="text-5xl font-bold">
                    {nextDayPrayerTimes[key as keyof RawPrayerTimes]}
                  </span>
                </div>
              ))}
            </div>
          ) : prayerTimes ? (
            // Fallback to current day's Fajr if next day times not available
            <div className="text-center">
              <div className="text-3xl font-semibold uppercase tracking-wider opacity-60 mb-4">
                Next Fajr
              </div>
              <div className="text-7xl font-bold">{prayerTimes.fajrJamaat}</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Subtle branding at bottom */}
      <div
        className="absolute bottom-8 text-xl font-light uppercase opacity-30 z-10"
        style={{ letterSpacing: '0.2em' }}
      >
        Off-Peak Mode{isRamadan ? ' • Ramadan' : ''}
      </div>
    </div>
  );
}
