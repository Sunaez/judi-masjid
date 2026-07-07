// src/app/display/context/PrayerTimesContext.tsx
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, useRef } from 'react';
import { RawPrayerTimes } from '@/app/FetchPrayerTimes';
import { usePrayerTimesFromFirebase } from '@/app/hooks/usePrayerTimesFromFirebase';
import {
  isEidAlFitrDate,
  isFirstTenDaysOfRamadan,
  isLastTenDaysOfRamadan,
  isRamadanDate,
  isRamadanPeriod,
} from '@/lib/islamicDate';
import { isEidAlAdhaGreetingActive } from '@/lib/eidPrayerNotice';
import { isInDowntimeWindow } from '@/lib/prayerTimeUtils';

// Temporary preview flag so Eid visuals/messages can be reviewed outside 1-3 Shawwal.
const FORCE_EID_AL_FITR_PREVIEW = false;

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
  // Whether today is within Eid al-Fitr (1-3 Shawwal)
  isEidAlFitr: boolean;
  // Whether the Eid al-Adha greeting should be shown
  isEidAlAdha: boolean;
  // Whether any Eid greeting should be shown
  isEid: boolean;
}

const PrayerTimesContext = createContext<PrayerTimesContextValue | undefined>(undefined);

export function PrayerTimesProvider({ children }: { children: ReactNode }) {
  const { times, error, isLoading } = usePrayerTimesFromFirebase();

  // Track current time (updates every minute for efficiency)
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  const now = new Date();
  const isRamadan = isRamadanDate(now);
  const isRamadanPeriodActive = isRamadanPeriod(now);
  const isFirstTenRamadanDays = isFirstTenDaysOfRamadan(now);
  const isLastTenRamadanDays = isLastTenDaysOfRamadan(now);
  const isEidAlFitr = FORCE_EID_AL_FITR_PREVIEW || isEidAlFitrDate(now);
  const isEidAlAdha = isEidAlAdhaGreetingActive(now.getTime());
  const isEid = isEidAlFitr || isEidAlAdha;

  // Ref to store the interval ID so we can clean it up properly
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update current minutes every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
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
    return isInDowntimeWindow(times, currentMinutes, isRamadanPeriodActive);
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
    isEidAlFitr,
    isEidAlAdha,
    isEid,
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
