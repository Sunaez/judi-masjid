import React from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { gsap } from 'gsap'
import { ThemeProvider } from '../ThemeProvider'
import Display from '../page'
import { subscribeSlideshowSettings } from '@/lib/firebase/slideshowSettings'

const mockContext = {
  prayerTimes: { fajrStart: '05:00', fajrJamaat: '05:30', sunrise: '06:30', dhuhrStart: '12:00',
    dhuhrJamaat: '13:00', asrStart: '15:00', asrJamaat: '16:00', maghrib: '18:30', ishaStart: '20:00', ishaJamaat: '21:00' },
  isLoading: false, error: null as string | null, isDowntime: false,
}
jest.mock('../context/PrayerTimesContext', () => ({ usePrayerTimesContext: () => mockContext }))
jest.mock('../context/DebugContext', () => ({ useDebugContext: () => ({ downtimeOverrideActive: false }) }))
jest.mock('../Components/Rotator', () => ({ __esModule: true, default: () => <div data-testid="rotator" /> }))
jest.mock('../Components/PrayerTimeline', () => ({ __esModule: true, default: () => null }))
jest.mock('../Components/PrayerOverlay', () => ({ __esModule: true, default: () => null }))
jest.mock('../Components/PostPrayerTableOverlay', () => ({ __esModule: true, default: () => null }))
jest.mock('../Components/DowntimeDisplay', () => ({ __esModule: true, default: () => <div data-testid="downtime" /> }))
jest.mock('../Components/SlideshowOverlay', () => ({ __esModule: true, default: () => null }))
jest.mock('@/lib/firebase/slideshowSettings', () => ({ subscribeSlideshowSettings: jest.fn(), isSlideshowWindowActive: () => false }))
jest.mock('gsap', () => {
  const api = {
    context: (fn: () => void) => { fn(); return { revert: jest.fn() } },
    timeline: jest.fn(() => ({ fromTo: jest.fn(), to: jest.fn(), kill: jest.fn() })),
    to: jest.fn((_element, options) => { options.onComplete?.() }),
  }
  return { __esModule: true, default: api, gsap: api }
})
beforeEach(() => {
  jest.useFakeTimers()
  mockContext.isDowntime = false; mockContext.error = null
  jest.mocked(gsap.timeline).mockClear()
  jest.mocked(subscribeSlideshowSettings).mockReset().mockImplementation(onChange => {
    onChange({ active: false, startTime: null, endTime: null }); return jest.fn()
  })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { cleanup(); jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks() })

it('keeps usable display content mounted when a refresh fails with valid cached prayer times', () => {
  const { rerender } = render(<ThemeProvider><div data-testid="display-content" /></ThemeProvider>)
  expect(screen.getByTestId('display-content')).toBeInTheDocument()
  mockContext.error = 'Request timed out'
  rerender(<ThemeProvider><div data-testid="display-content" /></ThemeProvider>)
  expect(screen.queryByTestId('display-content')).toBeInTheDocument()
})

it('does not indefinitely block normal display on a stalled slideshow settings subscription', () => {
  jest.mocked(subscribeSlideshowSettings).mockImplementation(() => jest.fn())
  render(<Display />)
  act(() => { jest.advanceTimersByTime(60_000) })
  expect(screen.queryByTestId('rotator')).toBeInTheDocument()
})

it('reattaches slideshow settings after a terminal subscription error', () => {
  render(<Display />)
  const onError = jest.mocked(subscribeSlideshowSettings).mock.calls[0][1]!
  act(() => { onError({ message: 'permission denied', code: 'permission-denied' } as never) })
  act(() => { jest.advanceTimersByTime(10 * 60_000) })
  expect(jest.mocked(subscribeSlideshowSettings).mock.calls.length).toBeGreaterThan(1)
})

it.each([false, true])('animates the incoming screen when leaving downtime=%s', initial => {
  mockContext.isDowntime = initial
  const { rerender } = render(<Display />)
  mockContext.isDowntime = !initial
  rerender(<Display />)
  const animation = jest.mocked(gsap.timeline).mock.results.at(-1)!.value
  expect(animation.fromTo).toHaveBeenCalled()
})
