// src/app/display/context/PrayerTimesContext.tsx
'use client';

import { mosqueMinutes } from '@/lib/mosqueClock';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, useRef } from 'react';
import { RawPrayerTimes } from '@/app/FetchPrayerTimes';
import { usePrayerTimesFromFirebase } from '@/app/hooks/usePrayerTimesFromFirebase';
import { SIMULATED_ERROR_MESSAGE, SIMULATED_ERROR_CLEAR_MS, SIMULATED_ERROR_INTERVAL_MS } from './constants';
import {
  isEidAlFitrDate,
  isFirstTenDaysOfRamadan,
  isLastTenDaysOfRamadan,
  isRamadanDate,
  isRamadanPeriod,
} from '@/lib/islamicDate';
import { isEidAlAdhaGreetingActive } from '@/lib/eidPrayerNotice';
import { isInDowntimeWindow } from '@/lib/prayerTimeUtils';
import { isSimulatedConnectionError } from './displayFlags';

// Temporary preview flag so Eid visuals/messages can be reviewed outside 1-3 Shawwal.
const FORCE_EID_AL_FITR_PREVIEW = false;

interface PrayerTimesContextValue {
  prayerTimes: RawPrayerTimes | null;
  isLoading: boolean;
  error: string | null;
  attempts: number;
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
  // Whether we're simulating a connection error (debug/testing)
  isSimulatingConnectionError: boolean;
  // True whenever the prayer-times connection is in a failed state — either an
  // active simulated outage, one or more real polling failures, or any surfaced
  // error. Drives page-level gating of the PrayerTimeline's error UI.
  isConnectionFailed: boolean;
  // Safe trigger to simulate a connection outage (debug/testing).
  simulateConnectionError: () => void;
  clearSimulatedConnectionError: () => void;
}

const PrayerTimesContext = createContext<PrayerTimesContextValue | undefined>(undefined);

export function PrayerTimesProvider({ children }: { children: ReactNode }) {
  const { times, error, isLoading, attempts } = usePrayerTimesFromFirebase();

  // --- Connection-error simulation (debug/testing) ---
  // Simulate a connection outage so the UI can demonstrate the persistent error
  // box + flashing indicator light without waiting for real polling failures.
  // Auto-clears after SIMULATED_ERROR_CLEAR_MS, then stops flashing.
  const [simulatedError, setSimulatedError] = useState<string | null>(null);
  const [isSimulatingConnectionError, setIsSimulatingConnectionError] = useState(false);
  const [simulatedAttempts, setSimulatedAttempts] = useState(0);

  useEffect(() => {
    if (!isSimulatingConnectionError) return;

    // Flash the indicator light once per simulated attempt (every ~5s). Each
    // increment remounts <IndicatorLight> via its `attempts` key, producing a
    // single ~1s flash. The error box is intentionally NOT driven by this
    // counter so it stays stable while only the indicator flashes.
    const flashTimer = setTimeout(() => {
      setSimulatedAttempts(a => a + 1);
    }, SIMULATED_ERROR_INTERVAL_MS);

    // Auto-clear the simulated outage after N seconds, then stop flashing.
    const clearTimer = setTimeout(() => {
      setSimulatedError(null);
      setIsSimulatingConnectionError(false);
    }, SIMULATED_ERROR_CLEAR_MS);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(clearTimer);
    };
  }, [isSimulatingConnectionError]);

  const effectiveError = isSimulatingConnectionError ? simulatedError : error;
  const effectiveLoading = isSimulatingConnectionError ? false : isLoading;
  const effectiveAttempts = isSimulatingConnectionError ? simulatedAttempts : attempts;

  // Connection "failed" gate used for page-level gating of the PrayerTimeline's
  // error UI. Covers a simulated outage, one or more real polling failures
  // (attempts > 0), and any surfaced error (e.g. the press-7 no-data
  // short-circuit). Stays false during initial loading so we show "Loading..."
  // rather than an error box before the first fetch settles.
  const isConnectionFailed = isSimulatingConnectionError || attempts > 0 || error !== null;

  // Track current time (updates every minute for efficiency)
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return mosqueMinutes(now);
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
      setCurrentMinutes(mosqueMinutes(now));
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

  // Safe wrapper so consumers can trigger a simulated outage without importing
  // PrayerTimesProvider directly. Guards against edge cases (e.g. unmount) and
  // never throws to the caller.
  const safeSimulateConnectionError = () => {
    try {
      // Flip the flag AND set the simulated message so the ErrorBox renders the
      // persistent outage text (until clearTimer resets it after SIMULATED_ERROR_CLEAR_MS).
      setIsSimulatingConnectionError(true);
      setSimulatedError(SIMULATED_ERROR_MESSAGE);
    } catch (err) {
      console.error('Failed to simulate connection error:', err);
    }
  };

  // Safe wrapper so consumers can clear a simulated outage without importing
  // PrayerTimesProvider directly. Guards against edge cases and never throws.
  const safeClearSimulatedConnectionError = () => {
    try {
      setIsSimulatingConnectionError(false);
      setSimulatedError(null);
    } catch (err) {
      console.error('Failed to clear simulated connection error:', err);
    }
  };

  const value: PrayerTimesContextValue = {
    prayerTimes: times,
    isLoading: effectiveLoading,
    error: effectiveError,
    attempts: effectiveAttempts,
    currentMinutes,
    isDowntime,
    isRamadan,
    isRamadanPeriod: isRamadanPeriodActive,
    isFirstTenRamadanDays,
    isLastTenRamadanDays,
    isEidAlFitr,
    isEidAlAdha,
    isEid,

    // Debug/testing controls (safe to call from any consumer).
    simulateConnectionError: safeSimulateConnectionError,
    clearSimulatedConnectionError: safeClearSimulatedConnectionError,
    isSimulatingConnectionError,
    isConnectionFailed,
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

/** Debug controls may also be rendered in isolation on test/demo pages. */
export function useAutomaticDowntime() {
  return useContext(PrayerTimesContext)?.isDowntime ?? false;
}

/** Safe accessor for the isSimulatingConnectionError flag, usable from any consumer (including <DebugProvider>, which may render without a PrayerTimes wrapper). */
export function useIsSimulatingConnectionError() {
  return useContext(PrayerTimesContext)?.isSimulatingConnectionError ?? false;
}

/** Safe accessor for the simulate-connection-error trigger, usable from any
 *  consumer (including <DebugProvider>, which may render without a PrayerTimes
 *  wrapper). Returns a noop when no provider is present so callers never throw. */
export function useSimulateConnectionError() {
  const simulate = useContext(PrayerTimesContext)?.simulateConnectionError;
  return typeof simulate === 'function' ? simulate : () => {};
}

/** Safe accessor for the clear-simulated-connection-error trigger, usable from any
 *  consumer (including <DebugProvider>, which may render without a PrayerTimes
 *  wrapper). Returns a noop when no provider is present so callers never throw. */
export function useClearSimulatedConnectionError() {
  const clear = useContext(PrayerTimesContext)?.clearSimulatedConnectionError;
  return typeof clear === 'function' ? clear : () => {};
}
