import React from 'react'
import { render, screen } from '@testing-library/react'
import PrayerTimeTable from '../PrayerTimeTable'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}))

jest.mock('motion/react', () => {
  const React = require('react')
  return {
    motion: new Proxy(
      {},
      {
        get: (_target, tag) =>
          ({ children, ...props }: any) => React.createElement(tag as string, props, children),
      }
    ),
  }
})

const basePrayerTimes = {
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

jest.mock('../../../display/context/PrayerTimesContext', () => ({
  usePrayerTimesContext: () => ({
    prayerTimes: basePrayerTimes,
    isLoading: false,
    error: null,
    isRamadan: mockIsRamadan,
    isRamadanPeriod: mockIsRamadan,
    isFirstTenRamadanDays: false,
    isLastTenRamadanDays: false,
    currentMinutes: 720,
    isDowntime: false,
  }),
}))

describe('PrayerTimeTable', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-02-18T12:00:00'))
    mockIsRamadan = false
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('uses month-based timetable naming outside Ramadan', () => {
    render(<PrayerTimeTable />)

    const downloadLink = screen.getByText(/Download February 2026 Timetable/i).closest('a')
    expect(downloadLink).toHaveAttribute('href', '/Timetables/02-2026.jpg')
    expect(screen.queryByText('Ramadan Mubarak')).not.toBeInTheDocument()
  })

  it('shows Ramadan banner, direct download, and full-view image during Ramadan', () => {
    mockIsRamadan = true
    render(<PrayerTimeTable />)

    expect(screen.getByText('Ramadan Mubarak')).toBeInTheDocument()

    const downloadLink = screen.getByText(/Download Ramadan 2026 Timetable/i).closest('a')
    expect(downloadLink).toHaveAttribute('href', '/Timetables/R-2026.jpg')

    const fullViewLink = screen.getByText(/Full View Ramadan Timetable/i).closest('a')
    expect(fullViewLink).toHaveAttribute('href', '/Timetables/R-2026.jpg')

    const timetableImage = screen.getByAltText('Ramadan 2026 timetable')
    expect(timetableImage).toHaveAttribute('src', '/Timetables/R-2026.jpg')
  })
})
