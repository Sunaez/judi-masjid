// src/app/display/Components/Rotator/Conditions.tsx
'use client';

import { useMemo } from 'react';
import type { MessageWithConditions } from './Messages';
import type { ConditionData } from './types';
import type { RawPrayerTimes } from '@/app/FetchPrayerTimes';

export default function useValidMessages(
  all: MessageWithConditions[],
  prayerTimes: RawPrayerTimes | null,
  currentWeather: string | null
) {
  return useMemo(() => {
    const now = new Date();
    const minute = now.getHours() * 60 + now.getMinutes();
    const today  = now.toLocaleDateString('en-GB', { weekday: 'long' });

    return all.filter(msg =>
      msg.conditions.every((cond: ConditionData) => {
        switch (cond.type) {
          case 'normal': return true;
          case 'time':
            return cond.entries.some(e => {
              const [fH,fM] = e.from.split(':').map(Number);
              const [tH,tM] = e.to.split(':').map(Number);
              const start = fH*60 + fM, end = tH*60 + tM;
              return minute >= start && minute <= end;
            });
          case 'prayer':
            if (!prayerTimes) return true;
            return cond.entries.some(e => {
              const key = (e.name.toLowerCase() + 'Jamaat') as keyof RawPrayerTimes;
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
            return !currentWeather || cond.entries.some(e => e.weather === currentWeather);
          case 'day':
            return cond.entries.includes(today);
        }
      })
    );
  }, [all, prayerTimes, currentWeather]);
}
