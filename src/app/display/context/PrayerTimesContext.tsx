// src/app/display/context/PrayerTimesContext.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { RawPrayerTimes } from '@/app/FetchPrayerTimes';
import { usePrayerTimesFromFirebase } from '@/app/hooks/usePrayerTimesFromFirebase';

interface PrayerTimesContextValue {
  prayerTimes: RawPrayerTimes | null;
  isLoading: boolean;
  error: string | null;
}

const PrayerTimesContext = createContext<PrayerTimesContextValue | undefined>(undefined);

export function PrayerTimesProvider({ children }: { children: ReactNode }) {
  const { times, error, isLoading } = usePrayerTimesFromFirebase();

  const value: PrayerTimesContextValue = {
    prayerTimes: times,
    isLoading,
    error,
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
