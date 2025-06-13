// src\app\display\Components\Rotator\index.tsx
'use client';

import React, { useEffect, useState } from 'react';
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

  // Fetch prayer times once on mount
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
          const cached = JSON.parse(stored) as WeatherData;
          console.log('[weather] Using cached data →', cached);
          setWeatherData(cached);
          return;
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${OPENWEATHER_LAT}&lon=${OPENWEATHER_LON}&appid=${OPENWEATHER_API_KEY}`;
        console.log('[weather] Fetching URL →', url);

        const res = await fetch(url);
        const data = await res.json();
        console.log('[weather] Raw OpenWeather response →', data);

        // Temperature from Kelvin to Celsius
        const kelvin = data.main?.temp ?? 0;
        const temp = Math.round(kelvin - 273.15);

        // Map OpenWeather "main" to our friendly strings
        const main = data.weather?.[0]?.main || 'Clear';
        const map: Record<string, string> = {
          Clouds: 'Cloudy',
          Rain: 'Rain',
          Drizzle: 'Drizzle',
          Snow: 'Snow',
          Thunderstorm: 'Thunder',
        };
        const condition = map[main] ?? 'Clear';

        const wd: WeatherData = { temp, condition };
        console.log('[weather] Processed WeatherData →', wd);

        setWeatherData(wd);
        localStorage.setItem('weatherData', JSON.stringify(wd));
        localStorage.setItem('weatherTimestamp', Date.now().toString());
      } catch (err) {
        console.error('[weather] Failed to load:', err);
        setWeatherData(null);
      }
    }

    loadWeather();
    const iv = setInterval(() => loadWeather(true), CACHE_DURATION);
    return () => clearInterval(iv);
  }, []);

  // Pick a new random message when slot changes
  useEffect(() => {
    if (slots[index].type === 'message') {
      setCurrentMessage(
        valid.length
          ? valid[Math.floor(Math.random() * valid.length)]
          : null
      );
    }
  }, [index, valid]);

  // Rotate slots on a fixed interval
  useEffect(() => {
    const iv = setInterval(
      () => setIndex(i => (i + 1) % slots.length),
      DISPLAY_MS
    );
    return () => clearInterval(iv);
  }, []);

  const slot = slots[index];

  // Loading state for messages
  if (slot.type === 'message' && !currentMessage) {
    return (
      <div className="flex-1 flex items-center justify-center">
        Loading…
      </div>
    );
  }

  // Special components (Welcome, Weather, etc.)
  if (slot.type === 'special') {
    const Special = slot.component as React.ComponentType<any>;
    if (Special === DateTimeWeather) {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <DateTimeWeather
            temperature={weatherData?.temp ?? 0}
            condition={weatherData?.condition ?? 'Unknown'}
          />
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Special />
      </div>
    );
  }

  // Regular message slot
  const current = currentMessage!;
  return (
    <div
      className="relative flex flex-col h-full w-full p-8"
      style={{
        backgroundImage:
          'linear-gradient(var(--background-start), var(--background-end))',
        '--rotator-text-size': '3.5rem',
      } as React.CSSProperties}
    >
      <div className="flex-1 flex items-center justify-between gap-8">
        <div
          className="w-1/2 h-full overflow-hidden"
          style={{ color: 'var(--text-color)' }}
        >
          <div
            dir="rtl"
            className="arabic-text rtl"
            style={{ fontSize: 'var(--rotator-text-size)' }}
          >
            {current.sourceType === 'quran'
              ? current.quran?.arabicText
              : current.sourceType === 'hadith'
              ? current.hadith?.arabicText
              : current.other?.arabicText}
          </div>
        </div>
        <div
          className="w-1/2 h-full overflow-hidden"
          style={{ color: 'var(--text-color)' }}
        >
          <div style={{ fontSize: 'var(--rotator-text-size)' }}>
            {current.sourceType === 'quran'
              ? current.quran?.englishText
              : current.sourceType === 'hadith'
              ? current.hadith?.englishText
              : current.other?.englishText}
          </div>
        </div>
      </div>
      <Footer message={current} />
    </div>
  );
}
