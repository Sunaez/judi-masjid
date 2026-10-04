import { mosqueTimeOnDate } from '@/lib/mosqueClock';
import { useEffect, useState } from 'react';
import type { RawPrayerTimes } from '../FetchPrayerTimes';
import { getPrayerTimesByDate, getTodayDateString } from '@/lib/firebase/prayerTimes';
import { withTimeout } from '@/lib/withTimeout';
import { readTimetable, cacheTimetable } from '@/lib/timetableCache';

const POLL_MS = 5 * 60_000;
const MIN_DELAY_MS = 1_000;
const REQUEST_TIMEOUT_MS = 20_000;
const TIME_PATTERN = /^(?:[01]?\d|2[0-3]):[0-5]\d$/;
const PRAYER_KEYS: (keyof RawPrayerTimes)[] = [
  'fajrStart', 'fajrJamaat', 'sunrise', 'dhuhrStart', 'dhuhrJamaat',
  'asrStart', 'asrJamaat', 'maghrib', 'ishaStart', 'ishaJamaat',
];

function nextMidnight(now: Date): number {
  return mosqueTimeOnDate(0, 0, now, 1).getTime();
}

// Moving the candidate through sorted windows also handles overlapping windows.
function nextAllowedFetch(candidate: number, times: RawPrayerTimes | null, now: Date): number {
  if (!times) return candidate;
  const windows = PRAYER_KEYS.map(key => {
    const [hours, minutes] = times[key].split(':').map(Number);
    const prayer = mosqueTimeOnDate(hours, minutes, now);
    return [prayer.getTime() - 3 * 60_000, prayer.getTime() + 5 * 60_000];
  }).sort((a, b) => a[0] - b[0]);

  for (const [start, end] of windows) {
    if (candidate >= start && candidate <= end) candidate = end + MIN_DELAY_MS;
  }
  return candidate;
}

interface PrayerState {
  date: string;
  times: RawPrayerTimes | null;
  error: string | null;
  isLoading: boolean;
  // Number of failed connection attempts since the last successful fetch.
  // Drives the flashing "connection attempt" indicator in ThemeProvider so we
  // can re-render only to flash the light (not to flicker the error box).
  attempts: number;
}

/** One scheduler owns polling and daily rollover; cached times belong to one date. */
export function usePrayerTimesFromFirebase() {
  const [state, setState] = useState<PrayerState>(() => ({
    date: getTodayDateString(), times: null, error: null, isLoading: true, attempts: 0,
  }));

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let date = getTodayDateString();
    let cachedTimes: RawPrayerTimes | null = readTimetable(date);
    if (cachedTimes) setState({ date, times: cachedTimes, error: null, isLoading: false, attempts: 0 });
    let generation = 0;
    let requestController: AbortController | undefined;

    function schedule(at: number) {
      if (disposed) return;
      clearTimeout(timer);
      const now = new Date();
      // Midnight takes priority even when a request is still pending.
      const wakeAt = Math.min(at, nextMidnight(now));
      timer = setTimeout(run, Math.max(MIN_DELAY_MS, wakeAt - now.getTime()));
    }

    async function run() {
      if (disposed) return;
      const today = getTodayDateString();
      if (today !== date) {
        date = today;
        cachedTimes = readTimetable(date);
        setState({ date, times: cachedTimes, error: null, isLoading: !cachedTimes, attempts: 0 });
      }

      const now = new Date();
      const allowedAt = nextAllowedFetch(now.getTime(), cachedTimes, now);
      if (allowedAt > now.getTime()) {
        schedule(allowedAt);
        return;
      }

      const requestDate = date;
      const requestGeneration = ++generation;
      requestController?.abort();
      const request = new AbortController();
      requestController = request;
      const isCurrent = () => !disposed && requestGeneration === generation &&
        requestDate === getTodayDateString();
      // Midnight supersedes an old day's request; the deadline also bounds
      // Firestore reads that remain pending during a connection failure.
      schedule(nextMidnight(now));

      try {
        const newTimes = await withTimeout(getPrayerTimesByDate(requestDate), REQUEST_TIMEOUT_MS, request.signal);
        if (!isCurrent()) return;
        if (!newTimes) {
          setState({ date, times: cachedTimes, isLoading: false, attempts: 0,
            error: `No prayer times found for ${date}. Please sync from Google Sheets.` });
        } else {
          if (!PRAYER_KEYS.every(key => typeof newTimes[key] === 'string' && TIME_PATTERN.test(newTimes[key]))) {
            throw new Error(`Invalid prayer times for ${date}`);
          }
          if (!cachedTimes || !PRAYER_KEYS.every(key => cachedTimes![key] === newTimes[key])) {
            cachedTimes = newTimes;
          }
          setState({ date, times: cachedTimes, error: null, isLoading: false, attempts: 0 });
          cacheTimetable(date, cachedTimes);
        }
      } catch (error) {
        if (!isCurrent()) return;
        console.error('Failed to fetch prayer times from Firebase:', error);
        // Increment attempts on every failed attempt so ThemeProvider can flash the
        // connection-indicator light once per attempt, and surface a message for the
        // error box. The message is intentionally left stable (not bumped here) so the
        // error box does not flicker while only the indicator needs to re-render.
        setState(prev => ({ ...prev, isLoading: false, attempts: prev.attempts + 1,
          error: error instanceof Error ? error.message : 'Connection failed' }));
      } finally {
        if (isCurrent()) {
          const finishedAt = new Date();
          schedule(nextAllowedFetch(finishedAt.getTime() + POLL_MS, cachedTimes, finishedAt));
        }
      }
    }

    void run();
    return () => {
      disposed = true;
      clearTimeout(timer);
      requestController?.abort();
    };
  }, []);

  // Also hide expired data if another render occurs before the midnight timer runs.
  const isToday = state.date === getTodayDateString();
  return {
    times: isToday ? state.times : null,
    timesDate: isToday && state.times ? state.date : null,
    error: isToday ? state.error : null,
    isLoading: !isToday || state.isLoading,
    attempts: state.attempts,
  };
}
