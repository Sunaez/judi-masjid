import type { RawPrayerTimes } from '@/app/FetchPrayerTimes'

const MINUTES_PER_DAY = 24 * 60

export interface JamaatRow {
  name: string
  startTime: string
  jamaatTime: string
}

export interface PostPrayerEvent {
  name: string
  time: string
}

export interface ActivePostPrayerEvent extends PostPrayerEvent {
  minutesSinceStart: number
}

function normalizeMinutes(minutes: number): number {
  const normalized = minutes % MINUTES_PER_DAY
  return normalized < 0 ? normalized + MINUTES_PER_DAY : normalized
}

export function timeToMinutes(time: string): number {
  const [rawHours, rawMinutes] = time.split(':').map(Number)
  const hours = Number.isFinite(rawHours) ? rawHours : 0
  const minutes = Number.isFinite(rawMinutes) ? rawMinutes : 0
  return normalizeMinutes(hours * 60 + minutes)
}

export function minutesToTime(minutes: number): string {
  const normalized = normalizeMinutes(minutes)
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  return minutesToTime(timeToMinutes(time) + minutesToAdd)
}

export function getJamaatRows(prayerTimes: RawPrayerTimes, includeTaraweh: boolean): JamaatRow[] {
  const rows: JamaatRow[] = [
    { name: 'Fajr', startTime: prayerTimes.fajrStart, jamaatTime: prayerTimes.fajrJamaat },
    { name: 'Dhuhr', startTime: prayerTimes.dhuhrStart, jamaatTime: prayerTimes.dhuhrJamaat },
    { name: 'Asr', startTime: prayerTimes.asrStart, jamaatTime: prayerTimes.asrJamaat },
    { name: 'Maghrib', startTime: prayerTimes.maghrib, jamaatTime: prayerTimes.maghrib },
    { name: 'Isha', startTime: prayerTimes.ishaStart, jamaatTime: prayerTimes.ishaJamaat },
  ]

  if (includeTaraweh) {
    const tarawehTime = addMinutesToTime(prayerTimes.ishaJamaat, 20)
    rows.push({
      name: 'Taraweh',
      startTime: tarawehTime,
      jamaatTime: tarawehTime,
    })
  }

  return rows
}

export function getPostPrayerEvents(prayerTimes: RawPrayerTimes, includeTaraweh: boolean): PostPrayerEvent[] {
  return getJamaatRows(prayerTimes, includeTaraweh).map(row => ({
    name: row.name,
    time: row.jamaatTime,
  }))
}

export function findActivePostPrayerEvent(
  prayerTimes: RawPrayerTimes | null,
  now: Date,
  includeTaraweh: boolean,
  windowMinutes: number = 5
): ActivePostPrayerEvent | null {
  if (!prayerTimes) return null

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const events = getPostPrayerEvents(prayerTimes, includeTaraweh)

  let activeEvent: ActivePostPrayerEvent | null = null

  events.forEach(event => {
    const eventMinutes = timeToMinutes(event.time)
    const diff = normalizeMinutes(nowMinutes - eventMinutes)
    const isActive = diff >= 0 && diff < windowMinutes

    if (!isActive) return

    if (!activeEvent || diff < activeEvent.minutesSinceStart) {
      activeEvent = {
        ...event,
        minutesSinceStart: diff,
      }
    }
  })

  return activeEvent
}
