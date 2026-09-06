import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Display from '../MessageList/Display'
import type { MessageRecord } from '../MessageList'

beforeAll(() => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true })
})

const messages = [
  { id: 'notice-123456', data: { sourceType: 'other', other: { englishText: 'Community gathering after Isha' } }, createdAt: { toDate: () => new Date('2026-09-06T12:00:00Z') }, conditionsData: [{ type: 'normal' }] },
  { id: 'notice-654321', data: { sourceType: 'other', other: { englishText: 'Friday reminder' } }, createdAt: { toDate: () => new Date('2026-09-06T12:00:00Z') }, conditionsData: [{ type: 'day', entries: ['Friday'] }] },
] as MessageRecord[]

it('filters messages and exposes the selected filter to assistive technology', async () => {
  const user = userEvent.setup()
  render(<Display messages={messages} loading={false} error={null} onDeleteClick={jest.fn()} onAddAnimation={jest.fn()} />)
  await user.click(screen.getByRole('button', { name: 'Day (1)' }))
  expect(screen.getByRole('button', { name: 'Day (1)' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByText('Friday reminder')).toBeInTheDocument()
  expect(screen.queryByText('Community gathering after Isha')).not.toBeInTheDocument()
})

it('routes message actions to the correct message and closes the action menu with Escape', async () => {
  const user = userEvent.setup()
  const onDelete = jest.fn()
  const onAnimation = jest.fn()
  render(<Display messages={messages} loading={false} error={null} onDeleteClick={onDelete} onAddAnimation={onAnimation} />)
  const trigger = screen.getByRole('button', { name: 'Actions for message 123456' })
  await user.click(trigger)
  await user.click(screen.getByRole('button', { name: 'Add Animation' }))
  expect(onAnimation).toHaveBeenCalledWith(messages[0])
  await user.click(trigger)
  await user.tab()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('button', { name: 'Delete Message' })).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
  await user.click(trigger)
  await user.click(screen.getByRole('button', { name: 'Delete Message' }))
  expect(onDelete).toHaveBeenCalledWith('notice-123456')
})
