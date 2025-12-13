'use client'

import React, { useEffect, useState, useRef, useMemo, memo, useCallback } from 'react'
import { RawPrayerTimes } from '@/app/FetchPrayerTimes'
import TimeUntil from './TimeUntil'
import { usePrayerTimesContext } from '../context/PrayerTimesContext'

// SVG icons in public/icons
const ICON_MAP: Record<string, string> = {
  'Fajr Jamʿā':  '/Icons/icon-fajr.svg',
  'Sunrise':     '/Icons/icon-sunrise.svg',
  'Dhuhr Jamʿā': '/Icons/icon-dhuhr.svg',
  'ʿAṣr Jamʿā':  '/Icons/icon-asr.svg',
  'Maghrib':     '/Icons/icon-maghrib.svg',
  'ʿIshā':       '/Icons/icon-isha.svg',
}

const PRE_EVENT_HOURS   = 1
const POST_EVENT_HOURS  = 1
const BAR_HEIGHT        = 76
const BAR_TOP_PERCENT   = 100
const BAR_Y_OFFSET_PX   = 0
const BAR_BG_COLOR      = 'var(--secondary-color)'
const BAR_FILL_COLOR    = 'var(--accent-color)'
const BAR_BORDER_RADIUS = BAR_HEIGHT
const ICON_SIZE_MOBILE  = 70
const WRAPPER_MOBILE    = 72
const LABEL_ABOVE_GAP   = 16
const LABEL_BELOW_GAP   = 0
const TICK_INTERVAL     = 1000

type Event = {
  name:       string
  time:       Date
  timeString: string
  type:       'jamaat' | 'sunrise' | 'prayer'
}

