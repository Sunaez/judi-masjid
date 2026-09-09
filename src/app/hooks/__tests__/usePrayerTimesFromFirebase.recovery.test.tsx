import React from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { RawPrayerTimes } from '@/app/FetchPrayerTimes'
import { getPrayerTimesByDate, getTodayDateString } from '@/lib/firebase/prayerTimes'
import { usePrayerTimesFromFirebase } from '../usePrayerTimesFromFirebase'
import { cacheTimetable } from '@/lib/timetableCache'

jest.mock('@/lib/firebase/prayerTimes', () => ({
  getPrayerTimesByDate: jest.fn(),
  getTodayDateString: jest.fn(),
}))

const fetchTimes = getPrayerTimesByDate as jest.Mock
const times: RawPrayerTimes = {
  fajrStart: '05:00', fajrJamaat: '05:30', sunrise: '06:30',
  dhuhrStart: '12:00', dhuhrJamaat: '13:00', asrStart: '15:00',
  asrJamaat: '16:00', maghrib: '18:30', ishaStart: '20:00', ishaJamaat: '21:00',
}

function deferred() {
  let resolve!: (value: RawPrayerTimes | null) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<RawPrayerTimes | null>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
const flush = async () => { await act(async () => {}) }
const advance = async (ms: number) => { await act(async () => { await jest.advanceTimersByTimeAsync(ms) }) }

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-09-09T10:00:00'))
  fetchTimes.mockReset().mockResolvedValue(times)
  ;(getTodayDateString as jest.Mock).mockImplementation(() => {
    const now = new Date()
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
  })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  jest.clearAllTimers()
  jest.useRealTimers()
  jest.restoreAllMocks()
})

it('recovers when a missing timetable is uploaded later', async () => {
  fetchTimes.mockResolvedValueOnce(null)
  const { result } = renderHook(usePrayerTimesFromFirebase)
  await flush()
  expect(result.current.error).toContain('No prayer times found')
  await advance(5 * 60_000)
  expect(fetchTimes).toHaveBeenCalledTimes(2)
  expect(result.current.times).toEqual(times)
  expect(result.current.timesDate).toBe('09/09/2026')
  expect(result.current.error).toBeNull()
})

it('restores a valid current-date timetable after an offline restart', async () => {
  cacheTimetable('09/09/2026', times)
  fetchTimes.mockRejectedValue(new Error('offline'))
  const { result } = renderHook(usePrayerTimesFromFirebase)
  await flush()
  expect(result.current.times).toEqual(times)
  expect(result.current.timesDate).toBe('09/09/2026')
  expect(result.current.error).toBe('offline')
})

it('uses prefetched next-day times when connectivity is lost across midnight', async () => {
  jest.setSystemTime(new Date('2026-09-09T23:59:59'))
  const tomorrow = { ...times, fajrJamaat: '05:45' }
  cacheTimetable('10/09/2026', tomorrow)
  fetchTimes.mockResolvedValueOnce(times).mockRejectedValue(new Error('offline'))
  const { result } = renderHook(usePrayerTimesFromFirebase)
  await flush()
  await advance(1_000)
  expect(result.current.times).toEqual(tomorrow)
  expect(result.current.timesDate).toBe('10/09/2026')
})

it('times out a hanging initial read and recovers during the same day', async () => {
  const pending = deferred()
  fetchTimes.mockReturnValueOnce(pending.promise)
  const { result } = renderHook(usePrayerTimesFromFirebase)
  await advance(20_000)
  expect(result.current.isLoading).toBe(false)
  expect(result.current.error).toBe('Request timed out')
  await advance(5 * 60_000)
  expect(fetchTimes).toHaveBeenCalledTimes(2)
  expect(result.current.times).toEqual(times)
  expect(result.current.error).toBeNull()
  await act(async () => { pending.resolve({ ...times, fajrJamaat: '04:00' }) })
  expect(result.current.times).toEqual(times)
})

it('retains current-day times when a refresh hangs and ignores its late rejection', async () => {
  const pending = deferred()
  fetchTimes.mockResolvedValueOnce(times).mockReturnValueOnce(pending.promise)
  const { result } = renderHook(usePrayerTimesFromFirebase)
  await flush()
  await advance(5 * 60_000 + 20_000)
  expect(result.current.times).toEqual(times)
  expect(result.current.error).toBe('Request timed out')
  await advance(5 * 60_000)
  await act(async () => { pending.reject(new Error('late failure')) })
  expect(result.current.error).toBeNull()
  expect(fetchTimes).toHaveBeenCalledTimes(3)
})

it('does not rapidly fetch in the second before a blocked prayer window', async () => {
  jest.setSystemTime(new Date('2026-09-09T11:56:59'))
  renderHook(usePrayerTimesFromFirebase)
  await flush()
  await advance(100)
  expect(fetchTimes).toHaveBeenCalledTimes(1)
  await advance(8 * 60_000 + 900)
  expect(fetchTimes).toHaveBeenCalledTimes(1)
  await advance(1_000)
  expect(fetchTimes).toHaveBeenCalledTimes(2)
})

it('waits until all overlapping prayer windows have ended', async () => {
  jest.setSystemTime(new Date('2026-09-09T11:54:00'))
  fetchTimes.mockResolvedValue({ ...times, dhuhrJamaat: '12:04' })
  renderHook(usePrayerTimesFromFirebase)
  await flush()
  await advance(15 * 60_000)
  expect(fetchTimes).toHaveBeenCalledTimes(1)
  await advance(1_000)
  expect(fetchTimes).toHaveBeenCalledTimes(2)
})

