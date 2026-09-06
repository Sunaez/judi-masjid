'use client';

import { normalizeWeatherData, type WeatherData } from './weather';

const CACHE_KEY = 'judi.weather.current';
const INTERVAL_KEY = 'judi.weather.interval';
export const MIN_WEATHER_INTERVAL = 4 * 60_000;
export const MAX_WEATHER_INTERVAL = 6 * 60_000;

type WeatherState = { weather: WeatherData | null; loading: boolean };
let state: WeatherState = { weather: null, loading: true };
const listeners = new Set<(state: WeatherState) => void>();
let interval: number | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let pending: Promise<void> | null = null;
let retryAt = 0;

function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Memory works without storage. */ }
}

function getInterval() {
  if (interval !== undefined) return interval;
  const saved = Number(readStorage(INTERVAL_KEY));
  interval = saved >= MIN_WEATHER_INTERVAL && saved <= MAX_WEATHER_INTERVAL
    ? saved
    : MIN_WEATHER_INTERVAL + Math.random() * (MAX_WEATHER_INTERVAL - MIN_WEATHER_INTERVAL);
  writeStorage(INTERVAL_KEY, String(interval));
  return interval;
}

function publish(next: WeatherState) {
  state = next;
  listeners.forEach(listener => listener(state));
}

function restoreCache() {
  try {
    const cached = normalizeWeatherData(JSON.parse(readStorage(CACHE_KEY) ?? 'null'));
    if (cached && cached.timestamp <= Date.now() &&
        (!state.weather || cached.timestamp > state.weather.timestamp)) {
      publish({ weather: cached, loading: false });
    }
  } catch { /* Ignore damaged storage and fetch again. */ }
}

function nextCheckAt() {
  const timestamp = state.weather?.timestamp;
  return Math.max(retryAt, timestamp ? timestamp + getInterval() : 0);
}

function schedule() {
  clearTimeout(timer);
  if (listeners.size) {
    timer = setTimeout(() => { void checkWeather(); }, Math.max(0, nextCheckAt() - Date.now()));
  }
}

async function refresh() {
  // Another tab may already have refreshed while this tab waited for the lock.
  restoreCache();
  if (Date.now() < nextCheckAt()) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(`/api/weather/current?interval=${getInterval()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) {
      const failure = await response.json().catch(() => null);
      throw new Error(typeof failure?.error === 'string' ? failure.error : 'Weather is unavailable.');
    }
    const weather = normalizeWeatherData(await response.json());
    if (!weather || weather.timestamp > Date.now() + 60_000) {
      throw new Error('Invalid weather response.');
    }
    writeStorage(CACHE_KEY, JSON.stringify(weather));
    publish({ weather, loading: false });
    // A stale fallback must not cause an immediate retry loop.
    retryAt = Date.now() >= weather.timestamp + getInterval() ? Date.now() + getInterval() : 0;
  } catch (error) {
    // Availability failures retain the last weather and retry; they are not UI crashes.
    console.warn('[weather] Failed to refresh:', error instanceof Error ? error.message : 'Request failed');
    retryAt = Date.now() + getInterval();
    publish({ weather: state.weather, loading: false });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkWeather() {
  if (pending) return pending;
  restoreCache();
  if (Date.now() < nextCheckAt()) { schedule(); return; }
  // Share one request across components; Web Locks also coordinate browser tabs.
  pending = Promise.resolve().then(() => navigator.locks
    ? navigator.locks.request('judi.weather.refresh', refresh)
    : refresh());
  try {
    await pending;
  } catch (error) {
    console.error('[weather] Failed to coordinate refresh:', error);
    retryAt = Date.now() + getInterval();
    publish({ weather: state.weather, loading: false });
  } finally {
    pending = null;
    schedule();
  }
}

function onResume() { void checkWeather(); }
function onStorage(event: StorageEvent) {
  if (event.key === CACHE_KEY) { restoreCache(); schedule(); }
}

export function subscribeWeather(listener: (state: WeatherState) => void) {
  listeners.add(listener);
  listener(state);
  if (listeners.size === 1) {
    window.addEventListener('focus', onResume);
    window.addEventListener('online', onResume);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onResume);
    void checkWeather();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearTimeout(timer);
      window.removeEventListener('focus', onResume);
      window.removeEventListener('online', onResume);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onResume);
    }
  };
}
