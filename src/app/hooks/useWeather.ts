'use client';

import { useEffect, useState } from 'react';
import { subscribeWeather } from '@/lib/weatherClient';
import type { WeatherData } from '@/lib/weather';

export function useWeather() {
  const [state, setState] = useState<{ weather: WeatherData | null; loading: boolean }>({
    weather: null,
    loading: true,
  });
  useEffect(() => subscribeWeather(setState), []);
  return state;
}
