// src/app/display/Components/Rotator/Specials/PrayerTable.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { fetchPrayerTimes, RawPrayerTimes } from '@/app/FetchPrayerTimes';

interface PrayerTableProps {
  displayDuration: number;
}

export default function PrayerTable({ displayDuration }: PrayerTableProps) {
  const [prayerTimes, setPrayerTimes] = useState<RawPrayerTimes | null>(null);
  const prevRef = useRef<RawPrayerTimes | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch every 5 minutes, update only if changed
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPrayerTimes();
        if (!prevRef.current || JSON.stringify(data) !== JSON.stringify(prevRef.current)) {
          setPrayerTimes(data);
          prevRef.current = data;
        }
      } catch (err) {
        console.error('[prayer] Fetch error:', err);
      }
    }
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // GSAP entry/exit animation
  useEffect(() => {
    if (!containerRef.current) return;
    const entry = 0.6;
    const exit = 0.6;
    const idle = Math.max(0, displayDuration / 1000 - entry - exit);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from(containerRef.current, { autoAlpha: 0, y: 50, duration: entry, ease: 'power2.out' });
      tl.to(containerRef.current, { autoAlpha: 0, y: -50, duration: exit, ease: 'power1.in' }, `+=${idle}`);
    }, containerRef);
    return () => ctx.revert();
  }, [displayDuration, prayerTimes]);

  if (!prayerTimes) {
    return <div className="flex-1 flex items-center justify-center">Loading prayer times…</div>;
  }

  // Helpers: current time in minutes
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const times: [string, string][] = [
    ['Fajr', prayerTimes.fajrJamaat],
    ['Dhuhr', prayerTimes.dhuhrJamaat],
    ['Asr', prayerTimes.asrJamaat],
    ['Maghrib', prayerTimes.maghrib],
    ['Isha', prayerTimes.ishaJamaat],
  ];

  // CSS vars for customization
  // --prayer-header-size, --prayer-header-weight
  // --prayer-time-size,   --prayer-time-weight
  // --prayer-row-height,  --prayer-blur-amount
  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center"
      style={{
        '--prayer-header-size': '6rem',
        '--prayer-header-weight': '800',
        '--prayer-time-size': '8rem',
        '--prayer-time-weight': '700',
        '--prayer-row-height': '6rem',
        '--prayer-blur-amount': '1px',
      } as React.CSSProperties}
    >
      <table className="w-full h-full border border-solid border-gray-300" role="table">
        <thead className="bg-gray-100">
          <tr>
            {times.map(([name, time]) => {
              const past = currentMin >= toMin(time);
              const thClass = 'border border-gray-300 text-center';
              return (
                <th
                  key={name}
                  className={thClass}
                  style={{
                    fontSize: 'var(--prayer-header-size)',
                    fontWeight: 'var(--prayer-header-weight)',
                    height: 'var(--prayer-row-height)',
                    filter: past ? 'blur(var(--prayer-blur-amount))' : 'none',
                  }}
                >
                  {name}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            {times.map(([name, time]) => {
              const past = currentMin >= toMin(time);
              const tdClass = 'border border-gray-300 text-center';
              return (
                <td
                  key={name}
                  className={tdClass}
                  style={{
                    fontSize: 'var(--prayer-time-size)',
                    fontWeight: 'var(--prayer-time-weight)',
                    height: 'var(--prayer-row-height)',
                    filter: past ? 'blur(var(--prayer-blur-amount))' : 'none',
                  }}
                >
                  {time}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
