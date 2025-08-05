'use client';

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { fetchPrayerTimes, RawPrayerTimes } from '@/app/FetchPrayerTimes';

interface PrayerTableProps {
  /** How long this panel stays on screen (ms) */
  displayDuration: number;
}

const DARK_PRAYERS = new Set(['Fajr', 'Maghrib', 'Isha']);

export default function PrayerTable({ displayDuration }: PrayerTableProps) {
  const [prayerTimes, setPrayerTimes] = useState<RawPrayerTimes | null>(null);
  const prevRef = useRef<RawPrayerTimes | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const entryDur = 0.6;
    const exitDur = 0.6;
    const idleSec = Math.max(0, displayDuration / 1000 - entryDur - exitDur);

    const ctx = gsap.context(() => {
      const items = containerRef.current!.querySelectorAll<HTMLElement>('[data-prayer]');
      const tl = gsap.timeline();

      // staggered entry: slide up + fade in, with a little overshoot
      tl.from(
        items,
        {
          y: 50,
          autoAlpha: 0,
          duration: entryDur,
          ease: 'back.out(1.7)',
          stagger: 0.1,
        },
        0
      );

      // wait…
      tl.to({}, { duration: idleSec });

      // staggered exit: slide up + fade out
      tl.to(
        items,
        {
          y: -30,
          autoAlpha: 0,
          duration: exitDur,
          ease: 'power1.in',
          stagger: 0.1,
        },
        `+=0`
      );
    }, containerRef);

    return () => ctx.revert();
  }, [displayDuration, prayerTimes]);

  if (!prayerTimes) {
    return (
      <div className="flex-1 flex items-center justify-center">
        Loading prayer times…
      </div>
    );
  }

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const allTimes = [
    { name: 'Fajr',    time: prayerTimes.fajrJamaat },
    { name: 'Dhuhr',   time: prayerTimes.dhuhrJamaat },
    { name: 'Asr',     time: prayerTimes.asrJamaat },
    { name: 'Maghrib', time: prayerTimes.maghrib      },
    { name: 'Isha',    time: prayerTimes.ishaJamaat   },
  ];
  const upcoming = allTimes.filter(({ time }) => toMin(time) > currentMin);

  if (upcoming.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-3xl font-semibold">
        All prayers for today have passed.
      </div>
    );
  }

  const nextIndex = 0;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        width: '100%',
        height: '100%',
        gridTemplateRows: '1fr 2fr',
        gridTemplateColumns: `repeat(${upcoming.length}, 1fr)`,
      }}
    >
      {upcoming.map(({ name, time }, i) => {
        const wasDark = DARK_PRAYERS.has(name);
        const isNext = i === nextIndex;

        const nameBg = wasDark
          ? 'var(--static-light-accent-color)'
          : 'var(--static-dark-accent-color)';
        const timeBg = wasDark
          ? 'var(--static-dark-background-end)'
          : 'var(--static-light-background-end)';
        const textColor = nameBg.includes('light')
          ? 'var(--static-dark-text-color)'
          : 'var(--static-light-text-color)';
        const borderStyle = isNext
          ? `4px solid var(--secondary-color)`
          : `1px solid var(--secondary-color)`;

        return (
          <div
            key={name}
            data-prayer
            style={{
              gridRow: '1 / span 2',
              gridColumn: i + 1,
              display: 'flex',
              flexDirection: 'column',
              border: borderStyle,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                flex: 1,
                backgroundColor: nameBg,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '6vmin',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {name}
              </span>
            </div>
            <div
              style={{
                flex: 2,
                backgroundColor: timeBg,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '10vmin',
                  fontWeight: 800,
                }}
              >
                {time}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}