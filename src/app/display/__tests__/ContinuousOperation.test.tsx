import React from 'react'
import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import type { RawPrayerTimes } from '@/app/FetchPrayerTimes'
import DowntimeDisplay from '../Components/DowntimeDisplay'
import AutoReloadOnNewVersion from '../Components/AutoReloadOnNewVersion'
import useMessages from '../Components/Rotator/Messages'
import { getPrayerTimesByDate } from '@/lib/firebase/prayerTimes'
import { getDocs, onSnapshot } from 'firebase/firestore'

const times: RawPrayerTimes = {
  fajrStart: '05:00', fajrJamaat: '05:30', sunrise: '06:30',
  dhuhrStart: '12:00', dhuhrJamaat: '13:00', asrStart: '15:00',
  asrJamaat: '16:00', maghrib: '18:30', ishaStart: '20:00', ishaJamaat: '21:00',
}
let mockContextTimes: RawPrayerTimes | null = times
jest.mock('@/lib/firebase', () => ({ db: {} }))
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(), query: jest.fn(), orderBy: jest.fn(),
  getDocs: jest.fn(), onSnapshot: jest.fn(),
}))
jest.mock('@/lib/firebase/prayerTimes', () => ({
  getPrayerTimesByDate: jest.fn(),
  getTodayDateString: (date = new Date()) => date.toLocaleDateString('en-GB'),
  getTomorrowDateString: (date = new Date()) => {
    const tomorrow = new Date(date); tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toLocaleDateString('en-GB')
  },
}))
jest.mock('../context/PrayerTimesContext', () => ({
  usePrayerTimesContext: () => ({ prayerTimes: mockContextTimes, isRamadan: false }),
}))
jest.mock('@/app/hooks/useWeather', () => ({ useWeather: () => ({ weather: null }) }))
jest.mock('gsap', () => ({ gsap: {
  context: (fn: () => void) => { fn(); return { revert: jest.fn() } },
  timeline: () => ({ from: jest.fn() }),
} }))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
const flush = async () => { await act(async () => {}) }
const advance = async (ms: number) => { await act(async () => { await jest.advanceTimersByTimeAsync(ms) }) }
const emptyConditions = { docs: [] } as unknown as Awaited<ReturnType<typeof getDocs>>
const snapshot = (text: string) => ({ docs: [{ id: 'notice', ref: {}, data: () => ({
  sourceType: 'other', other: { arabicText: '', englishText: text },
}) }] })
const listener = () => jest.mocked(onSnapshot).mock.calls.at(-1)![1] as unknown as (data: unknown) => Promise<void>

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-09-09T23:50:00'))
  mockContextTimes = times
  jest.mocked(getPrayerTimesByDate).mockReset().mockResolvedValue(times)
  jest.mocked(getDocs).mockReset().mockResolvedValue(emptyConditions)
  jest.mocked(onSnapshot).mockReset().mockReturnValue(jest.fn())
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { cleanup(); jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks() })

it('recovers the overnight timetable after an outage without requiring a date change', async () => {
  jest.mocked(getPrayerTimesByDate).mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ ...times, fajrJamaat: '05:42' })
  render(<DowntimeDisplay />)
  await flush()
  expect(screen.getByText('Prayer times unavailable. Retrying...')).toBeInTheDocument()
  expect(screen.queryByText('05:30')).not.toBeInTheDocument()
  await advance(5 * 60_000)
  expect(screen.getByText('05:42')).toBeInTheDocument()
  expect(getPrayerTimesByDate).toHaveBeenCalledTimes(2)
})

it('retries a missing tomorrow timetable while keeping today’s Fajr out of tomorrow’s heading', async () => {
  jest.mocked(getPrayerTimesByDate).mockResolvedValueOnce(null)
  render(<DowntimeDisplay />)
  await flush()
  expect(screen.getByText("Tomorrow's Prayer Times")).toBeInTheDocument()
  expect(screen.queryByText('05:30')).not.toBeInTheDocument()
  await advance(5 * 60_000)
  expect(screen.getByText('05:30')).toBeInTheDocument()
})

