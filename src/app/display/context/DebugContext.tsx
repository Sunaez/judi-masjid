// src/app/display/context/DebugContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface DebugContextValue {
  // Override for downtime mode (null = use real value)
  downtimeOverride: boolean | null;
  toggleDowntimeOverride: () => void;

  // Signal to advance rotator to next slot
  rotatorAdvanceSignal: number;
  advanceRotator: () => void;

  // Signal to force prayer overlay test
  prayerOverlayTestSignal: number;
  testPrayerOverlay: () => void;
}

const DebugContext = createContext<DebugContextValue | undefined>(undefined);

/**
 * Debug provider for testing display features via keyboard shortcuts.
 *
 * Keybinds (only when window is focused):
 * - 1: Toggle between normal and off-peak (downtime) mode
 * - 2: Advance to next rotator section
 * - 3: Force test prayer overlay
 */
export function DebugProvider({ children }: { children: ReactNode }) {
  const [downtimeOverride, setDowntimeOverride] = useState<boolean | null>(null);
  const [rotatorAdvanceSignal, setRotatorAdvanceSignal] = useState(0);
  const [prayerOverlayTestSignal, setPrayerOverlayTestSignal] = useState(0);

  const toggleDowntimeOverride = useCallback(() => {
    setDowntimeOverride(prev => {
      if (prev === null) return true;  // First press: force downtime
      if (prev === true) return false; // Second press: force normal
      return null;                      // Third press: back to auto
    });
  }, []);

  const advanceRotator = useCallback(() => {
    setRotatorAdvanceSignal(s => s + 1);
  }, []);

  const testPrayerOverlay = useCallback(() => {
    setPrayerOverlayTestSignal(s => s + 1);
  }, []);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case '1':
          toggleDowntimeOverride();
          break;
        case '2':
          advanceRotator();
          break;
        case '3':
          testPrayerOverlay();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDowntimeOverride, advanceRotator, testPrayerOverlay]);

  const value: DebugContextValue = {
    downtimeOverride,
    toggleDowntimeOverride,
    rotatorAdvanceSignal,
    advanceRotator,
    prayerOverlayTestSignal,
    testPrayerOverlay,
  };

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebugContext() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebugContext must be used within a DebugProvider');
  }
  return context;
}
