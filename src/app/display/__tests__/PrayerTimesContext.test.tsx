import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { PrayerTimesProvider, usePrayerTimesContext } from '../context/PrayerTimesContext'

// Mock the fetchPrayerTimes function
jest.mock('@/app/FetchPrayerTimes', () => ({
  fetchPrayerTimes: jest.fn(() =>
    Promise.resolve({
      fajrStart: '05:30',
      fajrJamaat: '06:00',
      sunrise: '07:00',
      dhuhrStart: '12:00',
      dhuhrJamaat: '13:00',
      asrStart: '15:00',
      asrJamaat: '16:00',
      maghrib: '18:00',
      ishaStart: '19:00',
      ishaJamaat: '20:00',
    })
  ),
}))

// Test component that uses the context
function TestComponent() {
  const { prayerTimes, isLoading } = usePrayerTimesContext()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div data-testid="fajr">{prayerTimes?.fajrJamaat}</div>
      <div data-testid="dhuhr">{prayerTimes?.dhuhrJamaat}</div>
      <div data-testid="maghrib">{prayerTimes?.maghrib}</div>
    </div>
  )
}

describe('PrayerTimesContext', () => {
  it('provides prayer times to consuming components', async () => {
    render(
      <PrayerTimesProvider>
        <TestComponent />
      </PrayerTimesProvider>
    )

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Wait for prayer times to load
    await waitFor(() => {
      expect(screen.getByTestId('fajr')).toHaveTextContent('06:00')
    })

    expect(screen.getByTestId('dhuhr')).toHaveTextContent('13:00')
    expect(screen.getByTestId('maghrib')).toHaveTextContent('18:00')
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('usePrayerTimesContext must be used within a PrayerTimesProvider')

    consoleSpy.mockRestore()
  })
})
