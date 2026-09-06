import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PrayerTimesEditor from '../page'
import { batchSavePrayerTimes, getPrayerTimesByMonth } from '@/lib/firebase/prayerTimes'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
jest.mock('../../../AdminComponents/NavBar', () => ({ __esModule: true, default: () => null }))
jest.mock('@/lib/firebase/prayerTimes', () => ({ getPrayerTimesByMonth: jest.fn().mockResolvedValue([]), batchSavePrayerTimes: jest.fn() }))

beforeEach(() => { jest.clearAllMocks(); jest.spyOn(console, 'error').mockImplementation(() => {}) })
afterEach(() => jest.restoreAllMocks())

async function editAndExit() {
  const user = userEvent.setup()
  render(<PrayerTimesEditor />)
  await waitFor(() => expect(getPrayerTimesByMonth).toHaveBeenCalledTimes(12))
  await user.click(screen.getByRole('button', { name: '+ Add Row' }))
  fireEvent.change(screen.getByRole('textbox', { name: /^fajrStart for/ }), { target: { value: '05:30' } })
  expect(screen.getByLabelText('Year:')).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Back' }))
  await user.click(await screen.findByRole('button', { name: 'Save Changes & Exit' }))
}

it('keeps the edited timetable open if Save and Exit fails', async () => {
  jest.mocked(batchSavePrayerTimes).mockRejectedValueOnce(new Error('Unavailable'))
  await editAndExit()
  expect(await screen.findByRole('alert')).toHaveTextContent('Failed to save prayer times')
  expect(mockPush).not.toHaveBeenCalled()
  expect(screen.getByRole('textbox', { name: /^fajrStart for/ })).toHaveValue('05:30')
  expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
})

it('saves the edited value before returning to the dashboard', async () => {
  jest.mocked(batchSavePrayerTimes).mockResolvedValueOnce(undefined)
  await editAndExit()
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/dashboard'))
  expect(batchSavePrayerTimes).toHaveBeenCalledWith([expect.objectContaining({ times: expect.objectContaining({ fajrStart: '05:30' }) })])
})
