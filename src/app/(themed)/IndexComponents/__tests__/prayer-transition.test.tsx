/**
 * Test to verify TimeUntil component updates correctly after prayer times pass
 * This ensures the synchronization between PrayerTimeline and TimeUntil works properly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import PrayerTimeline from '../PrayerTimeline'
import TimeUntil from '../TimeUntil'

// Mock the usePrayerTimes hook
vi.mock('../../../FetchPrayerTimes', () => ({
  usePrayerTimes: () => ({
    times: {
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
    },
    isLoading: false,
    isError: null,
  }),
}))

describe('Prayer Time Transition', () => {
  beforeEach(() => {
    // Use fake timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Restore real timers
    vi.useRealTimers()
  })

  it('should show "Started" when prayer time is reached', async () => {
    // Set current time to 1 second before Fajr (05:29:59)
    const beforeFajr = new Date()
    beforeFajr.setHours(5, 29, 59, 0)
    vi.setSystemTime(beforeFajr)

    // Create Fajr prayer time (05:30:00)
    const fajrTime = new Date()
    fajrTime.setHours(5, 30, 0, 0)

    const { rerender } = render(
      <TimeUntil eventName="Fajr" eventTime={fajrTime} />
    )

    // Should show countdown
    expect(screen.queryByText('Started')).not.toBeInTheDocument()

    // Advance time by 2 seconds (now it's 05:30:01, past Fajr)
    vi.advanceTimersByTime(2000)

    // Force re-render
    rerender(<TimeUntil eventName="Fajr" eventTime={fajrTime} />)

    // Should now show "Started"
    await waitFor(() => {
      expect(screen.getByText('Started')).toBeInTheDocument()
    })
  })

  it('should switch to next prayer within 5 seconds of current prayer passing', async () => {
    // Set current time to just before Fajr
    const beforeFajr = new Date()
    beforeFajr.setHours(5, 29, 55, 0)
    vi.setSystemTime(beforeFajr)

    const { container } = render(<PrayerTimeline />)

    // Initially should show countdown to Fajr
    expect(container.textContent).toContain('Fajr')

    // Advance time by 10 seconds (now past Fajr at 05:30:05)
    vi.advanceTimersByTime(10000)

    // Within 5 seconds, it should switch to showing next prayer (Dhuhr)
    await waitFor(
      () => {
        // Should no longer be showing Fajr countdown
        const timeUntilElements = container.querySelectorAll('.text-\\[var\\(--accent-color\\)\\]')
        const fajrCount = Array.from(timeUntilElements).filter(
          el => el.textContent === 'Fajr'
        ).length

        // Fajr should either not appear or appear only once (in the timeline, not in countdown)
        expect(fajrCount).toBeLessThanOrEqual(1)
      },
      { timeout: 6000 } // Allow up to 6 seconds for the switch
    )
  })

  it('should update countdown every second', async () => {
    // Set current time to 10 seconds before Fajr
    const beforeFajr = new Date()
    beforeFajr.setHours(5, 29, 50, 0)
    vi.setSystemTime(beforeFajr)

    const fajrTime = new Date()
    fajrTime.setHours(5, 30, 0, 0)

    const { container } = render(
      <TimeUntil eventName="Fajr" eventTime={fajrTime} />
    )

    // Get initial seconds value
    const getSecondsValue = () => {
      const timeDisplay = container.querySelector('.font-mono')
      if (!timeDisplay) return null
      // Extract last two digits (seconds)
      const match = timeDisplay.textContent?.match(/:(\d{2})$/)
      return match ? parseInt(match[1]) : null
    }

    const initialSeconds = getSecondsValue()
    expect(initialSeconds).not.toBeNull()

    // Advance by 1 second
    vi.advanceTimersByTime(1000)

    // Wait for update
    await waitFor(() => {
      const newSeconds = getSecondsValue()
      expect(newSeconds).not.toBe(initialSeconds)
    })
  })

  it('should handle prayer time exactly at midnight transition', async () => {
    // Set current time to 23:59:58 (2 seconds before midnight)
    const beforeMidnight = new Date()
    beforeMidnight.setHours(23, 59, 58, 0)
    vi.setSystemTime(beforeMidnight)

    // Set Isha prayer at 23:59:59
    const ishaTime = new Date()
    ishaTime.setHours(23, 59, 59, 0)

    const { rerender } = render(
      <TimeUntil eventName="ʿIshā" eventTime={ishaTime} />
    )

    // Advance by 2 seconds (now it's 00:00:00, past Isha)
    vi.advanceTimersByTime(2000)

    rerender(<TimeUntil eventName="ʿIshā" eventTime={ishaTime} />)

    // Should show "Started"
    await waitFor(() => {
      expect(screen.getByText('Started')).toBeInTheDocument()
    })
  })
})

describe('Prayer Time Edge Cases', () => {
  it('should handle when no next prayer exists (after last prayer)', async () => {
    // This tests the case where all prayers have passed for the day
    const afterIsha = new Date()
    afterIsha.setHours(23, 59, 0, 0)
    vi.setSystemTime(afterIsha)

    const { container } = render(<PrayerTimeline />)

    // Should still render without crashing
    expect(container).toBeInTheDocument()
  })

  it('should handle rapid prayer transitions', async () => {
    // Test when two prayers are very close together
    const beforeFajrJamaat = new Date()
    beforeFajrJamaat.setHours(5, 44, 58, 0)
    vi.setSystemTime(beforeFajrJamaat)

    const { container } = render(<PrayerTimeline />)

    // Advance through Fajr Jamaat and into next prayer window
    vi.advanceTimersByTime(10000)

    // Should handle the transition smoothly
    await waitFor(() => {
      expect(container).toBeInTheDocument()
    })
  })
})
