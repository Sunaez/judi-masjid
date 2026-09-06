import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientDashboard from '../ClientDashboard'
import { subscribeDonationSettings } from '@/lib/firebase/donationSettings'
import { subscribeSlideshowSettings } from '@/lib/firebase/slideshowSettings'

jest.mock('next/navigation', () => ({ usePathname: () => '/admin/dashboard', useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }) }))
jest.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light', setTheme: jest.fn() }) }))
jest.mock('@/lib/firebase', () => ({ auth: {} }))
jest.mock('firebase/auth', () => ({ onIdTokenChanged: (_auth: unknown, callback: Function) => { callback({ email: 'admin@example.com' }); return jest.fn() }, signOut: jest.fn() }))
jest.mock('@/lib/firebase/donationSettings', () => ({
  DEFAULT_DONATION_SETTINGS: { currentAmount: 200000, totalAmount: 500000 },
  subscribeDonationSettings: jest.fn(callback => { callback({ currentAmount: 200000, totalAmount: 500000 }); return jest.fn() }),
  validateDonationSettings: () => null,
  saveDonationSettings: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/firebase/slideshowSettings', () => ({
  DEFAULT_SLIDESHOW_SETTINGS: { active: false, startTime: '09:00', endTime: '18:00' },
  subscribeSlideshowSettings: jest.fn(callback => { callback({ active: false, startTime: '09:00', endTime: '18:00' }); return jest.fn() }),
  normalizeDailyTimeValue: (value: string) => value,
  saveSlideshowSettings: jest.fn().mockResolvedValue(undefined),
  clearSlideshowSettings: jest.fn(),
}))
jest.mock('../DashBoardComponents/MessageList', () => ({
  __esModule: true,
  default: () => {
    const Display = require('../DashBoardComponents/MessageList/Display').default
    return <Display messages={[]} loading={false} error={null} onDeleteClick={jest.fn()} onAddAnimation={jest.fn()} />
  },
}))
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (loader: Function) => {
    const source = loader.toString()
    if (source.includes('ControlSlideshow')) return require('../DashBoardComponents/ControlSlideshow').default
    if (source.includes('DonationSettings')) return require('../DashBoardComponents/DonationSettings').default
    return function ModalContent() { return <input aria-label="Message content" /> }
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
  window.matchMedia = jest.fn(query => ({
    matches: query === '(prefers-reduced-motion: reduce)', media: query, onchange: null,
    addEventListener: jest.fn(), removeEventListener: jest.fn(),
    addListener: jest.fn(), removeListener: jest.fn(), dispatchEvent: jest.fn(),
  }))
})

it('keeps unsaved donation and slideshow inputs when dashboard dialogs open and close', async () => {
  const user = userEvent.setup()
  render(<ClientDashboard />)
  fireEvent.change(screen.getByLabelText('Current donation amount'), { target: { value: '210000' } })
  fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '10:30' } })
  const trigger = screen.getByRole('button', { name: /Add message Share/ })
  await user.click(trigger)
  expect(await screen.findByRole('dialog', { name: 'Add message' })).toBeInTheDocument()
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(screen.getByLabelText('Current donation amount')).toHaveValue(210000)
  expect(screen.getByLabelText('Start time')).toHaveValue('10:30')
  expect(subscribeDonationSettings).toHaveBeenCalledTimes(1)
  expect(subscribeSlideshowSettings).toHaveBeenCalledTimes(1)
  await waitFor(() => expect(trigger).toHaveFocus())
})

it.each([['Sync prayer times', /Sync prayer times Import/], ['Manage timetables', /Manage timetables Upload/]])('opens and dismisses %s', async (title, name) => {
  const user = userEvent.setup()
  render(<ClientDashboard />)
  await user.click(screen.getByRole('button', { name }))
  expect(await screen.findByRole('dialog', { name: title })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: `Close ${title.toLowerCase()}` }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})
