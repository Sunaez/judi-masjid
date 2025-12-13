// src/app/display/context/DebugContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface DebugContextValue {
  // Override for downtime mode (true = downtime, false = normal)
  downtimeOverride: boolean;
  // Whether the override has been manually activated (vs using automatic detection)
  downtimeOverrideActive: boolean;
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

// Keybind definitions for the help modal
const KEYBINDS = [
  { key: '1', description: 'Toggle between Normal and Off-Peak display mode' },
  { key: '2', description: 'Skip to the next rotator section' },
  { key: '3', description: 'Test the prayer overlay (10s countdown + 5s in progress)' },
  { key: 'H', description: 'Show/hide this help menu' },
];

/**
 * Debug provider for testing display features via keyboard shortcuts.
 *
 * Keybinds (only when window is focused):
 * - 1: Toggle between normal and off-peak (downtime) mode
 * - 2: Advance to next rotator section
 * - 3: Force test prayer overlay
 * - H: Show/hide keybinds help
 */
export function DebugProvider({ children }: { children: ReactNode }) {
  const [downtimeOverride, setDowntimeOverride] = useState<boolean>(false);
  const [downtimeOverrideActive, setDowntimeOverrideActive] = useState<boolean>(false);
  const [rotatorAdvanceSignal, setRotatorAdvanceSignal] = useState(0);
  const [prayerOverlayTestSignal, setPrayerOverlayTestSignal] = useState(0);
  const [notification, setNotification] = useState('');
  const [showHint, setShowHint] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Hide initial hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Show notification for 1 second
  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 1000);
  }, []);

  const toggleDowntimeOverride = useCallback(() => {
    setDowntimeOverrideActive(true); // Mark override as manually activated
    setDowntimeOverride(prev => {
      const newValue = !prev;
      showNotification(newValue ? 'Off-Peak Mode (Manual)' : 'Normal Mode (Manual)');
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

  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
    setShowHint(false); // Hide hint when help is toggled
  }, []);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case '1':
          if (!showHelp) toggleDowntimeOverride();
          break;
        case '2':
          if (!showHelp) advanceRotator();
          break;
        case '3':
          if (!showHelp) testPrayerOverlay();
          break;
        case 'h':
          toggleHelp();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDowntimeOverride, advanceRotator, testPrayerOverlay, toggleHelp, showHelp]);

  const value: DebugContextValue = {
    downtimeOverride,
    downtimeOverrideActive,
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

      {/* Initial hint popup (3 seconds on load) */}
      {showHint && !showHelp && (
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
            animation: 'hintFadeInOut 3s ease-in-out',
          }}
        >
          Press <strong>H</strong> for keybinds help
          <style>{`
            @keyframes hintFadeInOut {
              0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
              10% { opacity: 1; transform: translateX(-50%) translateY(0); }
              80% { opacity: 1; transform: translateX(-50%) translateY(0); }
              100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            }
          `}</style>
        </div>
      )}

      {/* Notification popup */}
      {notification && !showHelp && (
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

      {/* Help modal */}
      {showHelp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'helpFadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              color: 'white',
            }}
          >
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 600 }}>
              Keyboard Shortcuts
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {KEYBINDS.map(({ key, description }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <span
                    style={{
                      backgroundColor: '#333',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                      fontWeight: 600,
                      minWidth: '2.5rem',
                      textAlign: 'center',
                    }}
                  >
                    {key}
                  </span>
                  <span style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                    {description}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: '2rem',
                textAlign: 'center',
                opacity: 0.6,
                fontSize: '0.875rem',
              }}
            >
              Press <strong>H</strong> to close
            </div>
          </div>
          <style>{`
            @keyframes helpFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
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
