'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

import { usePrayerTimesContext } from '../../display/context/PrayerTimesContext'
import TimeUntil from './TimeUntil'

const ICON_MAP: Record<string, string> = {
  Fajr: '/Icons/icon-fajr.svg',
  Sunrise: '/Icons/icon-sunrise.svg',
  Dhuhr: '/Icons/icon-dhuhr.svg',
  Asr: '/Icons/icon-asr.svg',
  Maghrib: '/Icons/icon-maghrib.svg',
  Isha: '/Icons/icon-isha.svg',
}

const PRE_EVENT_HOURS = 1
const POST_EVENT_HOURS = 1
const BAR_HEIGHT = 16
const BAR_BG_COLOR = 'var(--secondary-color)'
const BAR_FILL_COLOR = 'var(--accent-color)'
const BAR_BORDER_RADIUS = BAR_HEIGHT
const ICON_SIZE_MOBILE = 20
const WRAPPER_MOBILE = 32
const LABEL_ABOVE_GAP = 4
const LABEL_BELOW_GAP = 4
const TICK_INTERVAL = 5_000

type Event = {
  name: string
  time: Date
  timeString: string
  type: 'prayer' | 'sunrise'
}

function toDate(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

export default function PrayerTimeline() {
  const { prayerTimes: times, isLoading, error } = usePrayerTimesContext()
  const isError = !!error
  const [now, setNow] = useState(new Date())

  const scrollRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_INTERVAL)
    return () => clearInterval(id)
  }, [])

  const { events, range } = useMemo(() => {
    if (!times) return { events: [], range: null }

    const nextEvents: Event[] = [
      { name: 'Fajr', type: 'prayer', timeString: times.fajrJamaat, time: toDate(times.fajrJamaat) },
      { name: 'Sunrise', type: 'sunrise', timeString: times.sunrise, time: toDate(times.sunrise) },
      { name: 'Dhuhr', type: 'prayer', timeString: times.dhuhrJamaat, time: toDate(times.dhuhrJamaat) },
      { name: 'Asr', type: 'prayer', timeString: times.asrJamaat, time: toDate(times.asrJamaat) },
      { name: 'Maghrib', type: 'prayer', timeString: times.maghrib, time: toDate(times.maghrib) },
      { name: 'Isha', type: 'prayer', timeString: times.ishaStart, time: toDate(times.ishaStart) },
    ]

    const start = new Date(nextEvents[0].time.getTime() - PRE_EVENT_HOURS * 3_600_000)
    const end = new Date(nextEvents[nextEvents.length - 1].time.getTime() + POST_EVENT_HOURS * 3_600_000)

    return { events: nextEvents, range: { start, end } }
  }, [times])

  const totalMs = useMemo(() => {
    if (!range) return 0
    return range.end.getTime() - range.start.getTime()
  }, [range])

  const computeOffset = useCallback((event: Event) => {
    if (!range) return {}

    return {
      position: 'absolute' as const,
      left: `${((event.time.getTime() - range.start.getTime()) / totalMs) * 100}%`,
      transform: 'translateX(-50%)',
    }
  }, [range, totalMs])

  useEffect(() => {
    if (!range || !scrollRef.current || !innerRef.current) return

    const container = scrollRef.current
    const width = innerRef.current.scrollWidth
    const percent = (now.getTime() - range.start.getTime()) / (range.end.getTime() - range.start.getTime())
    const scrollPos = Math.min(Math.max(0, percent), 1) * width

    container.scrollTo({ left: scrollPos - container.offsetWidth / 2, behavior: 'auto' })
  }, [now, range])

  const nextEvent = useMemo(
    () => events.find(event => event.time.getTime() > now.getTime()),
    [events, now]
  )

  if (isError) {
    return (
      <div className="py-8 text-center text-red-500">
        <p>Failed to load prayer timeline</p>
      </div>
    )
  }

  if (isLoading || !range) {
    return (
      <div className="animate-pulse py-12">
        <div className="h-16 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
      </div>
    )
  }

  const passedPct = Math.min(
    100,
    Math.max(0, ((now.getTime() - range.start.getTime()) / totalMs) * 100)
  )

  return (
    <>
      <div ref={scrollRef} className="overflow-x-auto touch-pan-x overflow-y-hidden py-12">
        <div ref={innerRef} className="relative w-full min-w-[600px] py-6">
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: BAR_HEIGHT,
              background: BAR_BG_COLOR,
              borderRadius: BAR_BORDER_RADIUS,
              transform: 'translateY(-50%)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: `${passedPct}%`,
              height: BAR_HEIGHT,
              background: BAR_FILL_COLOR,
              borderRadius: BAR_BORDER_RADIUS,
              transform: 'translateY(-50%)',
            }}
          />

          {events.map(event => {
            const passed = now >= event.time
            const isAbove = event.type === 'sunrise'
            const bgColor =
              event.type === 'sunrise'
                ? passed
                  ? 'var(--yellow)'
                  : 'var(--secondary-color)'
                : passed
                ? 'var(--accent-color)'
                : 'var(--secondary-color)'
            const filter = passed ? 'brightness(0) invert(1)' : 'brightness(0) invert(0.2)'

            return (
              <div
                key={event.name}
                className="flex flex-col items-center"
                style={{
                  ...computeOffset(event),
                  top: isAbove ? 'calc(-60%)' : 'calc(15%)',
                }}
              >
                {isAbove && (
                  <div style={{ marginBottom: LABEL_ABOVE_GAP, textAlign: 'center' }}>
                    <div className="text-[10px] font-bold sm:text-xs">{event.timeString}</div>
                    <div className="text-xs">{event.name}</div>
                  </div>
                )}

                <div
                  style={{
                    width: `${WRAPPER_MOBILE}px`,
                    height: `${WRAPPER_MOBILE}px`,
                    borderRadius: '50%',
                    backgroundColor: bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    src={ICON_MAP[event.name]}
                    width={ICON_SIZE_MOBILE}
                    height={ICON_SIZE_MOBILE}
                    alt={event.name}
                    style={{ filter }}
                  />
                </div>

                {!isAbove && (
                  <div style={{ marginTop: LABEL_BELOW_GAP, textAlign: 'center' }}>
                    <div className="text-xs font-semibold">{event.name}</div>
                    <div className="text-[10px] font-bold sm:text-xs">{event.timeString}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        • Maghrib and Isha are prayed at the Athaan
      </p>

      <div className="mt-6 flex flex-col items-center space-y-2">
        {nextEvent && <TimeUntil eventName={nextEvent.name} eventTime={nextEvent.time} />}
      </div>
    </>
  )
}
