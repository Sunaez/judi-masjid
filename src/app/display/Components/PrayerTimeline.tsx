'use client'

import React, { useEffect, useState, useRef, useMemo, memo, useCallback } from 'react'
import { RawPrayerTimes } from '@/app/FetchPrayerTimes'
import TimeUntil from './TimeUntil'
import { usePrayerTimesContext } from '../context/PrayerTimesContext'
import { useDebugContext } from '../context/DebugContext'
import { addMinutesToTime } from '@/lib/prayerTimeUtils'

const ICON_MAP: Record<string, string> = {
  'Fajr Jamaat': '/Icons/white-fajr.webp',
  Sunrise: '/Icons/white-sunrise.webp',
  'Dhuhr Jamaat': '/Icons/white-dhuhr.webp',
  'Asr Jamaat': '/Icons/white-asr.webp',
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

type Event = {
  name: string
  time: Date
  timeString: string
  type: 'jamaat' | 'sunrise' | 'prayer'
}

const toDate = (ts: string): Date => {
  const [h, m] = ts.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

const buildEvents = (data: RawPrayerTimes, includeTaraweh: boolean): Event[] => {
  const events: Event[] = [
    { name: 'Fajr Jamaat', type: 'jamaat', timeString: data.fajrJamaat, time: toDate(data.fajrJamaat) },
    { name: 'Sunrise', type: 'sunrise', timeString: data.sunrise, time: toDate(data.sunrise) },
    { name: 'Dhuhr Jamaat', type: 'jamaat', timeString: data.dhuhrJamaat, time: toDate(data.dhuhrJamaat) },
    { name: 'Asr Jamaat', type: 'jamaat', timeString: data.asrJamaat, time: toDate(data.asrJamaat) },
    { name: 'Maghrib', type: 'prayer', timeString: data.maghrib, time: toDate(data.maghrib) },
    { name: 'Isha', type: 'prayer', timeString: data.ishaJamaat, time: toDate(data.ishaJamaat) },
  ]

  if (includeTaraweh) {
    const tarawehTime = addMinutesToTime(data.ishaJamaat, 20)
    events.push({
      name: 'Taraweh',
      type: 'prayer',
      timeString: tarawehTime,
      time: toDate(tarawehTime),
    })
  }

  return events
}

const SCROLL_THRESHOLD = 5

const PrayerTimeline = memo(function PrayerTimeline() {
  const { prayerTimes, isLoading, isRamadan } = usePrayerTimesContext()
  const { ramadanPreviewActive } = useDebugContext()
  const includeTaraweh = isRamadan || ramadanPreviewActive

  const scrollRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const lastScrollPosRef = useRef<number | null>(null)

  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), TICK_INTERVAL)
    return () => clearInterval(id)
  }, [])

  const { events, range } = useMemo(() => {
    if (!prayerTimes) return { events: [], range: null }

    const evts = buildEvents(prayerTimes, includeTaraweh)
    const start = new Date(evts[0].time.getTime() - PRE_EVENT_HOURS * 3_600_000)
    const end = new Date(evts[evts.length - 1].time.getTime() + POST_EVENT_HOURS * 3_600_000)

    return { events: evts, range: { start, end } }
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
    const pct = (now.getTime() - range.start.getTime()) / (range.end.getTime() - range.start.getTime())
    const clamped = Math.max(0, Math.min(1, pct))
    const targetScrollPos = clamped * width - scrollRef.current.offsetWidth / 2

    if (
      lastScrollPosRef.current === null ||
      Math.abs(targetScrollPos - lastScrollPosRef.current) > SCROLL_THRESHOLD
    ) {
      scrollRef.current.scrollTo({
        left: targetScrollPos,
        behavior: 'auto',
      })
      lastScrollPosRef.current = targetScrollPos
    }
  }, [now, range])

  const computeOffset = useCallback(
    (e: Event) => {
      if (!range) return { position: 'absolute' as const, left: '0%', transform: 'translateX(-50%)' }
      const totalMs = range.end.getTime() - range.start.getTime() || 1
      const rawLeft = ((e.time.getTime() - range.start.getTime()) / totalMs) * 100
      const left = adjustedLeftByEventName.get(e.name) ?? rawLeft
      return {
        position: 'absolute' as const,
        left: `${left}%`,
        transform: 'translateX(-50%)',
      }
    },
    [range, adjustedLeftByEventName]
  )

  const nextEvt = useMemo(() => events.find(e => e.time.getTime() > now.getTime()), [events, now])

  const passedPct = useMemo(() => {
    if (!range) return 0
    const totalMs = range.end.getTime() - range.start.getTime() || 1
    return Math.max(0, Math.min(100, ((now.getTime() - range.start.getTime()) / totalMs) * 100))
  }, [now, range])

  if (isLoading || !range) {
    return (
      <div className="flex items-center justify-center h-full w-full text-xl">
        Loading prayer timeline...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full text-[var(--text-color)]">
      <div
        ref={scrollRef}
        className="flex-grow overflow-x-hidden overflow-y-hidden py-30 bg-[var(--background-end)]"
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

          {events.map(evt => {
            const isAbove =
              evt.type === 'jamaat' ||
              evt.type === 'sunrise' ||
              evt.name === 'Maghrib' ||
              evt.name === 'Isha' ||
              evt.name === 'Taraweh'

            return (
              <div
                key={evt.name}
                className="flex flex-col items-center"
                style={{ ...computeOffset(evt), top: isAbove ? 'calc(-60%)' : 'calc(20%)' }}
              >
                {isAbove && (
                  <div style={{ marginBottom: LABEL_ABOVE_GAP, textAlign: 'center' }}>
                    <div className="text-3xl font-bold">{evt.name}</div>
                    <div className="text-4xl font-normal">{evt.timeString}</div>
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
                    src={ICON_MAP[evt.name]}
                    alt={evt.name}
                    style={{
                      width: ICON_SIZE_MOBILE,
                      height: ICON_SIZE_MOBILE,
                      objectFit: 'contain',
                    }}
                  />
                </div>
                {!isAbove && (
                  <div style={{ marginTop: LABEL_BELOW_GAP, textAlign: 'center' }}>
                    <div className="text-3xl font-semibold">{evt.name}</div>
                    <div className="text-4xl font-bold">{evt.timeString}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {nextEvt && <TimeUntil eventName={nextEvt.name} eventTime={nextEvt.time} />}
    </div>
  )
})

export default PrayerTimeline
