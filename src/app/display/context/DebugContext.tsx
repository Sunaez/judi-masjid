// src/app/display/context/DebugContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';

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
  { key: '4', description: 'Toggle between Light and Dark mode' },
  { key: 'H', description: 'Show/hide this help menu' },
];

/**
 * Debug provider for testing display features via keyboard shortcuts.
 *
 * Keybinds (only when window is focused):
 * - 1: Toggle between normal and off-peak (downtime) mode
 * - 2: Advance to next rotator section
 * - 3: Force test prayer overlay
 * - 4: Toggle between light and dark mode
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

  // Ref to track notification timeout for cleanup
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hide initial hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup notification timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Show notification for 1 second - with proper cleanup
  const showNotification = useCallback((message: string) => {
    // Clear any pending timeout to prevent stale updates
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification(message);
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification('');
      notificationTimeoutRef.current = null;
    }, 1000);
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

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    if (isDark) {
      html.classList.remove('dark');
      showNotification('Light Mode');
    } else {
      html.classList.add('dark');
      showNotification('Dark Mode');
    }
  }, [showNotification]);

  // Ref to store current handlers - avoids re-attaching event listener
  const handlersRef = useRef({
    toggleDowntimeOverride,
    advanceRotator,
    testPrayerOverlay,
    toggleTheme,
    toggleHelp,
    showHelp,
  });

  // Update handlers ref when callbacks change (but don't re-attach listener)
  useEffect(() => {
    handlersRef.current = {
      toggleDowntimeOverride,
      advanceRotator,
      testPrayerOverlay,
      toggleTheme,
      toggleHelp,
      showHelp,
    };
  }, [toggleDowntimeOverride, advanceRotator, testPrayerOverlay, toggleTheme, toggleHelp, showHelp]);

  // Keyboard event handler - attached once, reads from ref
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const handlers = handlersRef.current;

      switch (e.key.toLowerCase()) {
        case '1':
          if (!handlers.showHelp) handlers.toggleDowntimeOverride();
          break;
        case '2':
          if (!handlers.showHelp) handlers.advanceRotator();
          break;
        case '3':
          if (!handlers.showHelp) handlers.testPrayerOverlay();
          break;
        case '4':
          if (!handlers.showHelp) handlers.toggleTheme();
          break;
        case 'h':
          handlers.toggleHelp();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty deps - listener attached once

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

  // Memoized styles to avoid recreating objects on every render
  // Using CSS variables from globals.css for consistent theming
  const popupBaseStyle = useMemo(() => ({
    position: 'fixed' as const,
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--popup-bg)',
    color: 'var(--static-dark-text-color)',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: 500,
    zIndex: 9999,
    pointerEvents: 'none' as const,
  }), []);

  const hintStyle = useMemo(() => ({
    ...popupBaseStyle,
    animation: 'hintFadeInOut 3s ease-in-out',
  }), [popupBaseStyle]);

  const notificationStyle = useMemo(() => ({
    ...popupBaseStyle,
    animation: 'fadeInOut 1s ease-in-out',
  }), [popupBaseStyle]);

  const helpOverlayStyle = useMemo(() => ({
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'var(--overlay-darkest)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    animation: 'helpFadeIn 0.2s ease-out',
  }), []);

  const helpModalStyle = useMemo(() => ({
    backgroundColor: 'var(--modal-bg)',
    borderRadius: '1rem',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    color: 'var(--static-dark-text-color)',
  }), []);

  const helpTitleStyle = useMemo(() => ({
    margin: '0 0 1.5rem 0',
    fontSize: '1.5rem',
    fontWeight: 600,
  }), []);

  const helpListStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  }), []);

  const helpItemStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  }), []);

  const helpKeyStyle = useMemo(() => ({
    backgroundColor: 'var(--modal-bg-secondary)',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontFamily: 'monospace',
    fontSize: '1rem',
    fontWeight: 600,
    minWidth: '2.5rem',
    textAlign: 'center' as const,
  }), []);

  const helpDescStyle = useMemo(() => ({
    fontSize: '0.95rem',
    opacity: 0.9,
  }), []);

  const helpFooterStyle = useMemo(() => ({
    marginTop: '2rem',
    textAlign: 'center' as const,
    opacity: 0.6,
    fontSize: '0.875rem',
  }), []);

  return (
    <DebugContext.Provider value={value}>
      {children}

      {/* Initial hint popup (3 seconds on load) */}
      {showHint && !showHelp && (
        <div style={hintStyle}>
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
        <div style={notificationStyle}>
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
        <div style={helpOverlayStyle}>
          <div style={helpModalStyle}>
            <h2 style={helpTitleStyle}>
              Keyboard Shortcuts
            </h2>
            <div style={helpListStyle}>
              {KEYBINDS.map(({ key, description }) => (
                <div key={key} style={helpItemStyle}>
                  <span style={helpKeyStyle}>
                    {key}
                  </span>
                  <span style={helpDescStyle}>
                    {description}
                  </span>
                </div>
              ))}
            </div>
            <div style={helpFooterStyle}>
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
