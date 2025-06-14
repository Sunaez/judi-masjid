// src/app/display/Components/Rotator/Specials/DateTimeWeather.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

interface DateTimeWeatherProps {
  temperature: number;
  condition: string;
  displayDuration: number;
}

const ICON_MAP: Record<string, string> = {
  Clear: '01',
  Cloudy: '03',
  Rain: '10',
  Snow: '13',
  Sleet: '13',
  Drizzle: '09',
  Fog: '50',
  Thunder: '11',
  Thunderstorm: '11',
  Ice: '13',
};

export default function DateTimeWeather({
  temperature,
  condition,
  displayDuration,
}: DateTimeWeatherProps) {
  const [now, setNow] = useState(new Date());
  const rootRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLImageElement>(null);

  // Update clock every second
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // GSAP timeline
  useEffect(() => {
    const entry = 0.6;
    const exit = 0.6;
    const idle = Math.max(0, displayDuration / 1000 - entry - exit);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Entry: container fades + slides up
      tl.from(rootRef.current, {
        autoAlpha: 0,
        y: 50,
        duration: entry,
        ease: 'power2.out',
      });

      // Soft icon fade + scale-in (no rotation, no elastic)
      tl.from(
        iconRef.current,
        {
          autoAlpha: 0,
          scale: 0.8,
          duration: 0.6,
          ease: 'power2.out',
        },
        `-=${entry / 2}`
      );

      // Text sliding in
      tl.from(
        '.dtw-text',
        {
          x: -30,
          autoAlpha: 0,
          stagger: 0.2,
          duration: 0.7,
          ease: 'power2.out',
        },
        `-=${entry / 2}`
      );

      // Idle: gentle icon float
      tl.to(
        iconRef.current,
        {
          y: -20,
          repeat: -1,
          yoyo: true,
          duration: 2.5,
          ease: 'sine.inOut',
        },
        `+=0.2`
      );

      // Exit: text slides out
      tl.to(
        '.dtw-text',
        {
          x: 30,
          autoAlpha: 0,
          stagger: 0.2,
          duration: exit,
          ease: 'power1.in',
        },
        `+=${idle}`
      );
      // Exit: icon shrinks + fades
      tl.to(
        iconRef.current,
        {
          scale: 0.5,
          autoAlpha: 0,
          duration: exit,
          ease: 'power1.in',
        },
        `<`
      );
      // Exit: container slides up + fades
      tl.to(
        rootRef.current,
        {
          autoAlpha: 0,
          y: -50,
          duration: 0.4,
          ease: 'power1.in',
        },
        `-=${exit / 2}`
      );
    }, rootRef);

    return () => ctx.revert();
  }, [displayDuration]);

  // Determine icon URL
  const code = ICON_MAP[condition] || '01';
  const hour = now.getHours();
  const dn = hour >= 6 && hour < 18 ? 'd' : 'n';
  const iconUrl = `https://openweathermap.org/img/wn/${code}${dn}@4x.png`;

  // Format dates
  const longDate = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const time = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const hijri = new Intl.DateTimeFormat('en-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  return (
    <div
      ref={rootRef}
      className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-16 p-10"
      style={{ color: 'var(--text-color)' }}
    >
      {/* Left column: Dates & Time */}
      <div className="flex flex-col justify-center items-center space-y-8 text-center">
        <div className="dtw-text text-6xl font-bold">{longDate}</div>
        <div className="dtw-text text-5xl opacity-80">{hijri}</div>
        <div className="dtw-text text-8xl font-extrabold">{time}</div>
      </div>

      {/* Right column: Weather */}
      <div className="flex flex-col justify-center items-center space-y-8">
        <div
          className="p-6 rounded-2xl"
          style={{ backgroundColor: 'var(--secondary-color)' }}
        >
          <img
            ref={iconRef}
            src={iconUrl}
            alt={condition}
            className="w-72 h-72"
          />
        </div>
        <div className="dtw-text flex items-baseline space-x-6">
          <span className="text-9xl font-extrabold">{temperature}°C</span>
          <span className="text-5xl uppercase opacity-90">{condition}</span>
        </div>
      </div>
    </div>
  );
}
