// src/app/display/Components/DowntimeDisplay.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePrayerTimesContext } from '../context/PrayerTimesContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface WeatherData {
  temp: number;
  condition: string;
  iconCode: string;
}

/**
 * Simplified display for off-peak hours (1hr after Isha to 1hr before Fajr).
 * Shows minimal information with darker, power-saving styling:
 * - Current time (large)
 * - Current date (Gregorian + Hijri)
 * - Weather (simple)
 * - Next Fajr time
 */
export default function DowntimeDisplay() {
  const { prayerTimes } = usePrayerTimesContext();
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch cached weather (no API calls during downtime to save resources)
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

  // Fetch weather on mount and every 10 minutes
  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60_000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

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
      <div className="text-center mb-12">
        <div className="flex items-baseline justify-center">
          <span
            style={{
              fontSize: '20vmin',
              fontWeight: 200,
              letterSpacing: '-0.02em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {time}
          </span>
          <span
            style={{
              fontSize: '6vmin',
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
      <div className="text-center mb-12 space-y-2">
        <div
          style={{
            fontSize: '3vmin',
            fontWeight: 400,
            opacity: 0.8,
          }}
        >
          {gregorianDate}
        </div>
        <div
          style={{
            fontSize: '2.5vmin',
            fontWeight: 300,
            opacity: 0.6,
          }}
        >
          {hijriDate}
        </div>
      </div>

      {/* Bottom row: Weather and Next Fajr */}
      <div className="flex items-center justify-center gap-16 mt-8">
        {/* Weather */}
        {weather && (
          <div className="flex items-center gap-4">
            <img
              src={`https://openweathermap.org/img/wn/${weather.iconCode}@2x.png`}
              alt={weather.condition}
              style={{
                width: '8vmin',
                height: '8vmin',
                opacity: 0.8,
              }}
            />
            <div className="text-center">
              <div
                style={{
                  fontSize: '4vmin',
                  fontWeight: 300,
                }}
              >
                {weather.temp}°C
              </div>
              <div
                style={{
                  fontSize: '2vmin',
                  fontWeight: 300,
                  opacity: 0.6,
                  textTransform: 'uppercase',
                }}
              >
                {weather.condition}
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        {weather && prayerTimes && (
          <div
            style={{
              width: '1px',
              height: '8vmin',
              backgroundColor: 'rgba(255,255,255,0.2)',
            }}
          />
        )}

        {/* Next Fajr */}
        {prayerTimes && (
          <div className="text-center">
            <div
              style={{
                fontSize: '2vmin',
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
                fontSize: '4vmin',
                fontWeight: 300,
              }}
            >
              {prayerTimes.fajrJamaat}
            </div>
          </div>
        )}
      </div>

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
        Off-Peak Mode
      </div>
    </div>
  );
}
