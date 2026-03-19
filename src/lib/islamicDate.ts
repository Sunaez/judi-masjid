const ISLAMIC_CALENDAR_LOCALE = 'en-u-ca-islamic'
const RAMADAN_MONTH = 9
const SHAWWAL_MONTH = 10

export interface IslamicDateParts {
  day: number
  month: number
  year: number
}

function toPartNumber(value: string): number | null {
  const digitsOnly = value.replace(/[^\d]/g, '')
  if (!digitsOnly) return null

  const parsed = Number.parseInt(digitsOnly, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function getIslamicDateParts(date: Date = new Date()): IslamicDateParts | null {
  const formatter = new Intl.DateTimeFormat(ISLAMIC_CALENDAR_LOCALE, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })

  const parts = formatter.formatToParts(date)

  const day = toPartNumber(parts.find(part => part.type === 'day')?.value ?? '')
  const month = toPartNumber(parts.find(part => part.type === 'month')?.value ?? '')
  const year = toPartNumber(parts.find(part => part.type === 'year')?.value ?? '')

  if (day === null || month === null || year === null) {
    return null
  }

  return { day, month, year }
}

export function isRamadanDate(date: Date = new Date()): boolean {
  return getIslamicDateParts(date)?.month === RAMADAN_MONTH
}

export function isRamadanPeriod(date: Date = new Date()): boolean {
  if (isRamadanDate(date)) return true

  const dayBefore = new Date(date)
  dayBefore.setDate(dayBefore.getDate() - 1)

  const dayAfter = new Date(date)
  dayAfter.setDate(dayAfter.getDate() + 1)

  return isRamadanDate(dayBefore) || isRamadanDate(dayAfter)
}

export function isFirstTenDaysOfRamadan(date: Date = new Date()): boolean {
  const hijriDate = getIslamicDateParts(date)
  if (!hijriDate) return false

  return hijriDate.month === RAMADAN_MONTH && hijriDate.day >= 1 && hijriDate.day <= 10
}

export function isLastTenDaysOfRamadan(date: Date = new Date()): boolean {
  const hijriDate = getIslamicDateParts(date)
  if (!hijriDate) return false

  // Ramadan month can be 29 or 30 days; "last 10" always starts from 21.
  return hijriDate.month === RAMADAN_MONTH && hijriDate.day >= 21
}

export function isEidAlFitrDate(date: Date = new Date()): boolean {
  const hijriDate = getIslamicDateParts(date)
  if (!hijriDate) return false

  return hijriDate.month === SHAWWAL_MONTH && hijriDate.day >= 1 && hijriDate.day <= 3
}
