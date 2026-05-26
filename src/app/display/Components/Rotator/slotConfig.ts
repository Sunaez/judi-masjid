export type RotatorSlotKey =
  | 'welcome'
  | 'eid-prayer'
  | 'prayer-table'
  | 'taraweh'
  | 'message'
  | 'date-time-weather'
  | 'weather-message'
  | 'donation'
  | 'feedback'

export function getRotatorSlotOrder(
  isRamadan: boolean,
  showEidAlAdhaPrayer: boolean = false
): RotatorSlotKey[] {
  const slots: RotatorSlotKey[] = [
    'welcome',
    'prayer-table',
  ]

  if (showEidAlAdhaPrayer) {
    slots.splice(1, 0, 'eid-prayer')
  }

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
