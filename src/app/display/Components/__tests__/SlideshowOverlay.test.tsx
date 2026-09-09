import React from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import SlideshowOverlay from '../SlideshowOverlay'
import { saveSlideIndex } from '@/lib/firebase/slideshowSettings'

jest.mock('@/lib/firebase/slideshowSettings', () => ({
  saveSlideIndex: jest.fn(() => Promise.resolve()),
  subscribeSlideIndex: jest.fn(onChange => { onChange(0); return jest.fn() }),
}))

const response = (images: unknown = ['/one.jpg', '/two.jpg']) => ({
  ok: true, json: async () => ({ images }),
}) as Response
const flush = async () => { await act(async () => {}) }
const advance = async (ms: number) => { await act(async () => { await jest.advanceTimersByTimeAsync(ms) }) }
let fetchMock: jest.SpyInstance

beforeEach(() => {
  jest.useFakeTimers()
  fetchMock = jest.spyOn(globalThis, 'fetch').mockReset().mockResolvedValue(response())
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.mocked(saveSlideIndex).mockClear()
})

afterEach(() => {
  cleanup()
  jest.clearAllTimers()
  jest.useRealTimers()
  jest.restoreAllMocks()
})

it('recovers from a temporary image-list failure without remounting', async () => {
  fetchMock.mockRejectedValueOnce(new Error('offline'))
  const { container } = render(<SlideshowOverlay />)
  await flush()
  expect(screen.getByText('Unable to load slides. Retrying...')).toBeInTheDocument()
  expect(screen.queryByText('No SlideShow images found')).not.toBeInTheDocument()
  await advance(5_000)
  expect(container.querySelector('img')).toHaveAttribute('src', '/one.jpg')
  expect(screen.queryByText('Unable to load slides. Retrying...')).not.toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('distinguishes a successful empty folder from a failed request', async () => {
  fetchMock.mockResolvedValue(response([]))
  render(<SlideshowOverlay />)
  await flush()
  expect(screen.getByText('No SlideShow images found')).toBeInTheDocument()
  await advance(60_000)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(console.error).not.toHaveBeenCalled()
})

it.each([null, {}, { images: 'invalid' }, { images: ['/one.jpg', 123] }])('retries malformed response %j rather than reporting an empty folder', async data => {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => data } as Response)
  const { container } = render(<SlideshowOverlay />)
  await flush()
  expect(screen.getByText('Unable to load slides. Retrying...')).toBeInTheDocument()
  await advance(5_000)
  expect(container.querySelector('img')).toHaveAttribute('src', '/one.jpg')
})

it('retries HTTP failures with increasing delays capped at one minute', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response)
  render(<SlideshowOverlay />)
  await flush()
  let calls = 1
  for (const delay of [5_000, 10_000, 20_000, 40_000, 60_000, 60_000]) {
    await advance(delay - 1)
    expect(fetchMock).toHaveBeenCalledTimes(calls)
    await advance(1)
    expect(fetchMock).toHaveBeenCalledTimes(++calls)
  }
})

it('retains loaded slides during a refresh outage and resets retry delay after success', async () => {
  fetchMock.mockRejectedValueOnce(new Error('offline'))
  const { container } = render(<SlideshowOverlay />)
  await flush()
  await advance(5_000)
  expect(container.querySelector('img')).not.toBeNull()
  fetchMock.mockRejectedValueOnce(new Error('offline again'))
  await advance(5 * 60_000)
  expect(fetchMock).toHaveBeenCalledTimes(3)
  expect(container.querySelector('img')).not.toBeNull()
  expect(screen.queryByText('Unable to load slides. Retrying...')).not.toBeInTheDocument()
  await advance(5_000)
  expect(fetchMock).toHaveBeenCalledTimes(4)
  expect(container.querySelector('img')).not.toBeNull()
})

it('aborts a hanging request before retrying with a fresh signal and no overlap', async () => {
  let active = 0
  let maxActive = 0
  const signals: AbortSignal[] = []
  fetchMock.mockImplementation((_url: string, init: RequestInit) => {
    active++
    maxActive = Math.max(maxActive, active)
    const signal = init.signal!
    signals.push(signal)
    return new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        active--
        reject(new DOMException('Aborted', 'AbortError'))
      }, { once: true })
    })
  })
  const { unmount } = render(<SlideshowOverlay />)
  await advance(14_999)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(signals[0].aborted).toBe(false)
  await advance(1)
  expect(signals[0].aborted).toBe(true)
  expect(screen.getByText('Unable to load slides. Retrying...')).toBeInTheDocument()
  await advance(5_000)
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(signals[1]).not.toBe(signals[0])
  expect(signals[1].aborted).toBe(false)
  expect(maxActive).toBe(1)
  unmount()
  await advance(0)
  expect(signals[1].aborted).toBe(true)
  expect(active).toBe(0)
  expect(jest.getTimerCount()).toBe(0)
})

it('does not allow a late response after unmount to recreate a retry timer', async () => {
  let resolve!: (value: Response) => void
  fetchMock.mockReturnValueOnce(new Promise<Response>(res => { resolve = res }))
  const { unmount } = render(<SlideshowOverlay />)
  const signal = fetchMock.mock.calls[0][1].signal as AbortSignal
  unmount()
  expect(signal.aborted).toBe(true)
  await act(async () => { resolve(response()) })
  await advance(10 * 60_000)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(jest.getTimerCount()).toBe(0)
  expect(console.error).not.toHaveBeenCalled()
})

it('cancels a scheduled retry when the slideshow closes', async () => {
  fetchMock.mockRejectedValueOnce(new Error('offline'))
  const { unmount } = render(<SlideshowOverlay />)
  await flush()
  unmount()
  await advance(10 * 60_000)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(jest.getTimerCount()).toBe(0)
})

it('still auto-advances, pauses in manual mode, and resumes after holding for five seconds', async () => {
  const { container } = render(<SlideshowOverlay />)
  await flush()
  expect(container.querySelector('img')).toHaveAttribute('src', '/one.jpg')
  await advance(40_000)
  expect(container.querySelector('img')).toHaveAttribute('src', '/two.jpg')
  const slideshow = screen.getByRole('presentation')
  fireEvent.mouseDown(slideshow, { button: 0 })
  fireEvent.mouseUp(slideshow, { button: 0 })
  await advance(80_000)
  expect(container.querySelector('img')).toHaveAttribute('src', '/two.jpg')
  expect(screen.getByText('Manual')).toBeInTheDocument()
  fireEvent.mouseDown(slideshow, { button: 0 })
  await advance(5_000)
  fireEvent.mouseUp(slideshow, { button: 0 })
  await advance(40_000)
  expect(container.querySelector('img')).toHaveAttribute('src', '/one.jpg')
  expect(screen.queryByText('Manual')).not.toBeInTheDocument()
})
