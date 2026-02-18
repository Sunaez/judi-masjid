export type RotatorSlotKey =
  | 'welcome'
  | 'prayer-table'
  | 'taraweh'
  | 'message'
  | 'date-time-weather'
  | 'weather-message'
  | 'donation'
  | 'feedback'

export function getRotatorSlotOrder(isRamadan: boolean): RotatorSlotKey[] {
  const slots: RotatorSlotKey[] = [
    'welcome',
    'prayer-table',
  ]

  if (isRamadan) {
    slots.push('taraweh')
  }

  slots.push(
    'message',
    'date-time-weather',
    'weather-message',
    'donation',
    'feedback'
  )

  return slots
}
