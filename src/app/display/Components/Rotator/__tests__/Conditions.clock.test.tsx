import { act, cleanup, renderHook } from '@testing-library/react'
import useValidMessages from '../Conditions'
import type { MessageWithConditions } from '../Messages'

const times = {
  fajrStart: '05:00', fajrJamaat: '05:30', sunrise: '06:30',
  dhuhrStart: '12:00', dhuhrJamaat: '13:00', asrStart: '15:00',
  asrJamaat: '16:00', maghrib: '18:30', ishaStart: '20:00', ishaJamaat: '21:00',
}
const message = (conditions: MessageWithConditions['conditions']): MessageWithConditions => ({
  id: 'notice', sourceType: 'other', conditions,
})
const advance = (ms: number) => act(() => { jest.advanceTimersByTime(ms) })

beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(new Date('2026-09-09T10:59:59')) })
afterEach(() => { cleanup(); jest.clearAllTimers(); jest.useRealTimers() })

it('activates and expires a notice without new data or parent rerenders', () => {
  const messages = [message([{ type: 'time', entries: [{ from: '11:00', to: '11:01' }] }])]
  const { result } = renderHook(() => useValidMessages(messages, times, 'Clear'))
  expect(result.current).toHaveLength(0)
  advance(1_000)
  expect(result.current).toHaveLength(1)
  advance(120_000)
  expect(result.current).toHaveLength(0)
})

it.each(['2026-09-09T23:00:00', '2026-09-10T01:00:00'])('includes a midnight-spanning notice at %s', date => {
  jest.setSystemTime(new Date(date))
  const messages = [message([{ type: 'time', entries: [{ from: '22:00', to: '02:00' }] }])]
  const { result } = renderHook(() => useValidMessages(messages, times, 'Clear'))
  expect(result.current).toHaveLength(1)
})

it('excludes a midnight-spanning notice during daytime', () => {
  const messages = [message([{ type: 'time', entries: [{ from: '22:00', to: '02:00' }] }])]
  const { result } = renderHook(() => useValidMessages(messages, times, 'Clear'))
  expect(result.current).toHaveLength(0)
})

it('updates day conditions at midnight', () => {
  jest.setSystemTime(new Date('2026-09-09T23:59:59'))
  const messages = [message([{ type: 'day', entries: ['Thursday'] }])]
  const { result } = renderHook(() => useValidMessages(messages, times, 'Clear'))
  expect(result.current).toHaveLength(0)
  advance(1_000)
  expect(result.current).toHaveLength(1)
})

it('updates prayer-relative notices when their window arrives', () => {
  jest.setSystemTime(new Date('2026-09-09T12:49:59'))
  const messages = [message([{ type: 'prayer', entries: [{ name: 'Dhuhr', when: 'before', duration: 10 }] }])]
  const { result } = renderHook(() => useValidMessages(messages, times, 'Clear'))
  expect(result.current).toHaveLength(0)
  advance(1_000)
  expect(result.current).toHaveLength(1)
  advance(11 * 60_000)
  expect(result.current).toHaveLength(0)
})

it('refreshes immediately on resume and removes its timer and listeners on unmount', () => {
  const messages = [message([{ type: 'time', entries: [{ from: '11:00', to: '12:00' }] }])]
  const { result, unmount } = renderHook(() => useValidMessages(messages, times, 'Clear'))
  jest.setSystemTime(new Date('2026-09-09T11:30:00'))
  act(() => { window.dispatchEvent(new Event('focus')) })
  expect(result.current).toHaveLength(1)
  expect(jest.getTimerCount()).toBe(1)
  unmount()
  act(() => { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')) })
  expect(jest.getTimerCount()).toBe(0)
})
