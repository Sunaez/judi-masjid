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

/**
 * Checks if we're in or near Ramadan (Ramadan month, plus 1 day before and after).
 * Uses the Islamic calendar to detect the Hijri month.
 * Returns true during Ramadan to extend downtime start from 1hr to 3hrs after Isha.
 */
function isRamadanPeriod(date: Date = new Date()): boolean {
  // Get Hijri month number (1-12, where 9 = Ramadan)
  const formatter = new Intl.DateTimeFormat('en-u-ca-islamic', {
    month: 'numeric',
  });
  const hijriMonth = parseInt(formatter.format(date), 10);

  // Check day before (might be end of Sha'ban = month 8)
  const dayBefore = new Date(date);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const monthBefore = parseInt(formatter.format(dayBefore), 10);

  // Check day after (might be start of Shawwal = month 10)
  const dayAfter = new Date(date);
  dayAfter.setDate(dayAfter.getDate() + 1);
  const monthAfter = parseInt(formatter.format(dayAfter), 10);

  // If today is Ramadan (9), or yesterday was Ramadan, or tomorrow is Ramadan
  // This handles the day before Ramadan starts and the day after Ramadan ends
  return hijriMonth === 9 || monthBefore === 9 || monthAfter === 9;
}

interface PrayerTimesContextValue {
  prayerTimes: RawPrayerTimes | null;
  isLoading: boolean;
  error: string | null;
  // Current time in minutes since midnight (updates every minute)
  currentMinutes: number;
  // Whether we're in downtime (X hrs after Isha to 1hr before Fajr)
  isDowntime: boolean;
  // Whether we're in/near Ramadan (for UI indication)
  isRamadan: boolean;
}

const PrayerTimesContext = createContext<PrayerTimesContextValue | undefined>(undefined);

export function PrayerTimesProvider({ children }: { children: ReactNode }) {
  const { times, error, isLoading } = usePrayerTimesFromFirebase();

  // Track current time (updates every minute for efficiency)
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Check if we're in Ramadan period (updates daily at midnight via parent refresh)
  const isRamadan = useMemo(() => isRamadanPeriod(), []);

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

    // Downtime start:
    // - During Ramadan: 3 hours after Isha (mosque used longer for Taraweeh)
    // - Normal: 1 hour after Isha
    const hoursAfterIsha = isRamadan ? 3 : 1;
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
  }, [times, currentMinutes, isRamadan]);

  const value: PrayerTimesContextValue = {
    prayerTimes: times,
    isLoading,
    error,
    currentMinutes,
    isDowntime,
    isRamadan,
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