it('rechecks prayer windows when a delayed timer wakes after the clock changes', async () => {
  renderHook(usePrayerTimesFromFirebase)
  await flush()
  jest.setSystemTime(new Date('2026-09-09T11:52:00'))
  await advance(5 * 60_000)
  expect(fetchTimes).toHaveBeenCalledTimes(1)
  await advance(8 * 60_000 + 1_000)
  expect(fetchTimes).toHaveBeenCalledTimes(2)
})

it.each(['network', 'missing', 'invalid'])('preserves current-day data during %s failure and clears errors on unchanged recovery', async failure => {
  fetchTimes.mockResolvedValueOnce(times)
  if (failure === 'network') fetchTimes.mockRejectedValueOnce(new Error('temporary offline'))
  if (failure === 'missing') fetchTimes.mockResolvedValueOnce(null)
  if (failure === 'invalid') fetchTimes.mockResolvedValueOnce({ ...times, fajrStart: '25:00' })
  const { result } = renderHook(usePrayerTimesFromFirebase)
  await flush()
  const originalTimes = result.current.times
  await advance(5 * 60_000)
  expect(result.current.error).not.toBeNull()
  expect(result.current.times).toBe(originalTimes)
  expect(result.current.isLoading).toBe(false)
  await advance(5 * 60_000)
  expect(result.current.error).toBeNull()
  expect(result.current.times).toBe(originalTimes)
})

it('removes yesterday’s times at midnight even when today’s timetable is missing', async () => {
  jest.setSystemTime(new Date('2026-09-09T23:58:00'))
  fetchTimes.mockResolvedValueOnce(times).mockResolvedValue(null)
  const { result } = renderHook(usePrayerTimesFromFirebase)
  await flush()
  expect(result.current.timesDate).toBe('09/09/2026')
  await advance(2 * 60_000)
  expect(result.current.times).toBeNull()
  expect(result.current.timesDate).toBeNull()
  expect(result.current.error).toContain('10/09/2026')
  await advance(5 * 60_000)
  expect(fetchTimes).toHaveBeenCalledTimes(3)
})

it('maintains one polling timer across three midnight rollovers', async () => {
  jest.setSystemTime(new Date('2026-09-09T23:58:00'))
  const requests: { date: string; at: number }[] = []
  fetchTimes.mockImplementation(async (date: string) => {
    requests.push({ date, at: Date.now() })
    return null
  })
  renderHook(usePrayerTimesFromFirebase)
  await flush()
  await advance(2 * 60_000 + 48 * 60 * 60_000)
  expect(jest.getTimerCount()).toBe(1)
  expect(new Set(requests.map(request => request.at)).size).toBe(requests.length)
  for (const day of ['10', '11', '12']) {
    const midnight = new Date(`2026-09-${day}T00:00:00`).getTime()
    expect(requests.filter(request => request.at === midnight)).toEqual([{ date: `${day}/09/2026`, at: midnight }])
  }
  expect(requests).toHaveLength(578)
}, 20_000)

it.each(['resolve', 'reject'] as const)('ignores an old-day request that later %ss without restarting its loop', async outcome => {
  jest.setSystemTime(new Date('2026-09-09T23:59:00'))
  const pending = deferred()
  fetchTimes.mockReturnValueOnce(pending.promise)
  const { result } = renderHook(usePrayerTimesFromFirebase)
  await flush()
  await advance(60_000)
  expect(result.current.timesDate).toBe('10/09/2026')
  await act(async () => {
    if (outcome === 'resolve') pending.resolve({ ...times, fajrJamaat: '04:00' })
    else pending.reject(new Error('yesterday failed'))
  })
  await advance(0)
  expect(result.current.times).toEqual(times)
  expect(result.current.error).toBeNull()
  expect(jest.getTimerCount()).toBe(1)
  await advance(5 * 60_000)
  expect(fetchTimes).toHaveBeenCalledTimes(3)
})

it.each(['resolve', 'reject'] as const)('does not restart polling when a request %ss after unmount', async outcome => {
  const pending = deferred()
  fetchTimes.mockReturnValueOnce(pending.promise)
  const { unmount } = renderHook(usePrayerTimesFromFirebase)
  unmount()
  await act(async () => {
    if (outcome === 'resolve') pending.resolve(times)
    else pending.reject(new Error('offline'))
  })
  await advance(10 * 60_000)
  expect(fetchTimes).toHaveBeenCalledTimes(1)
  expect(jest.getTimerCount()).toBe(0)
  expect(console.error).not.toHaveBeenCalled()
})

it('ignores the disposed Strict Mode request and keeps one polling loop', async () => {
  const pending = deferred()
  fetchTimes.mockReturnValueOnce(pending.promise)
  const { result } = renderHook(usePrayerTimesFromFirebase, { wrapper: React.StrictMode })
  await flush()
  await act(async () => { pending.resolve({ ...times, fajrJamaat: '04:00' }) })
  await advance(0)
  expect(result.current.times).toEqual(times)
  expect(jest.getTimerCount()).toBe(1)
  await advance(5 * 60_000)
  expect(fetchTimes).toHaveBeenCalledTimes(3)
})
