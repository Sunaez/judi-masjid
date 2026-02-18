import React from 'react'
import { render, screen } from '@testing-library/react'
import PostPrayerTableOverlay from '../PostPrayerTableOverlay'

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
let mockPostPrayerTableTestSignal = 0
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
    postPrayerTableTestSignal: mockPostPrayerTableTestSignal,
    ramadanPreviewActive: mockRamadanPreviewActive,
  }),
}))

jest.mock('gsap', () => ({
  gsap: {
    context: (cb: () => void) => {
      cb()
      return { revert: jest.fn() }
    },
    fromTo: jest.fn(),
  },
}))

describe('PostPrayerTableOverlay', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockIsRamadan = false
    mockPostPrayerTableTestSignal = 0
    mockRamadanPreviewActive = false
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('does not render outside 5-minute post-prayer windows', () => {
    jest.setSystemTime(new Date('2026-02-18T14:00:00'))
    render(<PostPrayerTableOverlay />)

    expect(screen.queryByTestId('post-prayer-table-overlay')).not.toBeInTheDocument()
  })

  it('renders table for 5 minutes after a prayer', () => {
    jest.setSystemTime(new Date('2026-02-18T13:03:00'))
    render(<PostPrayerTableOverlay />)

    expect(screen.getByTestId('post-prayer-table-overlay')).toBeInTheDocument()
    expect(screen.getByText('Dhuhr Jamaat Completed')).toBeInTheDocument()
    expect(screen.queryByText('Taraweh')).not.toBeInTheDocument()
  })

  it('includes taraweh row during Ramadan', () => {
    mockIsRamadan = true
    jest.setSystemTime(new Date('2026-02-18T21:33:00'))
    render(<PostPrayerTableOverlay />)

    expect(screen.getByTestId('post-prayer-table-overlay')).toBeInTheDocument()
    expect(screen.getByText('Taraweh Jamaat Completed')).toBeInTheDocument()
    expect(screen.getByText('Start Time')).toBeInTheDocument()
    expect(screen.getByText('Jamaat Time')).toBeInTheDocument()
    expect(screen.getByText('Taraweh')).toBeInTheDocument()
    expect(screen.getAllByText('21:30').length).toBeGreaterThanOrEqual(2)
  })

  it('shows short preview mode when keybind test signal is triggered', () => {
    jest.setSystemTime(new Date('2026-02-18T14:00:00'))
    mockPostPrayerTableTestSignal = 1
    render(<PostPrayerTableOverlay />)

    expect(screen.getByTestId('post-prayer-table-overlay')).toBeInTheDocument()
    expect(screen.getByText('Post-Prayer Table Preview')).toBeInTheDocument()
  })
})
