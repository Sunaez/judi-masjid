import {
  getMsUntilNextThemeBoundary,
  shouldUseLightThemeAt,
  timeStringToMinutes,
} from '../ThemeProvider'

describe('display theme timing', () => {
  const sunrise = 7 * 60
  const maghrib = 18 * 60

  it('parses HH:mm prayer times into minutes after midnight', () => {
    expect(timeStringToMinutes('07:05')).toBe(425)
    expect(timeStringToMinutes('18:00')).toBe(1080)
  })

  it('rejects invalid prayer time strings', () => {
    expect(timeStringToMinutes('24:00')).toBeNull()
    expect(timeStringToMinutes('07:60')).toBeNull()
    expect(timeStringToMinutes('bad')).toBeNull()
  })

  it('uses light mode from sunrise until Maghrib', () => {
    expect(shouldUseLightThemeAt(new Date(2024, 0, 1, 6, 59), sunrise, maghrib)).toBe(false)
    expect(shouldUseLightThemeAt(new Date(2024, 0, 1, 7, 0), sunrise, maghrib)).toBe(true)
    expect(shouldUseLightThemeAt(new Date(2024, 0, 1, 12, 0), sunrise, maghrib)).toBe(true)
    expect(shouldUseLightThemeAt(new Date(2024, 0, 1, 17, 59), sunrise, maghrib)).toBe(true)
  })

  it('uses dark mode from Maghrib until the next sunrise', () => {
    expect(shouldUseLightThemeAt(new Date(2024, 0, 1, 18, 0), sunrise, maghrib)).toBe(false)
    expect(shouldUseLightThemeAt(new Date(2024, 0, 1, 23, 30), sunrise, maghrib)).toBe(false)
    expect(shouldUseLightThemeAt(new Date(2024, 0, 2, 2, 15), sunrise, maghrib)).toBe(false)
  })

  it('schedules the next theme refresh at the next sunrise or Maghrib boundary', () => {
    expect(getMsUntilNextThemeBoundary(new Date(2024, 0, 1, 6, 30), sunrise, maghrib)).toBe(
      30 * 60 * 1000 + 1000
    )

    expect(getMsUntilNextThemeBoundary(new Date(2024, 0, 1, 17, 30), sunrise, maghrib)).toBe(
      30 * 60 * 1000 + 1000
    )
  })

  it('moves the next boundary to tomorrow sunrise once Maghrib has started', () => {
    expect(getMsUntilNextThemeBoundary(new Date(2024, 0, 1, 18, 0), sunrise, maghrib)).toBe(
      13 * 60 * 60 * 1000 + 1000
    )
  })
})
