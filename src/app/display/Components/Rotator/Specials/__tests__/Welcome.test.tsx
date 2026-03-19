import React from 'react'
import { render, screen } from '@testing-library/react'
import Welcome from '../Welcome'

jest.mock('gsap', () => ({
  gsap: {
    context: (cb: () => void) => {
      cb()
      return { revert: jest.fn() }
    },
    timeline: () => ({
      from: jest.fn().mockReturnThis(),
      fromTo: jest.fn().mockReturnThis(),
      to: jest.fn().mockReturnThis(),
    }),
  },
}))

describe('Display Welcome special', () => {
  it('shows the provided festive greeting', () => {
    render(<Welcome displayDuration={20000} greetingText="Eid Mubarak" />)
    expect(screen.getByText(/Eid Mubarak/i)).toBeInTheDocument()
  })

  it('hides the festive line when no greeting is provided', () => {
    render(<Welcome displayDuration={20000} />)
    expect(screen.queryByText(/Eid Mubarak/i)).not.toBeInTheDocument()
  })
})
