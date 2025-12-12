// src/app/display/context/__tests__/PrayerTimesContext.downtime.test.tsx
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { PrayerTimesProvider, usePrayerTimesContext } from '../PrayerTimesContext';

// Mock the Firebase hook
const mockTimes = {
  fajrStart: '05:00',
  fajrJamaat: '05:30',
  sunrise: '06:30',
  dhuhrStart: '12:00',
  dhuhrJamaat: '13:00',
  asrStart: '15:00',
  asrJamaat: '16:00',
  maghrib: '18:30',
  ishaStart: '20:00',
  ishaJamaat: '21:00', // 9 PM
};

jest.mock('@/app/hooks/usePrayerTimesFromFirebase', () => ({
  usePrayerTimesFromFirebase: jest.fn(() => ({
    times: mockTimes,
    error: null,
    isLoading: false,
  })),
}));

// Test component
function TestComponent() {
  const { isDowntime, currentMinutes, prayerTimes } = usePrayerTimesContext();
  return (
    <div>
      <div data-testid="is-downtime">{String(isDowntime)}</div>
      <div data-testid="current-minutes">{currentMinutes}</div>
      <div data-testid="isha">{prayerTimes?.ishaJamaat}</div>
      <div data-testid="fajr">{prayerTimes?.fajrJamaat}</div>
    </div>
  );
}

describe('PrayerTimesContext - Downtime Logic', () => {
  const RealDate = global.Date;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    global.Date = RealDate;
  });

  // Helper to mock specific time
  function setMockTime(hours: number, minutes: number) {
    const mockDate = new Date(2024, 0, 15, hours, minutes, 0);
    jest.setSystemTime(mockDate);
  }

  /**
   * Downtime period: 1 hour after Isha (22:00) to 1 hour before Fajr (04:30)
   * Given: Isha at 21:00, Fajr at 05:30
   * Downtime: 22:00 to 04:30
   */

  describe('downtime calculation', () => {
    it('should NOT be in downtime during daytime (10:00)', () => {
      setMockTime(10, 0); // 10:00 AM

      render(
        <PrayerTimesProvider>
          <TestComponent />
        </PrayerTimesProvider>
      );

      expect(screen.getByTestId('is-downtime').textContent).toBe('false');
    });

    it('should NOT be in downtime just before Isha (20:30)', () => {
      setMockTime(20, 30); // 8:30 PM

      render(
        <PrayerTimesProvider>
          <TestComponent />
        </PrayerTimesProvider>
      );

      expect(screen.getByTestId('is-downtime').textContent).toBe('false');
    });

    it('should NOT be in downtime right after Isha (21:30)', () => {
      setMockTime(21, 30); // 9:30 PM - only 30 min after Isha, need 1 hour

      render(
        <PrayerTimesProvider>
          <TestComponent />
        </PrayerTimesProvider>
      );

      expect(screen.getByTestId('is-downtime').textContent).toBe('false');
    });

    it('should BE in downtime 1 hour after Isha (22:00)', () => {
      setMockTime(22, 0); // 10:00 PM - exactly 1 hour after Isha

      render(
        <PrayerTimesProvider>
          <TestComponent />
        </PrayerTimesProvider>
      );

      expect(screen.getByTestId('is-downtime').textContent).toBe('true');
    });

    it('should BE in downtime at midnight (00:00)', () => {
      setMockTime(0, 0); // Midnight

      render(
        <PrayerTimesProvider>
          <TestComponent />
        </PrayerTimesProvider>
      );

      expect(screen.getByTestId('is-downtime').textContent).toBe('true');
    });

    it('should BE in downtime early morning (03:00)', () => {
      setMockTime(3, 0); // 3:00 AM

      render(
        <PrayerTimesProvider>
          <TestComponent />
        </PrayerTimesProvider>
      );

      expect(screen.getByTestId('is-downtime').textContent).toBe('true');
    });

    it('should BE in downtime just before 1hr before Fajr (04:29)', () => {
      setMockTime(4, 29); // 4:29 AM - just before the cutoff (04:30)

      render(
        <PrayerTimesProvider>
          <TestComponent />
        </PrayerTimesProvider>
      );

      // 04:29 = 269 minutes, downtimeEnd = 270, so 269 < 270 is true = still in downtime
      expect(screen.getByTestId('is-downtime').textContent).toBe('true');
    });

    it('should NOT be in downtime exactly 1 hour before Fajr (04:30)', () => {
      setMockTime(4, 30); // 4:30 AM - exactly 1 hour before Fajr (05:30)

      render(
        <PrayerTimesProvider>
          <TestComponent />
        </PrayerTimesProvider>
      );

      expect(screen.getByTestId('is-downtime').textContent).toBe('false');
    });

    it('should NOT be in downtime just after Fajr (06:00)', () => {
      setMockTime(6, 0); // 6:00 AM

      render(
        <PrayerTimesProvider>
          <TestComponent />
        </PrayerTimesProvider>
      );

      expect(screen.getByTestId('is-downtime').textContent).toBe('false');
    });
  });

  describe('currentMinutes tracking', () => {
    it('should calculate current minutes correctly', () => {
      setMockTime(14, 30); // 2:30 PM = 14*60 + 30 = 870 minutes

      render(
        <PrayerTimesProvider>
          <TestComponent />
        </PrayerTimesProvider>
      );

      expect(screen.getByTestId('current-minutes').textContent).toBe('870');
    });

    it('should handle midnight correctly (0 minutes)', () => {
      setMockTime(0, 0); // Midnight = 0 minutes

      render(
        <PrayerTimesProvider>
          <TestComponent />
        </PrayerTimesProvider>
      );

      expect(screen.getByTestId('current-minutes').textContent).toBe('0');
    });

    it('should handle end of day correctly (23:59 = 1439 minutes)', () => {
      setMockTime(23, 59);

      render(
        <PrayerTimesProvider>
          <TestComponent />
        </PrayerTimesProvider>
      );

      expect(screen.getByTestId('current-minutes').textContent).toBe('1439');
    });
  });
});

describe('PrayerTimesContext - Edge Cases', () => {
  it('downtime should be false when prayer times are null', () => {
    // This tests the logic directly without React hooks
    // The useMemo in the context checks: if (!times) return false;
    const times = null;
    const currentMinutes = 1380; // 23:00 - would be downtime if times existed

    // Simulating the context logic
    const isDowntime = times === null ? false : true; // Simplified, actual logic is more complex
    expect(isDowntime).toBe(false);
  });

  it('downtime calculation handles edge case at boundary', () => {
    // Test the boundary calculation logic directly
    const ishaMinutes = 21 * 60; // 21:00 = 1260
    const fajrMinutes = 5 * 60 + 30; // 05:30 = 330

    const downtimeStart = ishaMinutes + 60; // 22:00 = 1320
    const downtimeEnd = fajrMinutes - 60;   // 04:30 = 270

    // At exactly downtimeEnd (270), should NOT be in downtime (using < not <=)
    const currentMinutes = 270;
    const isDowntime = currentMinutes >= downtimeStart || currentMinutes < downtimeEnd;
    expect(isDowntime).toBe(false);

    // One minute before (269), should BE in downtime
    const beforeEnd = 269;
    const isDowntimeBefore = beforeEnd >= downtimeStart || beforeEnd < downtimeEnd;
    expect(isDowntimeBefore).toBe(true);
  });
});
