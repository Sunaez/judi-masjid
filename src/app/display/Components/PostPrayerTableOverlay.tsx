'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { usePrayerTimesContext } from '../context/PrayerTimesContext';
import { useDebugContext } from '../context/DebugContext';
import { findActivePostPrayerEvent, getJamaatRows } from '@/lib/prayerTimeUtils';

const WINDOW_MINUTES = 5;
const TEST_PREVIEW_MS = 6_000;

export default function PostPrayerTableOverlay() {
  const { prayerTimes, isLoading, isRamadan } = usePrayerTimesContext();
  const { postPrayerTableTestSignal, ramadanPreviewActive } = useDebugContext();
  const [now, setNow] = useState(() => new Date());
  const [testMode, setTestMode] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const effectiveRamadan = isRamadan || ramadanPreviewActive;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (postPrayerTableTestSignal <= 0) return;

    setTestMode(true);
    const timer = setTimeout(() => setTestMode(false), TEST_PREVIEW_MS);
    return () => clearTimeout(timer);
  }, [postPrayerTableTestSignal]);

  const activePostPrayer = useMemo(
    () =>
      testMode
        ? { name: 'Test Prayer', time: '--:--', minutesSinceStart: 0 }
        : findActivePostPrayerEvent(prayerTimes, now, effectiveRamadan, WINDOW_MINUTES),
    [prayerTimes, now, effectiveRamadan, testMode]
  );

  const rows = useMemo(() => {
    if (!prayerTimes) return [];
    return getJamaatRows(prayerTimes, effectiveRamadan);
  }, [prayerTimes, effectiveRamadan]);

  useEffect(() => {
    if (!activePostPrayer || !rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        rootRef.current,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [activePostPrayer?.name, activePostPrayer?.time]);

  if (isLoading || !prayerTimes || !activePostPrayer) {
    return null;
  }

  const minutesRemaining = WINDOW_MINUTES - activePostPrayer.minutesSinceStart;
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
      ref={rootRef}
      data-testid="post-prayer-table-overlay"
      className="fixed inset-0 z-[55] flex items-center justify-center p-10"
      style={{
        background: 'var(--overlay-darkest)',
        color: 'var(--text-color)',
      }}
    >
      <div
        className="w-full max-w-[1700px] rounded-3xl p-10"
        style={{ backgroundColor: 'var(--background-end)' }}
      >
        <div className="text-center mb-6">
          <h2 className="text-7xl font-bold" style={{ color: 'var(--accent-color)' }}>
            {testMode ? 'Post-Prayer Table Preview' : `${activePostPrayer.name} Jamaat Completed`}
          </h2>
          <p className="text-4xl mt-3 opacity-90">
            Post-prayer timetable showing for {minutesRemaining} more minute{minutesRemaining === 1 ? '' : 's'}
          </p>
          <p className="text-3xl mt-4 opacity-70">{gregorianDate}</p>
          <p className="text-3xl opacity-70">{hijriDate}</p>
        </div>

        <table className="w-full border-collapse overflow-hidden rounded-2xl text-center">
          <thead>
            <tr>
              <th
                className="py-5 text-4xl border border-[var(--secondary-color)]"
                style={{ backgroundColor: 'var(--secondary-color)' }}
              >
                Prayer
              </th>
              <th
                className="py-5 text-4xl border border-[var(--secondary-color)]"
                style={{ backgroundColor: 'var(--secondary-color)' }}
              >
                Start Time
              </th>
              <th
                className="py-5 text-4xl border border-[var(--secondary-color)]"
                style={{ backgroundColor: 'var(--accent-color)', color: 'var(--background-end)' }}
              >
                Jamaat Time
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.name}>
                <td
                  className="py-5 text-5xl font-semibold border border-[var(--secondary-color)]"
                  style={{ backgroundColor: 'var(--secondary-color)' }}
                >
                  {row.name}
                </td>
                <td className="py-5 text-6xl font-bold border border-[var(--secondary-color)]">
                  {row.startTime}
                </td>
                <td className="py-5 text-6xl font-bold border border-[var(--secondary-color)]">
                  {row.jamaatTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