it('keeps loaded overnight data during a refresh failure', async () => {
  jest.mocked(getPrayerTimesByDate).mockResolvedValueOnce(times).mockRejectedValueOnce(new Error('offline'))
  render(<DowntimeDisplay />)
  await flush()
  await advance(5 * 60_000)
  expect(screen.getByText('05:30')).toBeInTheDocument()
  expect(screen.queryByText('Prayer times unavailable. Retrying...')).not.toBeInTheDocument()
})

it('uses updated provider data after midnight instead of a stale overnight copy', async () => {
  jest.setSystemTime(new Date('2026-09-09T23:59:59'))
  render(<DowntimeDisplay />)
  await flush()
  mockContextTimes = { ...times, fajrJamaat: '05:42' }
  await advance(1_000)
  expect(screen.getByText("Today's Prayer Times")).toBeInTheDocument()
  expect(screen.getByText('05:42')).toBeInTheDocument()
  expect(screen.queryByText('05:30')).not.toBeInTheDocument()
})

it('times out a hanging overnight read and ignores its late result after recovery', async () => {
  const pending = deferred<RawPrayerTimes | null>()
  jest.mocked(getPrayerTimesByDate).mockReturnValueOnce(pending.promise)
  render(<DowntimeDisplay />)
  await advance(20_000)
  expect(screen.getByText('Prayer times unavailable. Retrying...')).toBeInTheDocument()
  await advance(5 * 60_000)
  await act(async () => { pending.resolve({ ...times, fajrJamaat: '04:00' }) })
  expect(screen.getByText('05:30')).toBeInTheDocument()
  expect(screen.queryByText('04:00')).not.toBeInTheDocument()
})

it('cancels an overnight request and its retry scheduling on unmount', async () => {
  const pending = deferred<RawPrayerTimes | null>()
  jest.mocked(getPrayerTimesByDate).mockReturnValueOnce(pending.promise)
  const { unmount } = render(<DowntimeDisplay />)
  unmount()
  await act(async () => { pending.reject(new Error('late error')) })
  await advance(10 * 60_000)
  expect(getPrayerTimesByDate).toHaveBeenCalledTimes(1)
  expect(console.error).not.toHaveBeenCalled()
  expect(jest.getTimerCount()).toBe(0)
})

it('keeps the newest message snapshot when older condition reads finish late', async () => {
  const pending = deferred<Awaited<ReturnType<typeof getDocs>>>()
  jest.mocked(getDocs).mockReturnValueOnce(pending.promise)
  const { result } = renderHook(useMessages)
  let older!: Promise<void>
  await act(async () => { older = listener()(snapshot('Old')); await listener()(snapshot('New')) })
  expect(result.current[0].other?.englishText).toBe('New')
  await act(async () => { pending.resolve(emptyConditions); await older })
  expect(result.current[0].other?.englishText).toBe('New')
})

it('handles failed condition reads, preserves existing notices and retries the latest snapshot', async () => {
  const { result } = renderHook(useMessages)
  await act(async () => { await listener()(snapshot('Existing')) })
  jest.mocked(getDocs).mockRejectedValueOnce(new Error('offline'))
  await act(async () => { await listener()(snapshot('Updated')) })
  expect(result.current[0].other?.englishText).toBe('Existing')
  await advance(5_000)
  expect(result.current[0].other?.englishText).toBe('Updated')
})

it('discards an obsolete retry when a newer message snapshot arrives', async () => {
  jest.mocked(getDocs).mockRejectedValueOnce(new Error('offline'))
  const { result } = renderHook(useMessages)
  await act(async () => { await listener()(snapshot('Old')) })
  await act(async () => { await listener()(snapshot('New')) })
  await advance(60_000)
  expect(result.current[0].other?.englishText).toBe('New')
  expect(getDocs).toHaveBeenCalledTimes(2)
})

it('bounds hanging conditions reads and ignores their eventual completion', async () => {
  const pending = deferred<Awaited<ReturnType<typeof getDocs>>>()
  jest.mocked(getDocs).mockReturnValueOnce(pending.promise)
  const { result } = renderHook(useMessages)
  act(() => { void listener()(snapshot('Notice')) })
  await advance(25_000)
  expect(result.current[0].other?.englishText).toBe('Notice')
  expect(getDocs).toHaveBeenCalledTimes(2)
  await act(async () => { pending.reject(new Error('late rejection')) })
  expect(result.current[0].other?.englishText).toBe('Notice')
})

