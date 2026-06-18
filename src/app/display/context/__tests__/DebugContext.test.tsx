import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { DebugProvider, useDebugContext } from '../DebugContext'

function ContextProbe() {
  const {
    postPrayerTableTestSignal,
    ramadanPreviewActive,
    donationGoalPreviewSignal,
  } = useDebugContext()

  return (
    <div>
      <div data-testid="post-prayer-signal">{postPrayerTableTestSignal}</div>
      <div data-testid="ramadan-preview-active">{String(ramadanPreviewActive)}</div>
      <div data-testid="donation-preview-signal">{donationGoalPreviewSignal}</div>
    </div>
  )
}

describe('DebugContext keybind shortcuts', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('increments post-prayer test signal when pressing key 5', () => {
    render(
      <DebugProvider>
        <ContextProbe />
      </DebugProvider>
    )

    expect(screen.getByTestId('post-prayer-signal')).toHaveTextContent('0')

    fireEvent.keyDown(window, { key: '5' })

    expect(screen.getByTestId('post-prayer-signal')).toHaveTextContent('1')
    expect(screen.getByText('Post-Prayer Table Test')).toBeInTheDocument()
  })

  it('toggles Ramadan preview when pressing key 6', () => {
    render(
      <DebugProvider>
        <ContextProbe />
      </DebugProvider>
    )

    expect(screen.getByTestId('ramadan-preview-active')).toHaveTextContent('false')

    fireEvent.keyDown(window, { key: '6' })
    expect(screen.getByTestId('ramadan-preview-active')).toHaveTextContent('true')

    fireEvent.keyDown(window, { key: '6' })
    expect(screen.getByTestId('ramadan-preview-active')).toHaveTextContent('false')
  })

  it('signals the donation goal slide when pressing key i', () => {
    render(
      <DebugProvider>
        <ContextProbe />
      </DebugProvider>
    )

    expect(screen.getByTestId('donation-preview-signal')).toHaveTextContent('0')

    fireEvent.keyDown(window, { key: 'i' })
    expect(screen.getByTestId('donation-preview-signal')).toHaveTextContent('1')
    expect(screen.getByText('Donation Goal Slide')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'I' })
    expect(screen.getByTestId('donation-preview-signal')).toHaveTextContent('2')
  })

  it('blocks shortcut execution while help modal is open', () => {
    render(
      <DebugProvider>
        <ContextProbe />
      </DebugProvider>
    )

    fireEvent.keyDown(window, { key: 'h' })
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: '5' })
    fireEvent.keyDown(window, { key: '6' })
    fireEvent.keyDown(window, { key: 'i' })

    expect(screen.getByTestId('post-prayer-signal')).toHaveTextContent('0')
    expect(screen.getByTestId('ramadan-preview-active')).toHaveTextContent('false')
    expect(screen.getByTestId('donation-preview-signal')).toHaveTextContent('0')
  })
})
