import React from 'react'
import { render, screen } from '@testing-library/react'
import PrayerTimeline from '../PrayerTimeline'

const mockPrayerTimes = {
  fajrStart: '05:00',
  fajrJamaat: '05:30',
  sunrise: '06:45',
  dhuhrStart: '12:15',
  dhuhrJamaat: '13:00',
  asrStart: '15:30',
  asrJamaat: '16:15',
  maghrib: '18:20',
  ishaStart: '20:00',
  ishaJamaat: '21:10',
}

let mockIsRamadan = false
let mockRamadanPreviewActive = false

jest.mock('../../context/PrayerTimesContext', () => ({
  usePrayerTimesContext: () => ({
    prayerTimes: mockPrayerTimes,
    isLoading: false,
    error: null,
    currentMinutes: 0,
    isDowntime: false,
    isRamadan: mockIsRamadan,
    isRamadanPeriod: mockIsRamadan,
    isFirstTenRamadanDays: false,
    isLastTenRamadanDays: false,
  }),
}))

jest.mock('../../context/DebugContext', () => ({
  useDebugContext: () => ({
    ramadanPreviewActive: mockRamadanPreviewActive,
  }),
}))

describe('Display PrayerTimeline Ramadan extension', () => {
  const originalScrollTo = Element.prototype.scrollTo

  beforeEach(() => {
    Element.prototype.scrollTo = jest.fn()
    jest.useFakeTimers()
    mockIsRamadan = false
    mockRamadanPreviewActive = false
  })

  afterEach(() => {
    Element.prototype.scrollTo = originalScrollTo
    jest.useRealTimers()
  })

  it('shows Taraweh event only during Ramadan', () => {
    mockIsRamadan = true
    render(<PrayerTimeline />)

    expect(screen.getByText('Taraweh')).toBeInTheDocument()
    expect(screen.getByText('21:30')).toBeInTheDocument()
  })

  it('uses short prayer names on the timeline', () => {
    render(<PrayerTimeline />)

    expect(screen.getByText('Fajr')).toBeInTheDocument()
    expect(screen.getByText('Sunrise')).toBeInTheDocument()
    expect(screen.queryByText('Fajr Jamaat')).not.toBeInTheDocument()
    expect(screen.queryByText('Dhuhr Jamaat')).not.toBeInTheDocument()
  })

  it('hides Taraweh event outside Ramadan', () => {
    mockIsRamadan = false
    render(<PrayerTimeline />)

    expect(screen.queryByText('Taraweh')).not.toBeInTheDocument()
  })

  it('shows Taraweh when Ramadan preview mode is enabled via keybind', () => {
    mockRamadanPreviewActive = true
    render(<PrayerTimeline />)

    expect(screen.getByText('Taraweh')).toBeInTheDocument()
  })

  it('adds visible spacing between Isha and Taraweh markers', () => {
    mockIsRamadan = true
    render(<PrayerTimeline />)

    const ishaMarker = screen.getByAltText('Isha').closest('div')?.parentElement as HTMLDivElement
    const tarawehMarker = screen.getByAltText('Taraweh').closest('div')?.parentElement as HTMLDivElement
    const ishaLeft = Number.parseFloat(ishaMarker.style.left)
    const tarawehLeft = Number.parseFloat(tarawehMarker.style.left)

    expect(tarawehLeft - ishaLeft).toBeGreaterThanOrEqual(3)
  })
})
