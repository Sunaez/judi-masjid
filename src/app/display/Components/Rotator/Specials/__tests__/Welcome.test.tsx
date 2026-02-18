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
  it('shows Ramadan Mubarak in first 10 days mode', () => {
    render(<Welcome displayDuration={20000} showRamadanGreeting />)
    expect(screen.getByText(/Ramadan Mubarak/i)).toBeInTheDocument()
  })

  it('hides Ramadan line when not in first 10 days mode', () => {
    render(<Welcome displayDuration={20000} showRamadanGreeting={false} />)
    expect(screen.queryByText(/Ramadan Mubarak/i)).not.toBeInTheDocument()
  })
})
