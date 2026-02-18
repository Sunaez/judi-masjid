// src/app/display/context/PrayerTimesContext.tsx
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, useRef } from 'react';
import { RawPrayerTimes } from '@/app/FetchPrayerTimes';
import { usePrayerTimesFromFirebase } from '@/app/hooks/usePrayerTimesFromFirebase';
import {
  isFirstTenDaysOfRamadan,
  isLastTenDaysOfRamadan,
  isRamadanDate,
  isRamadanPeriod,
} from '@/lib/islamicDate';
import { timeToMinutes } from '@/lib/prayerTimeUtils';

interface PrayerTimesContextValue {
  prayerTimes: RawPrayerTimes | null;
  isLoading: boolean;
  error: string | null;
  // Current time in minutes since midnight (updates every minute)
  currentMinutes: number;
  // Whether we're in downtime (X hrs after Isha to 1hr before Fajr)
  isDowntime: boolean;
  // Whether today is in Ramadan
  isRamadan: boolean;
  // Whether today is in/near Ramadan (used for downtime extension)
  isRamadanPeriod: boolean;
  // Whether today is one of the first 10 Ramadan days
  isFirstTenRamadanDays: boolean;
  // Whether today is one of the last 10 Ramadan days
  isLastTenRamadanDays: boolean;
}

const PrayerTimesContext = createContext<PrayerTimesContextValue | undefined>(undefined);

export function PrayerTimesProvider({ children }: { children: ReactNode }) {
  const { times, error, isLoading } = usePrayerTimesFromFirebase();

  // Track current time (updates every minute for efficiency)
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Track the current day to detect day changes for Ramadan recalculation
  const [currentDay, setCurrentDay] = useState(() => new Date().getDate());

  // Recompute Ramadan flags when day changes
  const { isRamadan, isRamadanPeriodActive, isFirstTenRamadanDays, isLastTenRamadanDays } = useMemo(() => {
    const now = new Date();
    return {
      isRamadan: isRamadanDate(now),
      isRamadanPeriodActive: isRamadanPeriod(now),
      isFirstTenRamadanDays: isFirstTenDaysOfRamadan(now),
      isLastTenRamadanDays: isLastTenDaysOfRamadan(now),
    };
  }, [currentDay]);

  // Ref to store the interval ID so we can clean it up properly
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update current minutes every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
      // Check if day has changed (for Ramadan recalculation)
      const newDay = now.getDate();
      setCurrentDay(prev => prev !== newDay ? newDay : prev);
    };

    // Calculate ms until next minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    // Initial sync to the start of the next minute
    const syncTimeout = setTimeout(() => {
      updateTime();
      // Then update every minute - store in ref for cleanup
      intervalRef.current = setInterval(updateTime, 60_000);
    }, msUntilNextMinute);

    // Cleanup both timeout AND interval
    return () => {
      clearTimeout(syncTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Calculate if we're in downtime
  const isDowntime = useMemo(() => {
    if (!times) return false;

    const ishaMinutes = timeToMinutes(times.ishaJamaat);
    const fajrMinutes = timeToMinutes(times.fajrJamaat);

    // Downtime start:
    // - During Ramadan: 3 hours after Isha (mosque used longer for Taraweeh)
    // - Normal: 1 hour after Isha
    const hoursAfterIsha = isRamadanPeriodActive ? 3 : 1;
    const downtimeStart = ishaMinutes + (hoursAfterIsha * 60);
    const downtimeEnd = fajrMinutes - 60; // Always 1hr before Fajr

    // Handle overnight case (Isha is in evening, Fajr is early morning)
    // e.g., Isha at 21:00 (1260 min), Fajr at 05:30 (330 min)
    // Normal: Downtime 22:00 to 04:30
    // Ramadan: Downtime 00:00 to 04:30
    // We use < for end boundary so that at exactly 1hr before Fajr, we exit downtime
    if (downtimeStart > downtimeEnd || downtimeStart >= 1440) {
      // Overnight or past midnight: handle wrap-around
      const adjustedStart = downtimeStart >= 1440 ? downtimeStart - 1440 : downtimeStart;
      if (downtimeStart >= 1440) {
        // Start is past midnight (e.g., 00:00 for Ramadan with late Isha)
        return currentMinutes >= adjustedStart && currentMinutes < downtimeEnd;
      }
      // Overnight: downtime if current >= start OR current < end
      return currentMinutes >= downtimeStart || currentMinutes < downtimeEnd;
    } else {
      // Same-day (unusual): downtime if current is between start and end
      return currentMinutes >= downtimeStart && currentMinutes < downtimeEnd;
    }
  }, [times, currentMinutes, isRamadanPeriodActive]);

  const value: PrayerTimesContextValue = {
    prayerTimes: times,
    isLoading,
    error,
    currentMinutes,
    isDowntime,
    isRamadan,
    isRamadanPeriod: isRamadanPeriodActive,
    isFirstTenRamadanDays,
    isLastTenRamadanDays,
  };

  return (
    <PrayerTimesContext.Provider value={value}>
      {children}
    </PrayerTimesContext.Provider>
  );
}

export function usePrayerTimesContext() {
  const context = useContext(PrayerTimesContext);
  if (context === undefined) {
    throw new Error('usePrayerTimesContext must be used within a PrayerTimesProvider');
  }
  return context;
}
