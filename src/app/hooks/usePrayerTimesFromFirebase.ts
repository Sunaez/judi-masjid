// src/app/hooks/usePrayerTimesFromFirebase.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import type { RawPrayerTimes } from '../FetchPrayerTimes';
import { getPrayerTimesByDate, getTodayDateString } from '@/lib/firebase/prayerTimes';

// turn an "HH:MM" string into a Date for today
function timeToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
}

// build the 3min-before → 5min-after windows for each prayer
function getBlockedWindows(times: RawPrayerTimes): [Date, Date][] {
  const keys: (keyof RawPrayerTimes)[] = [
    'fajrStart',
    'fajrJamaat',
    'sunrise',
    'dhuhrStart',
    'dhuhrJamaat',
    'asrStart',
    'asrJamaat',
    'maghrib',
    'ishaStart',
    'ishaJamaat',
  ];
  return keys.map(key => {
    const t = times[key]!;
    const base = timeToDate(t);
    return [
      new Date(base.getTime() - 3 * 60_000),
      new Date(base.getTime() + 5 * 60_000),
    ];
  });
}

// Efficient shallow comparison for prayer times
function prayerTimesEqual(a: RawPrayerTimes | null, b: RawPrayerTimes | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.fajrStart === b.fajrStart &&
    a.fajrJamaat === b.fajrJamaat &&
    a.sunrise === b.sunrise &&
    a.dhuhrStart === b.dhuhrStart &&
    a.dhuhrJamaat === b.dhuhrJamaat &&
    a.asrStart === b.asrStart &&
    a.asrJamaat === b.asrJamaat &&
    a.maghrib === b.maghrib &&
    a.ishaStart === b.ishaStart &&
    a.ishaJamaat === b.ishaJamaat
  );
}

/**
 * Hook that fetches prayer times from Firebase Firestore
 * - Fetches prayer times immediately for today's date
 * - Re-fetches every 5min except within 3m before → 5m after any prayer
 * - Updates React state only when the data actually changes
 * - Optimized with refs to avoid stale closures and efficient comparisons
 * - Falls back to null if no data found (admin needs to sync)
 */
export function usePrayerTimesFromFirebase() {
  const [times, setTimes] = useState<RawPrayerTimes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timesRef = useRef<RawPrayerTimes | null>(null);
  const timer = useRef<number | null>(null);
  const currentDateRef = useRef<string>(getTodayDateString());

  // Use callback ref pattern to always have current times
  const scheduleFetch = useCallback(async () => {
    try {
      const todayDate = getTodayDateString();

      // Check if date has changed (new day started)
      if (todayDate !== currentDateRef.current) {
        currentDateRef.current = todayDate;
        setIsLoading(true);
      }

      const newTimes = await getPrayerTimesByDate(todayDate);

      if (!newTimes) {
        setError(`No prayer times found for ${todayDate}. Please sync from Google Sheets.`);
        setIsLoading(false);
        return;
      }

      // Only update if different - using efficient comparison
      if (!prayerTimesEqual(newTimes, timesRef.current)) {
        timesRef.current = newTimes;
        setTimes(newTimes);
        setError(null);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch prayer times from Firebase:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prayer times');
      setIsLoading(false);
    }

    // Compute next run: default +5m
    const now = new Date();
    let next = new Date(now.getTime() + 5 * 60_000);

    const currentTimes = timesRef.current;
    if (currentTimes) {
      // future/present blocks
      const blocks = getBlockedWindows(currentTimes)
        .filter(([, end]) => end > now)
        .sort((a, b) => a[0].getTime() - b[0].getTime());

      // if currently in a blocked window, schedule just after it ends
      const current = blocks.find(([start, end]) => now >= start && now <= end);
      if (current) {
        next = current[1];
      } else if (blocks.length) {
        // or if next prayer is sooner than +5m, schedule 1s before it
        const [nextStart] = blocks[0];
        if (nextStart.getTime() < next.getTime()) {
          next = new Date(nextStart.getTime() - 1_000);
        }
      }
    }

    const delay = Math.max(0, next.getTime() - now.getTime());
    timer.current = window.setTimeout(scheduleFetch, delay);
  }, []);

  useEffect(() => {
    scheduleFetch();

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [scheduleFetch]);

  return { times, error, isLoading };
}
