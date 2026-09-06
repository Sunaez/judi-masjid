import { NextResponse } from 'next/server';
import { normalizeWeatherData, type WeatherData } from '@/lib/weather';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WEATHER_CACHE_MS = 5 * 60 * 1000;
let pendingRefresh: Promise<WeatherData> | null = null;
let retryAt = 0;
let lastFailure: WeatherServiceError | null = null;

let memoryWeatherCache: WeatherData | null = null;

class WeatherServiceError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
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
      'Cache-Control': 'no-store',
    },
  });
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
    throw new WeatherServiceError('WEATHER_NOT_CONFIGURED',
      'Set OPENWEATHER_API_KEY, OPENWEATHER_LAT and OPENWEATHER_LON on the server.');
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
    fetch(currentUrl, { cache: 'no-store', signal: AbortSignal.timeout(15_000) }),
    fetch(forecastUrl, { cache: 'no-store', signal: AbortSignal.timeout(15_000) }),
  ]);

  for (const response of [currentResponse, forecastResponse]) {
    if (response.status === 401 || response.status === 403) {
      throw new WeatherServiceError('WEATHER_API_KEY_REJECTED',
        'OpenWeather rejected the API key. Set a valid OPENWEATHER_API_KEY on the server.');
    }
    if (response.status === 429) {
      throw new WeatherServiceError('WEATHER_RATE_LIMITED',
        'OpenWeather has reached its request limit. Weather will retry automatically.');
    }
    if (!response.ok) {
      throw new WeatherServiceError('WEATHER_PROVIDER_ERROR',
        `OpenWeather returned HTTP ${response.status ?? 'error'}.`);
    }
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

// Public requests never write to Firestore. Share overlapping refreshes within
// this server instance, and back off on upstream failures.
export async function GET(request: Request) {
  const requestedInterval = Number(new URL(request.url).searchParams.get('interval'));
  const interval = Number.isFinite(requestedInterval) && requestedInterval >= 4 * 60_000
    && requestedInterval <= 6 * 60_000 ? requestedInterval : WEATHER_CACHE_MS;
  const cachedWeather = memoryWeatherCache;
  if (cachedWeather && Date.now() - cachedWeather.timestamp < interval) {
    return weatherResponse(cachedWeather);
  }
  try {
    if (Date.now() < retryAt) throw lastFailure;
    if (!pendingRefresh) {
      pendingRefresh = fetchWeatherFromOpenWeather()
        .then(weather => {
          memoryWeatherCache = weather;
          lastFailure = null;
          return weather;
        })
        .catch(error => {
          retryAt = Date.now() + WEATHER_CACHE_MS;
          // Only return messages we control; upstream errors can contain request URLs.
          lastFailure = error instanceof WeatherServiceError ? error
            : new WeatherServiceError('WEATHER_UNAVAILABLE', 'Weather is temporarily unavailable.');
          console.warn('[weather]', lastFailure.code, lastFailure.message);
          throw lastFailure;
        })
        .finally(() => { pendingRefresh = null; });
    }
    return weatherResponse(await pendingRefresh);
  } catch (error) {
    if (cachedWeather) return weatherResponse(cachedWeather);
    const failure = error instanceof WeatherServiceError ? error
      : new WeatherServiceError('WEATHER_UNAVAILABLE', 'Weather is temporarily unavailable.');
    return NextResponse.json(
      { error: failure.message, code: failure.code },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
