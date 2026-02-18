import {
  getIslamicDateParts,
  isRamadanDate,
  isRamadanPeriod,
  isFirstTenDaysOfRamadan,
  isLastTenDaysOfRamadan,
} from '../islamicDate'

function mockIslamicDateParts(
  resolveParts: (date: Date) => { day: number; month: number; year: number }
) {
  jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => {
    return {
      formatToParts: (date: Date) => {
        const { day, month, year } = resolveParts(date)
        return [
          { type: 'day', value: String(day) },
          { type: 'literal', value: '/' },
          { type: 'month', value: String(month) },
          { type: 'literal', value: '/' },
          { type: 'year', value: String(year) },
        ]
      },
    } as unknown as Intl.DateTimeFormat
  }) as unknown as typeof Intl.DateTimeFormat)
}

describe('islamicDate utilities', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('parses islamic date parts from formatter output', () => {
    mockIslamicDateParts(() => ({ day: 5, month: 9, year: 1447 }))

    expect(getIslamicDateParts(new Date('2026-02-18T12:00:00'))).toEqual({
      day: 5,
      month: 9,
      year: 1447,
    })
  })

  it('returns null when required islamic parts are missing', () => {
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => {
      return {
        formatToParts: () => [{ type: 'month', value: '9' }],
      } as unknown as Intl.DateTimeFormat
    }) as unknown as typeof Intl.DateTimeFormat)

    expect(getIslamicDateParts(new Date())).toBeNull()
  })

  it('detects ramadan dates', () => {
    mockIslamicDateParts(() => ({ day: 12, month: 9, year: 1447 }))

    expect(isRamadanDate(new Date('2026-02-18T12:00:00'))).toBe(true)
  })

  it('detects ramadan period when adjacent day is in ramadan', () => {
    mockIslamicDateParts((date: Date) => {
      if (date.getDate() === 9) return { day: 29, month: 9, year: 1446 }
      if (date.getDate() === 10) return { day: 30, month: 8, year: 1446 }
      return { day: 1, month: 10, year: 1446 }
    })

    expect(isRamadanPeriod(new Date(2026, 0, 10, 12, 0, 0))).toBe(true)
  })

  it('detects first 10 days of ramadan correctly', () => {
    mockIslamicDateParts((date: Date) => {
      if (date.getDate() === 1) return { day: 10, month: 9, year: 1447 }
      return { day: 11, month: 9, year: 1447 }
    })

    expect(isFirstTenDaysOfRamadan(new Date(2026, 1, 1))).toBe(true)
    expect(isFirstTenDaysOfRamadan(new Date(2026, 1, 2))).toBe(false)
  })

  it('detects last 10 days of ramadan correctly', () => {
    mockIslamicDateParts((date: Date) => {
      if (date.getDate() === 1) return { day: 20, month: 9, year: 1447 }
      if (date.getDate() === 2) return { day: 21, month: 9, year: 1447 }
      return { day: 5, month: 10, year: 1447 }
    })

    expect(isLastTenDaysOfRamadan(new Date(2026, 1, 1))).toBe(false)
    expect(isLastTenDaysOfRamadan(new Date(2026, 1, 2))).toBe(true)
    expect(isLastTenDaysOfRamadan(new Date(2026, 1, 3))).toBe(false)
  })
})
