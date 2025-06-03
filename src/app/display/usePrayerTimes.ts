import { useEffect, useRef, useState } from 'react'
import { RawPrayerTimes, fetchPrayerTimes } from '../FetchPrayerTimes'

// turn an "HH:MM" string into a Date for today
function timeToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
}

// build the 3min-before → 5min-after windows for each prayer
function getBlockedWindows(times: RawPrayerTimes): [Date, Date][] {
  const keys: (keyof RawPrayerTimes)[] = [
    'fajrStart','fajrJamaat','sunrise',
    'dhuhrStart','dhuhrJamaat',
    'asrStart','asrJamaat',
    'maghrib',
    'ishaStart','ishaJamaat',
  ]
  return keys.map(key => {
    const t = times[key]!
    const base = timeToDate(t)
    return [
      new Date(base.getTime() - 3 * 60_000),
      new Date(base.getTime() + 5 * 60_000),
    ]
  })
}

/**
 * Hook that:
 *  - Fetches prayer times immediately
 *  - Re-fetches every 5min except within 3m before → 5m after any prayer
 *  - Updates React state only when the CSV data actually changes
 */
export function usePrayerTimes() {
  const [times, setTimes] = useState<RawPrayerTimes | null>(null)
  const timer = useRef<number | null>(null)  // ← give an initial value!

  useEffect(() => {
    let cancelled = false

    async function scheduleFetch() {
      try {
        const newTimes = await fetchPrayerTimes()
        // only update if different
        if (!cancelled && JSON.stringify(newTimes) !== JSON.stringify(times)) {
          setTimes(newTimes)
        }
      } catch (err) {
        console.error('Failed to fetch prayer times', err)
      }

      if (cancelled) return

      // compute next run: default +5m
      const now = new Date()
      let next = new Date(now.getTime() + 5 * 60_000)

      if (times) {
        // future/present blocks
        const blocks = getBlockedWindows(times)
          .filter(([, end]) => end > now)
          .sort((a, b) => a[0].getTime() - b[0].getTime())

        // if currently in a blocked window, schedule just after it ends
        const current = blocks.find(([start, end]) => now >= start && now <= end)
        if (current) {
          next = current[1]
        } else if (blocks.length) {
          // or if next prayer is sooner than +5m, schedule 1s before it
          const [nextStart] = blocks[0]
          if (nextStart.getTime() < next.getTime()) {
            next = new Date(nextStart.getTime() - 1_000)
          }
        }
      }

      const delay = Math.max(0, next.getTime() - now.getTime())
      timer.current = window.setTimeout(scheduleFetch, delay)
    }

    scheduleFetch()

    return () => {
      cancelled = true
      if (timer.current) clearTimeout(timer.current)
    }
    // we intentionally omit `times` in deps so we keep our closures stable
    // and use the old `times` value inside scheduleFetch
  }, [])

  return times
}
