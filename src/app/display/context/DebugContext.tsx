// src/app/display/context/DebugContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface DebugContextValue {
  // Override for downtime mode (true = downtime, false = normal)
  downtimeOverride: boolean;
  toggleDowntimeOverride: () => void;

  // Signal to advance rotator to next slot
  rotatorAdvanceSignal: number;
  advanceRotator: () => void;

  // Signal to force prayer overlay test
  prayerOverlayTestSignal: number;
  testPrayerOverlay: () => void;

  // Current notification message (empty = hidden)
  notification: string;
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
  const [downtimeOverride, setDowntimeOverride] = useState<boolean>(false);
  const [rotatorAdvanceSignal, setRotatorAdvanceSignal] = useState(0);
  const [prayerOverlayTestSignal, setPrayerOverlayTestSignal] = useState(0);
  const [notification, setNotification] = useState('');

  // Show notification for 1 second
  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 1000);
  }, []);

  const toggleDowntimeOverride = useCallback(() => {
    setDowntimeOverride(prev => {
      const newValue = !prev;
      showNotification(newValue ? 'Off-Peak Mode' : 'Normal Mode');
      return newValue;
    });
  }, [showNotification]);

  const advanceRotator = useCallback(() => {
    setRotatorAdvanceSignal(s => s + 1);
    showNotification('Next Section');
  }, [showNotification]);

  const testPrayerOverlay = useCallback(() => {
    setPrayerOverlayTestSignal(s => s + 1);
    showNotification('Prayer Overlay Test');
  }, [showNotification]);

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
    notification,
  };

  return (
    <DebugContext.Provider value={value}>
      {children}
      {/* Notification popup */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 500,
            zIndex: 9999,
            pointerEvents: 'none',
            animation: 'fadeInOut 1s ease-in-out',
          }}
        >
          {notification}
          <style>{`
            @keyframes fadeInOut {
              0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
              15% { opacity: 1; transform: translateX(-50%) translateY(0); }
              85% { opacity: 1; transform: translateX(-50%) translateY(0); }
              100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            }
          `}</style>
        </div>
      )}
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
