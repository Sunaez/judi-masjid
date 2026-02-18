import React from 'react'
import { render, screen } from '@testing-library/react'
import { PrayerTimesProvider, usePrayerTimesContext } from '../PrayerTimesContext'

const mockTimes = {
  fajrStart: '05:00',
  fajrJamaat: '05:30',
  sunrise: '06:45',
  dhuhrStart: '12:15',
  dhuhrJamaat: '13:00',
  asrStart: '15:30',
  asrJamaat: '16:15',
  maghrib: '18:20',
  ishaStart: '20:00',
  ishaJamaat: '21:00',
}

let mockIsRamadan = false
let mockIsRamadanPeriod = false
let mockIsFirstTen = false
let mockIsLastTen = false

jest.mock('@/app/hooks/usePrayerTimesFromFirebase', () => ({
  usePrayerTimesFromFirebase: () => ({
    times: mockTimes,
    error: null,
    isLoading: false,
  }),
}))

jest.mock('@/lib/islamicDate', () => ({
  isRamadanDate: () => mockIsRamadan,
  isRamadanPeriod: () => mockIsRamadanPeriod,
  isFirstTenDaysOfRamadan: () => mockIsFirstTen,
  isLastTenDaysOfRamadan: () => mockIsLastTen,
}))

function ContextProbe() {
  const {
    isRamadan,
    isRamadanPeriod,
    isFirstTenRamadanDays,
    isLastTenRamadanDays,
    isDowntime,
  } = usePrayerTimesContext()

  return (
    <div>
      <div data-testid="is-ramadan">{String(isRamadan)}</div>
      <div data-testid="is-ramadan-period">{String(isRamadanPeriod)}</div>
      <div data-testid="is-first-ten">{String(isFirstTenRamadanDays)}</div>
      <div data-testid="is-last-ten">{String(isLastTenRamadanDays)}</div>
      <div data-testid="is-downtime">{String(isDowntime)}</div>
    </div>
  )
}

describe('PrayerTimesContext Ramadan flags', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2026, 1, 18, 22, 30, 0))
    mockIsRamadan = false
    mockIsRamadanPeriod = false
    mockIsFirstTen = false
    mockIsLastTen = false
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('exposes Ramadan flags from shared helpers', () => {
    mockIsRamadan = true
    mockIsRamadanPeriod = true
    mockIsFirstTen = true
    mockIsLastTen = false

    render(
      <PrayerTimesProvider>
        <ContextProbe />
      </PrayerTimesProvider>
    )

    expect(screen.getByTestId('is-ramadan')).toHaveTextContent('true')
    expect(screen.getByTestId('is-ramadan-period')).toHaveTextContent('true')
    expect(screen.getByTestId('is-first-ten')).toHaveTextContent('true')
    expect(screen.getByTestId('is-last-ten')).toHaveTextContent('false')
  })

  it('uses Ramadan-period downtime extension (3h after Isha)', () => {
    mockIsRamadanPeriod = false
    const { unmount } = render(
      <PrayerTimesProvider>
        <ContextProbe />
      </PrayerTimesProvider>
    )

    // Non-Ramadan period: downtime starts 1h after Isha -> true at 22:30
    expect(screen.getByTestId('is-downtime')).toHaveTextContent('true')

    unmount()
    mockIsRamadanPeriod = true
    render(
      <PrayerTimesProvider>
        <ContextProbe />
      </PrayerTimesProvider>
    )

    // Ramadan period: downtime starts 3h after Isha -> false at 22:30
    expect(screen.getByTestId('is-downtime')).toHaveTextContent('false')
  })

  it('exposes last-10-days Ramadan flag', () => {
    mockIsRamadan = true
    mockIsRamadanPeriod = true
    mockIsFirstTen = false
    mockIsLastTen = true

    render(
      <PrayerTimesProvider>
        <ContextProbe />
      </PrayerTimesProvider>
    )

    expect(screen.getByTestId('is-last-ten')).toHaveTextContent('true')
  })
})
