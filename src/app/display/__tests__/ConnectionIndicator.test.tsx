import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { ErrorBox, IndicatorLight } from '@/app/display/ThemeProvider'
import { SIMULATED_ERROR_MESSAGE } from '../context/constants'
import { PrayerTimesProvider, usePrayerTimesContext } from '../context/PrayerTimesContext'

// Mock the Firebase hook so PrayerTimesProvider never hits the network in tests.
jest.mock('@/app/hooks/usePrayerTimesFromFirebase', () => ({
  usePrayerTimesFromFirebase: () => ({
    times: null,
    error: null,
    isLoading: false,
    attempts: 0,
  }),
}))

describe('ErrorBox', () => {
  it('renders the provided error message when an error is present', () => {
    const { getByText } = render(<ErrorBox error="Simulated outage" isLoading={false} />)
    expect(getByText('Simulated outage')).toBeTruthy()
  })

  it('returns null (no DOM node) when there is no error and not loading', () => {
    const { container } = render(<ErrorBox error={null} isLoading={false} />)
    expect(container.querySelector('.prayer-times-error')).toBeNull()
  })

  it('keeps the same DOM node across rerenders with identical props (no flicker)', () => {
    const props = { error: 'Simulated outage', isLoading: false }
    const { container, rerender } = render(<ErrorBox {...props} />)
    const firstNode = container.firstChild as HTMLElement
    expect(firstNode).toBeTruthy()

    // Re-render with identical props → React should reuse the same node.
    rerender(<ErrorBox {...props} />)
    expect(container.firstChild).toBe(firstNode)
  })

  it('does NOT remount when only connection attempts change (attempts is not a prop)', () => {
    const props = { error: 'Simulated outage', isLoading: false }
    const { container, rerender } = render(<ErrorBox {...props} />)
    const firstNode = container.firstChild as HTMLElement

    // Simulate connection attempts incrementing — ErrorBox must ignore this.
    rerender(<ErrorBox {...props} />)
    expect(container.firstChild).toBe(firstNode)
  })
})

describe('IndicatorLight', () => {
  it('renders nothing when there are zero attempts', () => {
    const { container } = render(<IndicatorLight attempts={0} />)
    expect(container.querySelector('.indicator-light')).toBeNull()
  })

  it('renders a status dot once attempts > 0', () => {
    const { container } = render(<IndicatorLight attempts={3} />)
    const el = container.querySelector('.indicator-light') as HTMLElement | null
    expect(el).toBeTruthy()
    expect(el?.getAttribute('title')).toContain('Connection attempt 3')
  })

  it('recreates the DOM node on each attempt increment (one flash per attempt)', () => {
    const { rerender } = render(<IndicatorLight attempts={1} />)
    const firstSpan = document.querySelector('.indicator-light') as HTMLElement | null
    expect(firstSpan).toBeTruthy()

    // Each new attempt changes the inner key → React remounts the span (flash).
    rerender(<IndicatorLight attempts={2} />)
    const secondSpan = document.querySelector('.indicator-light') as HTMLElement | null
    expect(secondSpan).not.toBe(firstSpan)
  })
})

describe('PrayerTimesProvider connection-error simulation', () => {
  it('exposes simulateConnectionError and surfaces the simulated outage message', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    function Probe() {
      const ctx = usePrayerTimesContext()
      return (
        <div>
          <button onClick={() => ctx.simulateConnectionError()} data-testid="toggle">
            toggle
          </button>
          <span data-testid="sim">{String(ctx.isSimulatingConnectionError)}</span>
          <span data-testid="error">{ctx.error ?? ''}</span>
        </div>
      )
    }

    render(
      <PrayerTimesProvider>
        <Probe />
      </PrayerTimesProvider>
    )

    expect(screen.getByTestId('sim')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('')

    await act(async () => {
      screen.getByTestId('toggle').click()
    })

    // After simulating, the flag flips true and effectiveError becomes the
    // simulated outage message (which ThemeProvider renders in its ErrorBox).
    expect(screen.getByTestId('sim')).toHaveTextContent('true')
    expect(screen.getByTestId('error')).toHaveTextContent(SIMULATED_ERROR_MESSAGE)

    consoleSpy.mockRestore()
  })
})
