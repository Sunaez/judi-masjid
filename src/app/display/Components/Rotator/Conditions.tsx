// src/app/display/Components/Rotator/Conditions.tsx
'use client';

import { mosqueMinutes, MOSQUE_TIME_ZONE } from '@/lib/mosqueClock';

import { useEffect, useMemo, useReducer } from 'react';
import type { MessageWithConditions } from './Messages';
import type { ConditionData } from './types';
import type { RawPrayerTimes } from '@/app/FetchPrayerTimes';
import { isValidCondition } from './validation';

/**
 * Returns messages that have a weather condition matching the current weather.
 * Only includes messages that explicitly have a 'weather' condition type.
 */
export function useWeatherMessages(
  all: MessageWithConditions[],
  currentWeather: string | null,
  prayerTimes: RawPrayerTimes | null = null
) {
  const eligible = useValidMessages(all, prayerTimes, currentWeather);
  return useMemo(() => {
    if (!currentWeather) return [];

    return eligible.filter(msg =>
      msg.conditions.some((cond: ConditionData) => {
        if (cond.type === 'weather') {
          return cond.entries.some(e => e.weather === currentWeather);
        }
        return false;
      })
    );
  }, [eligible, currentWeather]);
}

export default function useValidMessages(
  all: MessageWithConditions[],
  prayerTimes: RawPrayerTimes | null,
  currentWeather: string | null
) {
  const [, refreshClock] = useReducer((value: number) => value + 1, 0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const now = new Date();
      timer = setTimeout(tick, 60_000 - now.getSeconds() * 1_000 - now.getMilliseconds());
    };
    const tick = () => {
      clearTimeout(timer);
      refreshClock();
      schedule();
    };
    schedule();
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  const now = new Date();
  const minute = mosqueMinutes(now);
  const today = now.toLocaleDateString('en-GB', { weekday: 'long', timeZone: MOSQUE_TIME_ZONE });
  return useMemo(() => {
    return all.filter(msg =>
      Array.isArray(msg.conditions) && msg.conditions.every((cond: ConditionData) => {
        if (!isValidCondition(cond)) return false;
        switch (cond.type) {
          case 'normal': return true;
          case 'time':
            return cond.entries.some(e => {
              const [fH,fM] = e.from.split(':').map(Number);
              const [tH,tM] = e.to.split(':').map(Number);
              const start = fH*60 + fM, end = tH*60 + tM;
              return start <= end
                ? minute >= start && minute <= end
                : minute >= start || minute <= end;
            });
          case 'prayer':
            if (!prayerTimes) return false;
            return cond.entries.some(e => {
              // Maghrib only has 'maghrib', other prayers have 'xxxJamaat'
              const prayerName = e.name.toLowerCase();
              const key = (prayerName === 'maghrib' ? 'maghrib' : prayerName + 'Jamaat') as keyof RawPrayerTimes;
              const ts  = prayerTimes[key];
              if (!ts) return false;
              const [h,m] = ts.split(':').map(Number);
              const prMin = h*60 + m;
              const beforeOK = minute >= prMin - e.duration && minute <= prMin;
              const afterOK  = minute >= prMin && minute <= prMin + e.duration;
              if (e.when === 'before') return beforeOK;
              if (e.when === 'after')  return afterOK;
              return beforeOK || afterOK;
            });
          case 'weather':
            return !!currentWeather && cond.entries.some(e => e.weather === currentWeather);
          case 'day':
            return cond.entries.includes(today);
        }
      })
    );
  }, [all, prayerTimes, currentWeather, minute, today]);
}
