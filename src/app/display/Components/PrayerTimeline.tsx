'use client'

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import TimeUntil from './TimeUntil'
import { usePrayerTimesContext } from '../context/PrayerTimesContext'
import { useDebugContext } from '../context/DebugContext'
import { addMinutesToTime } from '@/lib/prayerTimeUtils'

const ICON_MAP: Record<string, string> = {
  Fajr: '/Icons/white-fajr.webp',
  Sunrise: '/Icons/white-sunrise.webp',
  Dhuhr: '/Icons/white-dhuhr.webp',
  Asr: '/Icons/white-asr.webp',
  Maghrib: '/Icons/white-maghrib.webp',
  Isha: '/Icons/white-isha.webp',
  Taraweh: '/Icons/white-taraweh.webp',
}

const PRE_EVENT_HOURS = 1
const POST_EVENT_HOURS = 1
const MIN_ISHA_TARAWEH_GAP_PERCENT = 4
const MAX_EVENT_LEFT_PERCENT = 99.5
const BAR_HEIGHT = 76
const BAR_TOP_PERCENT = 100
const BAR_Y_OFFSET_PX = 0
const BAR_BG_COLOR = 'var(--secondary-color)'
const BAR_FILL_COLOR = 'var(--accent-color)'
const BAR_BORDER_RADIUS = BAR_HEIGHT
const ICON_SIZE_MOBILE = 70
const WRAPPER_MOBILE = 72
const LABEL_ABOVE_GAP = 16
const LABEL_BELOW_GAP = 0
const TICK_INTERVAL = 1000
const SCROLL_THRESHOLD = 5

type Event = {
  name: string
  time: Date
  timeString: string
  type: 'jamaat' | 'sunrise' | 'prayer'
}

