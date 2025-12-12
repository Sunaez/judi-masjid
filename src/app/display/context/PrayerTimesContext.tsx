// src/app/display/context/PrayerTimesContext.tsx
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { RawPrayerTimes } from '@/app/FetchPrayerTimes';
import { usePrayerTimesFromFirebase } from '@/app/hooks/usePrayerTimesFromFirebase';

// Convert HH:MM to minutes since midnight
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

interface PrayerTimesContextValue {
  prayerTimes: RawPrayerTimes | null;
  isLoading: boolean;
  error: string | null;
  // Current time in minutes since midnight (updates every minute)
  currentMinutes: number;
  // Whether we're in downtime (1hr after Isha to 1hr before Fajr)
  isDowntime: boolean;
}

const PrayerTimesContext = createContext<PrayerTimesContextValue | undefined>(undefined);

export function PrayerTimesProvider({ children }: { children: ReactNode }) {
  const { times, error, isLoading } = usePrayerTimesFromFirebase();

  // Track current time (updates every minute for efficiency)
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

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
      // Then update every minute
      const interval = setInterval(updateTime, 60_000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(syncTimeout);
  }, []);

  // Calculate if we're in downtime
  const isDowntime = useMemo(() => {
    if (!times) return false;

    const ishaMinutes = timeToMinutes(times.ishaJamaat);
    const fajrMinutes = timeToMinutes(times.fajrJamaat);

    // Downtime: 1 hour after Isha to 1 hour before Fajr
    const downtimeStart = ishaMinutes + 60; // 1hr after Isha
    const downtimeEnd = fajrMinutes - 60;   // 1hr before Fajr

    // Handle overnight case (Isha is in evening, Fajr is early morning)
    // e.g., Isha at 21:00 (1260 min), Fajr at 05:30 (330 min)
    // Downtime: 22:00 (1320 min) to 04:30 (270 min)
    // We use < for end boundary so that at exactly 1hr before Fajr, we exit downtime
    if (downtimeStart > downtimeEnd) {
      // Overnight: downtime if current >= start OR current < end
      return currentMinutes >= downtimeStart || currentMinutes < downtimeEnd;
    } else {
      // Same-day (unusual): downtime if current is between start and end
      return currentMinutes >= downtimeStart && currentMinutes < downtimeEnd;
    }
  }, [times, currentMinutes]);

  const value: PrayerTimesContextValue = {
    prayerTimes: times,
    isLoading,
    error,
    currentMinutes,
    isDowntime,
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
