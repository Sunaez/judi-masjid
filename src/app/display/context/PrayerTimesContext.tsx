// src/app/display/context/PrayerTimesContext.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { RawPrayerTimes } from '@/app/FetchPrayerTimes';
import { usePrayerTimes } from '../usePrayerTimes';

interface PrayerTimesContextValue {
  prayerTimes: RawPrayerTimes | null;
  isLoading: boolean;
}

const PrayerTimesContext = createContext<PrayerTimesContextValue | undefined>(undefined);

export function PrayerTimesProvider({ children }: { children: ReactNode }) {
  const prayerTimes = usePrayerTimes();

  const value: PrayerTimesContextValue = {
    prayerTimes,
    isLoading: prayerTimes === null,
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
