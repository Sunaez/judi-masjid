// src/app/display/Components/DowntimeDisplay.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
 * Shows minimal information with darker, power-saving styling:
 * - Current time (large)
 * - Current date (Gregorian + Hijri)
 * - Weather (fetched hourly)
 * - Next day's prayer times table
 */
export default function DowntimeDisplay() {
  const { prayerTimes, isRamadan } = usePrayerTimesContext();
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [tomorrowPrayerTimes, setTomorrowPrayerTimes] = useState<RawPrayerTimes | null>(null);
  const [tomorrowDateLabel, setTomorrowDateLabel] = useState<string>('');

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
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

  // Format date
  const gregorianDate = now.toLocaleDateString('en-GB', {
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
      className="w-full h-screen flex flex-col items-center justify-center p-8"
      style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)',
        color: '#e0e0e0',
      }}
    >
      {/* Main time display */}
      <div className="text-center mb-8">
        <div className="flex items-baseline justify-center">
          <span
            style={{
              fontSize: '18vmin',
              fontWeight: 200,
              letterSpacing: '-0.02em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {time}
          </span>
          <span
            style={{
              fontSize: '5vmin',
              fontWeight: 300,
              opacity: 0.5,
              marginLeft: '0.5rem',
            }}
          >
            :{seconds}
          </span>
        </div>
      </div>

      {/* Date row */}
      <div className="text-center mb-8 space-y-1">
        <div
          style={{
            fontSize: '2.5vmin',
            fontWeight: 400,
            opacity: 0.8,
          }}
        >
          {gregorianDate}
        </div>
        <div
          style={{
            fontSize: '2vmin',
            fontWeight: 300,
            opacity: 0.6,
          }}
        >
          {hijriDate}
        </div>
      </div>

      {/* Weather row */}
      {weather && (
        <div className="flex items-center gap-4 mb-8">
          <img
            src={`https://openweathermap.org/img/wn/${weather.iconCode}@2x.png`}
            alt={weather.condition}
            style={{
              width: '6vmin',
              height: '6vmin',
              opacity: 0.8,
            }}
          />
          <div className="flex items-baseline gap-2">
            <span
              style={{
                fontSize: '3vmin',
                fontWeight: 300,
              }}
            >
              {weather.temp}°C
            </span>
            <span
              style={{
                fontSize: '1.8vmin',
                fontWeight: 300,
                opacity: 0.6,
                textTransform: 'uppercase',
              }}
            >
              {weather.condition}
            </span>
          </div>
        </div>
      )}

      {/* Tomorrow's Prayer Times Table */}
      {tomorrowPrayerTimes && (
        <div className="mt-4">
          <div
            style={{
              fontSize: '1.8vmin',
              fontWeight: 400,
              opacity: 0.6,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
              textAlign: 'center',
            }}
          >
            Tomorrow&apos;s Prayer Times • {tomorrowDateLabel}
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${PRAYER_ORDER.length}, 1fr)`,
              gap: '2vmin',
            }}
          >
            {PRAYER_ORDER.map(({ key, label }) => (
              <div
                key={key}
                className="text-center"
                style={{
                  padding: '1.5vmin 2vmin',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '0.5vmin',
                }}
              >
                <div
                  style={{
                    fontSize: '1.5vmin',
                    fontWeight: 500,
                    opacity: 0.7,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5vmin',
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: '2.5vmin',
                    fontWeight: 300,
                  }}
                >
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
          <div
            style={{
              fontSize: '1.8vmin',
              fontWeight: 400,
              opacity: 0.6,
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            Next Fajr
          </div>
          <div
            style={{
              fontSize: '3.5vmin',
              fontWeight: 300,
            }}
          >
            {prayerTimes.fajrJamaat}
          </div>
        </div>
      )}

      {/* Subtle mosque name/branding at bottom */}
      <div
        className="absolute bottom-8"
        style={{
          fontSize: '1.5vmin',
          fontWeight: 300,
          opacity: 0.3,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
        }}
      >
        Off-Peak Mode{isRamadan ? ' • Ramadan' : ''}
      </div>
    </div>
  );
}
