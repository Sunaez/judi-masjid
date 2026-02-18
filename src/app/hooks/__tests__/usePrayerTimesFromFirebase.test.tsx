import { act, renderHook, waitFor } from '@testing-library/react'
import type { RawPrayerTimes } from '@/app/FetchPrayerTimes'
import { usePrayerTimesFromFirebase } from '../usePrayerTimesFromFirebase'
import { getPrayerTimesByDate, getTodayDateString } from '@/lib/firebase/prayerTimes'

jest.mock('@/lib/firebase/prayerTimes', () => ({
  getPrayerTimesByDate: jest.fn(),
  getTodayDateString: jest.fn(() => '01/11/2025'),
}))

const mockedGetPrayerTimesByDate = getPrayerTimesByDate as jest.Mock
const mockedGetTodayDateString = getTodayDateString as jest.Mock

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
  }

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-02-18T00:00:00'))
    jest.clearAllMocks()
    mockedGetTodayDateString.mockReturnValue('01/11/2025')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('fetches prayer times on mount', async () => {
    mockedGetPrayerTimesByDate.mockResolvedValue(mockPrayerTimes)

    const { result } = renderHook(() => usePrayerTimesFromFirebase())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.times).toBeNull()

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.times).toEqual(mockPrayerTimes)
    expect(result.current.error).toBeNull()
    expect(mockedGetPrayerTimesByDate).toHaveBeenCalledWith('01/11/2025')
  })

  it('surfaces a clear error when no times exist for the day', async () => {
    mockedGetPrayerTimesByDate.mockResolvedValue(null)

    const { result } = renderHook(() => usePrayerTimesFromFirebase())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.times).toBeNull()
    expect(result.current.error).toContain('No prayer times found for 01/11/2025')
  })

  it('keeps object reference stable when fetched times are unchanged', async () => {
    mockedGetPrayerTimesByDate.mockResolvedValue(mockPrayerTimes)

    const { result } = renderHook(() => usePrayerTimesFromFirebase())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const initialTimesRef = result.current.times

    await act(async () => {
      jest.advanceTimersByTime(5 * 60_000)
    })

    await waitFor(() => {
      expect(mockedGetPrayerTimesByDate).toHaveBeenCalledTimes(2)
    })

    expect(result.current.times).toBe(initialTimesRef)
  })

  it('updates state when fetched times change', async () => {
    mockedGetPrayerTimesByDate
      .mockResolvedValueOnce(mockPrayerTimes)
      .mockResolvedValueOnce({ ...mockPrayerTimes, fajrStart: '05:31' })

    const { result } = renderHook(() => usePrayerTimesFromFirebase())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      jest.advanceTimersByTime(5 * 60_000)
    })

    await waitFor(() => {
      expect(result.current.times?.fajrStart).toBe('05:31')
    })
  })

  it('stops polling after unmount', async () => {
    mockedGetPrayerTimesByDate.mockResolvedValue(mockPrayerTimes)

    const { unmount } = renderHook(() => usePrayerTimesFromFirebase())

    await waitFor(() => {
      expect(mockedGetPrayerTimesByDate).toHaveBeenCalledTimes(1)
    })

    unmount()

    await act(async () => {
      jest.advanceTimersByTime(10 * 60_000)
    })

    expect(mockedGetPrayerTimesByDate).toHaveBeenCalledTimes(1)
  })
})