// Helper to convert HH:MM to Date
const toDate = (ts: string): Date => {
  const [h, m] = ts.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

// Build events from prayer times - memoized outside component
const buildEvents = (data: RawPrayerTimes): Event[] => [
  { name: 'Fajr Jamʿā',  type: 'jamaat',  timeString: data.fajrJamaat,  time: toDate(data.fajrJamaat)  },
  { name: 'Sunrise',     type: 'sunrise', timeString: data.sunrise,     time: toDate(data.sunrise)     },
  { name: 'Dhuhr Jamʿā', type: 'jamaat',  timeString: data.dhuhrJamaat, time: toDate(data.dhuhrJamaat) },
  { name: 'ʿAṣr Jamʿā',  type: 'jamaat',  timeString: data.asrJamaat,   time: toDate(data.asrJamaat)   },
  { name: 'Maghrib',     type: 'prayer',  timeString: data.maghrib,     time: toDate(data.maghrib)     },
  { name: 'ʿIshā',       type: 'prayer',  timeString: data.ishaJamaat,  time: toDate(data.ishaJamaat)  },
]

// Minimum pixel change required to trigger a scroll update
const SCROLL_THRESHOLD = 5

const PrayerTimeline = memo(function PrayerTimeline() {
  const { prayerTimes, isLoading } = usePrayerTimesContext()

  // refs
  const scrollRef = useRef<HTMLDivElement>(null)
  const innerRef  = useRef<HTMLDivElement>(null)
  // Track last scroll position to avoid unnecessary updates
  const lastScrollPosRef = useRef<number | null>(null)

  // state
  const [now, setNow] = useState<Date>(new Date())

  // tick "now" every second
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), TICK_INTERVAL)
    return () => clearInterval(id)
  }, [])

  // Memoize events and range based on prayer times
  const { events, range } = useMemo(() => {
    if (!prayerTimes) {
      return { events: [], range: null }
    }

    const evts = buildEvents(prayerTimes)
    const start = new Date(evts[0].time.getTime() - PRE_EVENT_HOURS * 3_600_000)
    const end   = new Date(evts[evts.length - 1].time.getTime() + POST_EVENT_HOURS * 3_600_000)

    return { events: evts, range: { start, end } }
  }, [prayerTimes])

  // auto-center "now" - only scroll if position changed significantly
  useEffect(() => {
    if (!range || !scrollRef.current || !innerRef.current) return
    const width = innerRef.current.scrollWidth
    const pct   = (now.getTime() - range.start.getTime()) /
                  (range.end.getTime() - range.start.getTime())
    const clamped = Math.max(0, Math.min(1, pct))
    const targetScrollPos = clamped * width - scrollRef.current.offsetWidth / 2

    // Only scroll if position changed by more than threshold (avoids layout thrashing)
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

  // Memoize compute offset function
  const computeOffset = useCallback((e: Event) => {
    if (!range) return { position: 'absolute' as const, left: '0%', transform: 'translateX(-50%)' }
    const totalMs = range.end.getTime() - range.start.getTime() || 1
    return {
      position:  'absolute' as const,
      left:      `${((e.time.getTime() - range.start.getTime()) / totalMs) * 100}%`,
      transform: 'translateX(-50%)',
    }
  }, [range])

  // Memoize next event
  const nextEvt = useMemo(() =>
    events.find(e => e.time.getTime() > now.getTime()),
    [events, now]
  )

  // Memoize passedPct
  const passedPct = useMemo(() => {
    if (!range) return 0
    const totalMs = range.end.getTime() - range.start.getTime() || 1
    return Math.max(
      0,
      Math.min(100, (now.getTime() - range.start.getTime()) / totalMs * 100)
    )
  }, [now, range])

  // loading state
  if (isLoading || !range) {
    return (
      <div className="flex items-center justify-center h-full w-full text-xl">
        Loading prayer timeline…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full text-[var(--text-color)]">
      <div
        ref={scrollRef}
        className="flex-grow overflow-x-hidden overflow-y-hidden py-30 bg-[var(--background-end)]"
      >
        <div
          ref={innerRef}
          className="relative w-full min-w-[900px] py-10"
        >
          {/* background rail */}
          <div
            style={{
              position:     'absolute',
              top:          `${BAR_TOP_PERCENT}%`,
              left:         0,
              right:        0,
              height:       BAR_HEIGHT,
              background:   BAR_BG_COLOR,
              borderRadius: BAR_BORDER_RADIUS,
              transform:    `translateY(calc(-50% + ${BAR_Y_OFFSET_PX}px))`,
            }}
          />
          {/* fill bar */}
          <div
            style={{
              position:     'absolute',
              top:          `${BAR_TOP_PERCENT}%`,
              left:         0,
              width:        `${passedPct}%`,
              height:       BAR_HEIGHT,
              background:   BAR_FILL_COLOR,
              borderRadius: BAR_BORDER_RADIUS,
              transform:    `translateY(calc(-50% + ${BAR_Y_OFFSET_PX}px))`,
            }}
          />

          {events.map(evt => {
            const isAbove =
              evt.type === 'jamaat' ||
              evt.type === 'sunrise'  ||
              evt.name === 'Maghrib'  ||
              evt.name === 'ʿIshā'

            return (
              <div
                key={evt.name}
                className="flex flex-col items-center"
                style={{ ...computeOffset(evt), top: isAbove ? 'calc(-60%)' : 'calc(20%)' }}
              >
                {isAbove && (
                  <div style={{ marginBottom: LABEL_ABOVE_GAP, textAlign: 'center' }}>
                    <div className="text-3xl font-bold">{evt.name.replace(' Jamʿā', '')}</div>
                    <div className="text-4xl font-normal">{evt.timeString}</div>
                  </div>
                )}
                <div
                  style={{
                    width:         `${WRAPPER_MOBILE}px`,
                    height:        `${WRAPPER_MOBILE}px`,
                    display:       'flex',
                    alignItems:    'center',
                    justifyContent:'center',
                  }}
                >
                  <div
                    role="img"
                    aria-label={evt.name}
                    style={{
                      width:               ICON_SIZE_MOBILE,
                      height:              ICON_SIZE_MOBILE,
                      maskImage:           `url(${ICON_MAP[evt.name]})`,
                      WebkitMaskImage:     `url(${ICON_MAP[evt.name]})`,
                      maskRepeat:          'no-repeat',
                      WebkitMaskRepeat:    'no-repeat',
                      maskPosition:        'center',
                      WebkitMaskPosition:  'center',
                      maskSize:            'contain',
                      WebkitMaskSize:      'contain',
                      backgroundColor:     'var(--x-text-color)',
                    }}
                  />
                </div>
                {!isAbove && (
                  <div style={{ marginTop: LABEL_BELOW_GAP, textAlign: 'center' }}>
                    <div className="text-3xl font-semibold">{evt.name.replace(' Jamʿā', '')}</div>
                    <div className="text-4xl font-bold">{evt.timeString}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {nextEvt && (
        <TimeUntil
          eventName={nextEvt.name.replace(' Jamʿā', '')}
          eventTime={nextEvt.time}
        />
      )}
    </div>
  )
})

export default PrayerTimeline
