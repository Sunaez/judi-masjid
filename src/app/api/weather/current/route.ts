import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { getFirebaseAdminFirestore } from '@/lib/firebaseAdmin';
import { normalizeWeatherData, type WeatherData } from '@/lib/weather';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WEATHER_CACHE_MS = 5 * 60 * 1000;
const WEATHER_DOC_PATH = 'weather/current';

let memoryWeatherCache: WeatherData | null = null;

function isFresh(weather: WeatherData) {
  return Date.now() - weather.timestamp < WEATHER_CACHE_MS;
}

function isFirebaseAdminConfigError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes('Firebase Admin SDK')
  );
}

function getWeatherConfig() {
  const apiKey =
    process.env.OPENWEATHER_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY?.trim();
  const lat =
    process.env.OPENWEATHER_LAT?.trim() ||
    process.env.NEXT_PUBLIC_OPENWEATHER_LAT?.trim();
  const lon =
    process.env.OPENWEATHER_LON?.trim() ||
    process.env.NEXT_PUBLIC_OPENWEATHER_LON?.trim();

  if (!apiKey || !lat || !lon) {
    return null;
  }

  return { apiKey, lat, lon };
}

function weatherResponse(weather: WeatherData) {
  return NextResponse.json(weather, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=240',
    },
  });
}

async function readCachedWeather() {
  if (memoryWeatherCache) {
    return memoryWeatherCache;
  }

  try {
    const snapshot = await getFirebaseAdminFirestore().doc(WEATHER_DOC_PATH).get();
    const weather = normalizeWeatherData(snapshot.data());

    if (weather) {
      memoryWeatherCache = weather;
    }

    return weather;
  } catch (error) {
    if (!isFirebaseAdminConfigError(error)) {
      console.error(
        '[weather] Failed to read cached weather with Admin SDK:',
        error instanceof Error ? error.message : error
      );
    }
  }

  try {
    const snapshot = await getDoc(doc(db, 'weather', 'current'));
    const weather = normalizeWeatherData(snapshot.exists() ? snapshot.data() : null);

    if (weather) {
      memoryWeatherCache = weather;
    }

    return weather;
  } catch (error) {
    console.error(
      '[weather] Failed to read cached weather with public Firestore client:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

async function writeCachedWeather(weather: WeatherData) {
  memoryWeatherCache = weather;

  try {
    await getFirebaseAdminFirestore().doc(WEATHER_DOC_PATH).set(weather);
  } catch (error) {
    if (!isFirebaseAdminConfigError(error)) {
      console.error(
        '[weather] Failed to write cached weather:',
        error instanceof Error ? error.message : error
      );
    }
  }
}

function getOpenWeatherEntry(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;

  const value = payload as {
    main?: { temp?: unknown };
    weather?: Array<{ main?: unknown; icon?: unknown }>;
  };
  const weather = value.weather?.[0];

  if (
    typeof value.main?.temp !== 'number' ||
    typeof weather?.main !== 'string' ||
    typeof weather.icon !== 'string'
  ) {
    return null;
  }

  return {
    temp: value.main.temp,
    condition: weather.main,
    iconCode: weather.icon,
  };
}

async function fetchWeatherFromOpenWeather(): Promise<WeatherData> {
  const config = getWeatherConfig();

  if (!config) {
    throw new Error('OpenWeather is not configured.');
  }

  const currentUrl = new URL('https://api.openweathermap.org/data/2.5/weather');
  currentUrl.searchParams.set('lat', config.lat);
  currentUrl.searchParams.set('lon', config.lon);
  currentUrl.searchParams.set('appid', config.apiKey);
  currentUrl.searchParams.set('units', 'metric');

  const forecastUrl = new URL('https://api.openweathermap.org/data/2.5/forecast');
  forecastUrl.searchParams.set('lat', config.lat);
  forecastUrl.searchParams.set('lon', config.lon);
  forecastUrl.searchParams.set('appid', config.apiKey);
  forecastUrl.searchParams.set('units', 'metric');
  forecastUrl.searchParams.set('cnt', '1');

  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(currentUrl, { cache: 'no-store' }),
    fetch(forecastUrl, { cache: 'no-store' }),
  ]);

  if (!currentResponse.ok || !forecastResponse.ok) {
    throw new Error('OpenWeather returned an unsuccessful response.');
  }

  const [currentPayload, forecastPayload] = await Promise.all([
    currentResponse.json(),
    forecastResponse.json(),
  ]);
  const currentWeather = getOpenWeatherEntry(currentPayload);
  const forecastList =
    forecastPayload &&
    typeof forecastPayload === 'object' &&
    'list' in forecastPayload &&
    Array.isArray((forecastPayload as { list?: unknown }).list)
      ? (forecastPayload as { list: unknown[] }).list
      : [];
  const forecastWeather = getOpenWeatherEntry(forecastList[0]);

  const weather = normalizeWeatherData({
    temp: currentWeather?.temp,
    condition: currentWeather?.condition,
    iconCode: currentWeather?.iconCode,
    forecastTemp: forecastWeather?.temp,
    forecastCondition: forecastWeather?.condition,
    timestamp: Date.now(),
  });

  if (!weather) {
    throw new Error('OpenWeather returned an invalid weather payload.');
  }

  return weather;
}

export async function GET() {
  const cachedWeather = await readCachedWeather();

  if (cachedWeather && isFresh(cachedWeather)) {
    return weatherResponse(cachedWeather);
  }

  try {
    const freshWeather = await fetchWeatherFromOpenWeather();
    await writeCachedWeather(freshWeather);
    return weatherResponse(freshWeather);
  } catch (error) {
    console.error(
      '[weather] Failed to refresh weather:',
      error instanceof Error ? error.message : error
    );

    if (cachedWeather) {
      return weatherResponse(cachedWeather);
    }

    return NextResponse.json(
      { error: 'Weather is unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
