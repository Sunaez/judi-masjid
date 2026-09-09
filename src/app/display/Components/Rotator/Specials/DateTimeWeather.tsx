'use client';
import { MOSQUE_TIME_ZONE } from '@/lib/mosqueClock';

import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

interface DateTimeWeatherProps {
  temperature: number | null;
  condition: string;
  iconCode: string;           // e.g. "10d"
  displayDuration: number;
}

export default function DateTimeWeather({
  temperature,
  condition,
  iconCode,
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

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      // Entry: container fade + slide
      tl.from(rootRef.current, {
        autoAlpha: 0,
        y: 50,
        duration: entry,
        ease: 'power2.out',
      });
      // Icon fade + scale
      if (iconRef.current) tl.from(
        iconRef.current,
        { autoAlpha: 0, scale: 0.8, duration: entry, ease: 'power2.out' },
        `-=${entry / 2}`
      );
      // Text slide in
      tl.from(
        '.dtw-text',
        { x: -30, autoAlpha: 0, stagger: 0.2, duration: 0.7, ease: 'power2.out' },
        `-=${entry / 2}`
      );
      // Idle: gentle icon float
      if (iconRef.current) tl.to(
        iconRef.current,
        { y: -20, repeat: Math.max(0, Math.floor(displayDuration / 2500) - 2), yoyo: true, duration: 2.5, ease: 'sine.inOut' },
        `+=0.2`
      );
      // Exit: text slide out
      tl.to(
        '.dtw-text',
        { x: 30, autoAlpha: 0, stagger: 0.2, duration: exit, ease: 'power1.in' },
        Math.max(entry, displayDuration / 1000 - exit)
      );
      // Exit: icon shrink + fade
      if (iconRef.current) tl.to(
        iconRef.current,
        { scale: 0.5, autoAlpha: 0, duration: exit, ease: 'power1.in' },
        `<`
      );
      // Exit: container slide up + fade
      tl.to(
        rootRef.current,
        { autoAlpha: 0, y: -50, duration: 0.4, ease: 'power1.in' },
        `-=${exit / 2}`
      );
    }, rootRef);

    return () => ctx.revert();
  }, [displayDuration]);

  // Icon URL based on provided code
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

  // Format dates
  const longDate = now.toLocaleDateString(undefined, { timeZone: MOSQUE_TIME_ZONE,
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const time = now.toLocaleTimeString(undefined, { timeZone: MOSQUE_TIME_ZONE,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const hijri = new Intl.DateTimeFormat('en-u-ca-islamic', { timeZone: MOSQUE_TIME_ZONE,
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(now);

  return (
    <div
      ref={rootRef}
      className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-16 p-10"
      style={{ color: 'var(--text-color)' }}
    >
      {/* Left: Date & Time */}
      <div className="flex flex-col justify-center items-center space-y-8 text-center">
        <div className="dtw-text text-6xl font-bold">{longDate}</div>
        <div className="dtw-text text-5xl opacity-80">{hijri}</div>
        <div className="dtw-text text-8xl font-extrabold">{time}</div>
      </div>

      {/* Right: Weather */}
      <div className="flex flex-col justify-center items-center space-y-8">
        <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--secondary-color)' }}>
          {iconCode && <img
            key={iconCode}
            ref={iconRef}
            src={iconUrl}
            alt={condition}
            className="w-72 h-72"
            onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
          />}
        </div>
        <div className="dtw-text flex items-baseline space-x-6">
          <span className="text-9xl font-extrabold">{temperature === null ? '—' : `${temperature}°C`}</span>
          <span className="text-5xl uppercase opacity-90">{condition}</span>
        </div>
      </div>
    </div>
  );
}
