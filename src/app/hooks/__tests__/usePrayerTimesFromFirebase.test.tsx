// src/app/hooks/__tests__/usePrayerTimesFromFirebase.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePrayerTimesFromFirebase } from '../usePrayerTimesFromFirebase';
import type { RawPrayerTimes } from '@/app/FetchPrayerTimes';

// Mock the Firebase service
vi.mock('@/lib/firebase/prayerTimes', () => ({
  getPrayerTimesByDate: vi.fn(),
  getTodayDateString: vi.fn(() => '01/11/2025'),
}));

describe('usePrayerTimesFromFirebase', () => {
  const mockPrayerTimes: RawPrayerTimes = {
    fajrStart: '05:30',
    fajrJamaat: '06:00',
    sunrise: '07:04',
    dhuhrStart: '11:54',
    dhuhrJamaat: '12:45',
    asrStart: '14:10',
    asrJamaat: '15:00',
    maghrib: '16:39',
    ishaStart: '18:09',
    ishaJamaat: '18:09',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch prayer times on mount', async () => {
    const { getPrayerTimesByDate } = await import('@/lib/firebase/prayerTimes');
    vi.mocked(getPrayerTimesByDate).mockResolvedValue(mockPrayerTimes);

    const { result } = renderHook(() => usePrayerTimesFromFirebase());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.times).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.times).toEqual(mockPrayerTimes);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const { getPrayerTimesByDate } = await import('@/lib/firebase/prayerTimes');
    const errorMessage = 'No prayer times found for 01/11/2025. Please sync from Google Sheets.';
    vi.mocked(getPrayerTimesByDate).mockResolvedValue(null);

    const { result } = renderHook(() => usePrayerTimesFromFirebase());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.times).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('should refetch every 5 minutes', async () => {
    const { getPrayerTimesByDate } = await import('@/lib/firebase/prayerTimes');
    vi.mocked(getPrayerTimesByDate).mockResolvedValue(mockPrayerTimes);

    const { result } = renderHook(() => usePrayerTimesFromFirebase());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getPrayerTimesByDate).toHaveBeenCalledTimes(1);

    // Fast-forward 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(getPrayerTimesByDate).toHaveBeenCalledTimes(2);
    });
  });

  it('should detect date changes', async () => {
    const { getPrayerTimesByDate, getTodayDateString } = await import('@/lib/firebase/prayerTimes');
    vi.mocked(getPrayerTimesByDate).mockResolvedValue(mockPrayerTimes);

    // Start with Nov 1
    vi.mocked(getTodayDateString).mockReturnValue('01/11/2025');

    const { result, rerender } = renderHook(() => usePrayerTimesFromFirebase());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getPrayerTimesByDate).toHaveBeenCalledWith('01/11/2025');

    // Change to Nov 2
    vi.mocked(getTodayDateString).mockReturnValue('02/11/2025');

    // Trigger refetch
    vi.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(getPrayerTimesByDate).toHaveBeenCalledWith('02/11/2025');
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should only update state when times actually change', async () => {
    const { getPrayerTimesByDate } = await import('@/lib/firebase/prayerTimes');
    vi.mocked(getPrayerTimesByDate).mockResolvedValue(mockPrayerTimes);

    const { result } = renderHook(() => usePrayerTimesFromFirebase());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstTimes = result.current.times;

    // Refetch with same data
    vi.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      // Reference should be the same (no state update)
      expect(result.current.times).toBe(firstTimes);
    });
  });

  it('should update state when times change', async () => {
    const { getPrayerTimesByDate } = await import('@/lib/firebase/prayerTimes');
    vi.mocked(getPrayerTimesByDate).mockResolvedValue(mockPrayerTimes);

    const { result } = renderHook(() => usePrayerTimesFromFirebase());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstTimes = result.current.times;

    // Update mock to return different times
    const updatedTimes = { ...mockPrayerTimes, fajrStart: '05:31' };
    vi.mocked(getPrayerTimesByDate).mockResolvedValue(updatedTimes);

    vi.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(result.current.times).not.toBe(firstTimes);
      expect(result.current.times?.fajrStart).toBe('05:31');
    });
  });

  it('should cleanup timers on unmount', async () => {
    const { getPrayerTimesByDate } = await import('@/lib/firebase/prayerTimes');
    vi.mocked(getPrayerTimesByDate).mockResolvedValue(mockPrayerTimes);

    const { unmount } = renderHook(() => usePrayerTimesFromFirebase());

    await waitFor(() => {
      expect(getPrayerTimesByDate).toHaveBeenCalled();
    });

    const callCountBeforeUnmount = getPrayerTimesByDate.mock.calls.length;

    unmount();

    // Fast-forward time after unmount
    vi.advanceTimersByTime(10 * 60 * 1000);

    // Should not have called again
    expect(getPrayerTimesByDate).toHaveBeenCalledTimes(callCountBeforeUnmount);
  });
});
