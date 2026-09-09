'use client';

import { useEffect } from 'react';
import { getPrayerTimesByDate, getTomorrowDateString } from '@/lib/firebase/prayerTimes';
import { cacheTimetable, isValidTimetable } from '@/lib/timetableCache';
import { withTimeout } from '@/lib/withTimeout';

/** Prepare tomorrow's date-labelled fallback without changing today's display. */
export default function TimetablePrefetch() {
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function run() {
      let delay = 5 * 60_000;
      const date = getTomorrowDateString();
      try {
        const times = await withTimeout(getPrayerTimesByDate(date), 20_000, controller.signal);
        if (!disposed && isValidTimetable(times)) {
          cacheTimetable(date, times);
          delay = 60 * 60_000;
        }
      } catch { /* A missing future timetable must never block today's display. */ }
      if (!disposed) timer = setTimeout(run, delay);
    }
    void run();
    return () => { disposed = true; controller.abort(); clearTimeout(timer); };
  }, []);
  return null;
}
