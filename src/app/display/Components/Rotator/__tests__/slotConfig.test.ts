import { getRotatorSlotOrder } from '../slotConfig'

describe('getRotatorSlotOrder', () => {
  it('includes taraweh slide during Ramadan', () => {
    expect(getRotatorSlotOrder(true)).toEqual([
      'welcome',
      'prayer-table',
      'taraweh',
      'message',
      'date-time-weather',
      'weather-message',
      'donation',
      'feedback',
    ])
  })

  it('excludes taraweh slide outside Ramadan', () => {
    expect(getRotatorSlotOrder(false)).toEqual([
      'welcome',
      'prayer-table',
      'message',
      'date-time-weather',
      'weather-message',
      'donation',
      'feedback',
    ])
  })
})
