import type { RawPrayerTimes } from '@/app/FetchPrayerTimes';

const CACHE_KEY = 'judi.display.timetables.v1';
const keys: (keyof RawPrayerTimes)[] = ['fajrStart', 'fajrJamaat', 'sunrise', 'dhuhrStart',
  'dhuhrJamaat', 'asrStart', 'asrJamaat', 'maghrib', 'ishaStart', 'ishaJamaat'];
export function isValidTimetable(value: unknown): value is RawPrayerTimes {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return keys.every(key => typeof data[key] === 'string' && /^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(data[key]));
}
type Cache = Record<string, { times: RawPrayerTimes; savedAt: number }>;
function read(): Cache {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') ?? {}; } catch { return {}; }
}
export function readTimetable(date: string): RawPrayerTimes | null {
  const value = read()[date];
  return value && Date.now() - value.savedAt < 7 * 86_400_000 && isValidTimetable(value.times) ? value.times : null;
}
export function cacheTimetable(date: string, times: RawPrayerTimes) {
  if (!isValidTimetable(times)) return;
  try {
    const entries = Object.entries(read()).filter(([key, entry]) => key !== date &&
      entry && Date.now() - entry.savedAt < 7 * 86_400_000 && isValidTimetable(entry.times));
    entries.push([date, { times, savedAt: Date.now() }]);
    // Keep only a few date-labelled snapshots; never grow with continuous use.
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries.slice(-4))));
  } catch { /* The running display still works if persistent storage is denied. */ }
}
