import type { RawPrayerTimes } from '@/app/FetchPrayerTimes'
import {
  addMinutesToTime,
  findActivePostPrayerEvent,
  getJamaatRows,
  isInDowntimeWindow,
  minutesToTime,
  timeToMinutes,
} from '../prayerTimeUtils'

const mockPrayerTimes: RawPrayerTimes = {
  fajrStart: '05:00',
  fajrJamaat: '05:30',
  sunrise: '06:45',
  dhuhrStart: '12:15',
  dhuhrJamaat: '13:00',
  asrStart: '15:30',
  asrJamaat: '16:15',
  maghrib: '18:20',
  ishaStart: '20:00',
  ishaJamaat: '21:10',
}

describe('prayerTimeUtils', () => {
  it('converts between HH:MM and minutes', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('23:59')).toBe(1439)
    expect(minutesToTime(90)).toBe('01:30')
  })

  it('adds minutes to time with wrap-around support', () => {
    expect(addMinutesToTime('21:10', 20)).toBe('21:30')
    expect(addMinutesToTime('23:50', 20)).toBe('00:10')
    expect(addMinutesToTime('00:05', -10)).toBe('23:55')
  })

  it('builds jamaat rows and includes taraweh only when requested', () => {
    const regularRows = getJamaatRows(mockPrayerTimes, false)
    const ramadanRows = getJamaatRows(mockPrayerTimes, true)

    expect(regularRows).toHaveLength(5)
    expect(ramadanRows).toHaveLength(6)
    expect(regularRows[0]).toEqual({
      name: 'Fajr',
      startTime: '05:00',
      jamaatTime: '05:30',
    })
    expect(ramadanRows[5]).toEqual({
      name: 'Taraweh',
      startTime: '21:30',
      jamaatTime: '21:30',
    })
  })

  it('finds active post-prayer event in 5-minute window', () => {
    const active = findActivePostPrayerEvent(
      mockPrayerTimes,
      new Date(2026, 1, 18, 13, 3, 0),
      false
    )

    expect(active?.name).toBe('Dhuhr')
    expect(active?.minutesSinceStart).toBe(3)
  })

  it('returns null when not inside any post-prayer window', () => {
    const active = findActivePostPrayerEvent(
      mockPrayerTimes,
      new Date(2026, 1, 18, 14, 0, 0),
      false
    )

    expect(active).toBeNull()
  })

  it('supports post-prayer windows that cross midnight', () => {
    const lateTimes: RawPrayerTimes = {
      ...mockPrayerTimes,
      ishaJamaat: '23:45',
    }

    const active = findActivePostPrayerEvent(
      lateTimes,
      new Date(2026, 1, 19, 0, 7, 0),
      true
    )

    expect(active?.name).toBe('Taraweh')
    expect(active?.time).toBe('00:05')
  })

  describe('off-peak downtime window', () => {
    const downtimeTimes: RawPrayerTimes = {
      ...mockPrayerTimes,
      fajrJamaat: '05:30',
      ishaJamaat: '21:00',
    }

    it('starts one hour after Isha and ends exactly one hour before Fajr', () => {
      expect(isInDowntimeWindow(downtimeTimes, 21 * 60 + 59, false)).toBe(false)
      expect(isInDowntimeWindow(downtimeTimes, 22 * 60, false)).toBe(true)
      expect(isInDowntimeWindow(downtimeTimes, 4 * 60 + 29, false)).toBe(true)
      expect(isInDowntimeWindow(downtimeTimes, 4 * 60 + 30, false)).toBe(false)
    })

    it('keeps the overnight window active after midnight', () => {
      expect(isInDowntimeWindow(downtimeTimes, 23 * 60 + 30, false)).toBe(true)
      expect(isInDowntimeWindow(downtimeTimes, 0, false)).toBe(true)
      expect(isInDowntimeWindow(downtimeTimes, 3 * 60, false)).toBe(true)
      expect(isInDowntimeWindow(downtimeTimes, 12 * 60, false)).toBe(false)
    })

    it('starts three hours after Isha during the Ramadan period', () => {
      expect(isInDowntimeWindow(downtimeTimes, 23 * 60 + 59, true)).toBe(false)
      expect(isInDowntimeWindow(downtimeTimes, 0, true)).toBe(true)
      expect(isInDowntimeWindow(downtimeTimes, 4 * 60 + 29, true)).toBe(true)
      expect(isInDowntimeWindow(downtimeTimes, 4 * 60 + 30, true)).toBe(false)
    })

    it('does not wrap into a full-day downtime when Ramadan Isha runs past the Fajr cutoff', () => {
      const tightRamadanTimes: RawPrayerTimes = {
        ...mockPrayerTimes,
        fajrJamaat: '02:00',
        ishaJamaat: '22:30',
      }

      expect(isInDowntimeWindow(tightRamadanTimes, 1 * 60 + 15, true)).toBe(false)
      expect(isInDowntimeWindow(tightRamadanTimes, 1 * 60 + 45, true)).toBe(false)
      expect(isInDowntimeWindow(tightRamadanTimes, 23 * 60, true)).toBe(false)
    })

    it('returns false when prayer times are not available', () => {
      expect(isInDowntimeWindow(null, 23 * 60, false)).toBe(false)
    })
  })
})