function toDate(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

function buildEvents(prayerTimes: NonNullable<ReturnType<typeof usePrayerTimesContext>['prayerTimes']>, includeTaraweh: boolean): Event[] {
  const events: Event[] = [
    { name: 'Fajr', type: 'jamaat', timeString: prayerTimes.fajrJamaat, time: toDate(prayerTimes.fajrJamaat) },
    { name: 'Sunrise', type: 'sunrise', timeString: prayerTimes.sunrise, time: toDate(prayerTimes.sunrise) },
    { name: 'Dhuhr', type: 'jamaat', timeString: prayerTimes.dhuhrJamaat, time: toDate(prayerTimes.dhuhrJamaat) },
    { name: 'Asr', type: 'jamaat', timeString: prayerTimes.asrJamaat, time: toDate(prayerTimes.asrJamaat) },
    { name: 'Maghrib', type: 'prayer', timeString: prayerTimes.maghrib, time: toDate(prayerTimes.maghrib) },
    { name: 'Isha', type: 'prayer', timeString: prayerTimes.ishaJamaat, time: toDate(prayerTimes.ishaJamaat) },
  ]

  if (includeTaraweh) {
    const tarawehTime = addMinutesToTime(prayerTimes.ishaJamaat, 20)
    events.push({
      name: 'Taraweh',
      type: 'prayer',
      timeString: tarawehTime,
      time: toDate(tarawehTime),
    })
  }

  return events
}

const PrayerTimeline = memo(function PrayerTimeline() {
  const { prayerTimes, isLoading, isRamadan } = usePrayerTimesContext()
  const { ramadanPreviewActive } = useDebugContext()
  const includeTaraweh = isRamadan || ramadanPreviewActive

  const scrollRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const lastScrollPosRef = useRef<number | null>(null)

  const [now, setNow] = useState<Date>(new Date())
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), TICK_INTERVAL)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const updateDarkMode = () => {
      setIsDarkMode(root.classList.contains('dark'))
    }

    updateDarkMode()

    const observer = new MutationObserver(updateDarkMode)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  const { events, range } = useMemo(() => {
    if (!prayerTimes) return { events: [], range: null }

    const nextEvents = buildEvents(prayerTimes, includeTaraweh)
    const start = new Date(nextEvents[0].time.getTime() - PRE_EVENT_HOURS * 3_600_000)
    const end = new Date(nextEvents[nextEvents.length - 1].time.getTime() + POST_EVENT_HOURS * 3_600_000)

    return { events: nextEvents, range: { start, end } }
  }, [prayerTimes, includeTaraweh])

  const adjustedLeftByEventName = useMemo(() => {
    if (!range || events.length === 0) return new Map<string, number>()

    const totalMs = range.end.getTime() - range.start.getTime() || 1
    const leftByName = new Map<string, number>(
      events.map(event => [
        event.name,
        ((event.time.getTime() - range.start.getTime()) / totalMs) * 100,
      ])
    )

    const ishaLeft = leftByName.get('Isha')
    const tarawehLeft = leftByName.get('Taraweh')

    if (typeof ishaLeft === 'number' && typeof tarawehLeft === 'number') {
      const minTarawehLeft = ishaLeft + MIN_ISHA_TARAWEH_GAP_PERCENT
      leftByName.set('Taraweh', Math.min(MAX_EVENT_LEFT_PERCENT, Math.max(tarawehLeft, minTarawehLeft)))
    }

    return leftByName
  }, [events, range])

  useEffect(() => {
    if (!range || !scrollRef.current || !innerRef.current) return

    const width = innerRef.current.scrollWidth
    const percent = (now.getTime() - range.start.getTime()) / (range.end.getTime() - range.start.getTime())
    const clamped = Math.max(0, Math.min(1, percent))
    const targetScrollPos = clamped * width - scrollRef.current.offsetWidth / 2

    if (
      lastScrollPosRef.current === null ||
      Math.abs(targetScrollPos - lastScrollPosRef.current) > SCROLL_THRESHOLD
    ) {
      scrollRef.current.scrollTo({ left: targetScrollPos, behavior: 'auto' })
      lastScrollPosRef.current = targetScrollPos
    }
  }, [now, range])

  const computeOffset = useCallback((event: Event) => {
    if (!range) {
      return { position: 'absolute' as const, left: '0%', transform: 'translateX(-50%)' }
    }

    const totalMs = range.end.getTime() - range.start.getTime() || 1
    const rawLeft = ((event.time.getTime() - range.start.getTime()) / totalMs) * 100
    const left = adjustedLeftByEventName.get(event.name) ?? rawLeft

    return {
      position: 'absolute' as const,
      left: `${left}%`,
      transform: 'translateX(-50%)',
    }
  }, [adjustedLeftByEventName, range])

  const nextEvent = useMemo(
    () => events.find(event => event.time.getTime() > now.getTime()),
    [events, now]
  )

  const passedPct = useMemo(() => {
    if (!range) return 0
    const totalMs = range.end.getTime() - range.start.getTime() || 1
    return Math.max(0, Math.min(100, ((now.getTime() - range.start.getTime()) / totalMs) * 100))
  }, [now, range])

  if (isLoading || !range) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xl">
        Loading prayer timeline...
      </div>
    )
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden text-[var(--text-color)]"
      style={{ backgroundColor: 'var(--background-end)' }}
    >
      <div
        ref={scrollRef}
        className="relative z-10 flex-grow overflow-x-hidden overflow-y-hidden py-30"
        style={{ backgroundColor: 'var(--background-end)' }}
      >
        <div ref={innerRef} className="relative w-full min-w-[900px] py-10">
          <div
            style={{
              position: 'absolute',
              top: `${BAR_TOP_PERCENT}%`,
              left: 0,
              right: 0,
              height: BAR_HEIGHT,
              background: BAR_BG_COLOR,
              borderRadius: BAR_BORDER_RADIUS,
              transform: `translateY(calc(-50% + ${BAR_Y_OFFSET_PX}px))`,
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: `${BAR_TOP_PERCENT}%`,
              left: 0,
              width: `${passedPct}%`,
              height: BAR_HEIGHT,
              background: BAR_FILL_COLOR,
              borderRadius: BAR_BORDER_RADIUS,
              transform: `translateY(calc(-50% + ${BAR_Y_OFFSET_PX}px))`,
            }}
          />

          {events.map(event => {
            const isAbove =
              event.type === 'jamaat' ||
              event.type === 'sunrise' ||
              event.name === 'Maghrib' ||
              event.name === 'Isha' ||
              event.name === 'Taraweh'

            return (
              <div
                key={event.name}
                className="flex flex-col items-center"
                style={{ ...computeOffset(event), top: isAbove ? 'calc(-60%)' : 'calc(20%)' }}
              >
                {isAbove && (
                  <div style={{ marginBottom: LABEL_ABOVE_GAP, textAlign: 'center' }}>
                    <div className="text-3xl font-bold">{event.name}</div>
                    <div className="text-4xl font-normal">{event.timeString}</div>
                  </div>
                )}

                <div
                  style={{
                    width: `${WRAPPER_MOBILE}px`,
                    height: `${WRAPPER_MOBILE}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={ICON_MAP[event.name]}
                    alt={event.name}
                    style={{
                      width: ICON_SIZE_MOBILE,
                      height: ICON_SIZE_MOBILE,
                      objectFit: 'contain',
                      filter: isDarkMode ? 'brightness(0)' : 'none',
                    }}
                  />
                </div>

                {!isAbove && (
                  <div style={{ marginTop: LABEL_BELOW_GAP, textAlign: 'center' }}>
                    <div className="text-3xl font-semibold">{event.name}</div>
                    <div className="text-4xl font-bold">{event.timeString}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {nextEvent && (
        <div className="relative z-10">
          <TimeUntil eventName={nextEvent.name} eventTime={nextEvent.time} />
        </div>
      )}
    </div>
  )
})

export default PrayerTimeline
