import { getRotatorSlotOrder } from '../slotConfig'

describe('getRotatorSlotOrder', () => {
  it('includes taraweh slide during Ramadan', () => {
    expect(getRotatorSlotOrder(true, false)).toEqual([
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
    expect(getRotatorSlotOrder(false, false)).toEqual([
      'welcome',
      'prayer-table',
      'message',
      'date-time-weather',
      'weather-message',
      'donation',
      'feedback',
    ])
  })

  it('includes Eid al-Adha prayer slide when active', () => {
    expect(getRotatorSlotOrder(false, true)).toEqual([
      'welcome',
      'eid-prayer',
      'prayer-table',
      'message',
      'date-time-weather',
      'weather-message',
      'donation',
      'feedback',
    ])
  })
})