it('reattaches a failed subscription and cleans up on unmount', async () => {
  const { unmount } = renderHook(useMessages)
  const unsubscribe = jest.mocked(onSnapshot).mock.results[0].value
  const onError = jest.mocked(onSnapshot).mock.calls[0][2] as unknown as (error: Error) => void
  act(() => { onError(new Error('subscription failed')) })
  await advance(5_000)
  expect(onSnapshot).toHaveBeenCalledTimes(2)
  expect(unsubscribe).toHaveBeenCalled()
  unmount()
  await advance(60_000)
  expect(onSnapshot).toHaveBeenCalledTimes(2)
  expect(jest.getTimerCount()).toBe(0)
})

it('prevents late condition responses from restarting work after unmount', async () => {
  const pending = deferred<Awaited<ReturnType<typeof getDocs>>>()
  jest.mocked(getDocs).mockReturnValueOnce(pending.promise)
  const { unmount } = renderHook(useMessages)
  act(() => { void listener()(snapshot('Notice')) })
  unmount()
  await act(async () => { pending.reject(new Error('late rejection')) })
  await advance(60_000)
  expect(getDocs).toHaveBeenCalledTimes(1)
  expect(console.error).not.toHaveBeenCalled()
  expect(jest.getTimerCount()).toBe(0)
})

it('quarantines malformed notices without discarding other valid notices', async () => {
  const { result } = renderHook(useMessages)
  jest.mocked(getDocs).mockResolvedValueOnce({ docs: [{ data: () => ({ type: 'time', entries: null }) }] } as never)
  const bad = snapshot('Bad').docs[0]
  const good = { ...snapshot('Good').docs[0], id: 'good' }
  await act(async () => { await listener()({ docs: [bad, good] }) })
  expect(result.current.map(message => message.other?.englishText)).toEqual(['Good'])
})

it('keeps editor-created notices with a blank optional hadith reference', async () => {
  const { result } = renderHook(useMessages)
  await act(async () => { await listener()({ docs: [{ id: 'hadith', ref: {}, data: () => ({
    sourceType: 'hadith', hadith: { number: '', author: '', authenticity: '', arabicText: '', englishText: 'Notice text' },
  }) }] }) })
  expect(result.current[0].hadith?.englishText).toBe('Notice text')
})

it('defers deployment reloads while a prayer or slideshow is active', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockReset().mockResolvedValue({
    ok: true, json: async () => ({ version: 'build-b' }),
  } as Response)
  const { unmount } = render(<><div data-display-busy="prayer" /><AutoReloadOnNewVersion currentVersion="build-a" /></>)
  await flush()
  await advance(300_000)
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(sessionStorage.getItem('judi.display.reload')).toBeNull()
  unmount()
})

it('aborts hanging version requests and retries without accumulating concurrent requests', async () => {
  let active = 0
  let maxActive = 0
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockReset().mockImplementation((_url, init) => {
    active++; maxActive = Math.max(maxActive, active)
    return new Promise((_resolve, reject) => {
      init!.signal!.addEventListener('abort', () => {
        active--; reject(new DOMException('Aborted', 'AbortError'))
      }, { once: true })
    })
  })
  const { unmount } = render(<AutoReloadOnNewVersion currentVersion="build-a" />)
  await advance(30 * 60_000)
  expect(fetchMock.mock.calls.length).toBeGreaterThan(1)
  expect(maxActive).toBe(1)
  unmount()
  await advance(0)
  expect(active).toBe(0)
  expect(jest.getTimerCount()).toBe(0)
})

it('ignores a version response arriving after unmount', async () => {
  const pending = deferred<Response>()
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockReset().mockReturnValueOnce(pending.promise)
  const { unmount } = render(<AutoReloadOnNewVersion currentVersion="build-a" />)
  unmount()
  await act(async () => { pending.resolve({ ok: true, json: async () => ({ version: 'build-b' }) } as Response) })
  await advance(10 * 60_000)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(console.error).not.toHaveBeenCalled()
  expect(jest.getTimerCount()).toBe(0)
})
