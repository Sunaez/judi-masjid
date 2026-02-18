import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import PrayerTimeline from '../PrayerTimeline'
import TimeUntil from '../TimeUntil'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}))

const mockPrayerTimes = {
  fajrStart: '05:30',
  fajrJamaat: '05:45',
  sunrise: '06:30',
  dhuhrStart: '12:30',
  dhuhrJamaat: '12:45',
  asrStart: '15:30',
  asrJamaat: '15:45',
  maghrib: '18:00',
  ishaStart: '19:30',
  ishaJamaat: '19:45',
}

jest.mock('../../../display/context/PrayerTimesContext', () => ({
  usePrayerTimesContext: () => ({
    prayerTimes: mockPrayerTimes,
    isLoading: false,
    error: null,
    currentMinutes: 0,
    isDowntime: false,
    isRamadan: false,
    isRamadanPeriod: false,
    isFirstTenRamadanDays: false,
    isLastTenRamadanDays: false,
  }),
}))

describe('Prayer transition behavior', () => {
  const originalScrollTo = Element.prototype.scrollTo

  beforeEach(() => {
    jest.useFakeTimers()
    Element.prototype.scrollTo = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
    Element.prototype.scrollTo = originalScrollTo
  })

  it('shows "Started" when a provided event time has passed', async () => {
    const beforeFajr = new Date()
    beforeFajr.setHours(5, 29, 59, 0)
    jest.setSystemTime(beforeFajr)

    const fajrTime = new Date()
    fajrTime.setHours(5, 30, 0, 0)

    const { rerender } = render(<TimeUntil eventName="Fajr" eventTime={fajrTime} />)
    expect(screen.queryByText('Started')).not.toBeInTheDocument()

    await act(async () => {
      jest.advanceTimersByTime(2000)
    })
    rerender(<TimeUntil eventName="Fajr" eventTime={fajrTime} />)

    await waitFor(() => {
      expect(screen.getByText('Started')).toBeInTheDocument()
    })
  })

  it('renders prayer timeline with upcoming events and remains stable over time', async () => {
    const beforeFajr = new Date()
    beforeFajr.setHours(5, 29, 55, 0)
    jest.setSystemTime(beforeFajr)

    const { container } = render(<PrayerTimeline />)
    expect(container.textContent).toContain('Fajr')

    await act(async () => {
      jest.advanceTimersByTime(10_000)
    })

    await waitFor(() => {
      expect(container).toBeInTheDocument()
    })
  })
})
