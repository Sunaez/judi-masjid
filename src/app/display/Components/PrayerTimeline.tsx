// src/app/display/Components/PrayerTimeline.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { fetchPrayerTimes, RawPrayerTimes } from '../../FetchPrayerTimes'
import TimeUntil from './TimeUntil'

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

export default function PrayerTimeline() {
  const [events, setEvents] = useState<Event[]>([])
  const [range,  setRange]  = useState<{ start: Date; end: Date } | null>(null)
  const [now,    setNow]    = useState(new Date())

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const innerRef  = useRef<HTMLDivElement | null>(null)

  // update “now” every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_INTERVAL)
    return () => clearInterval(id)
  }, [])

  // fetch + build timeline events
  useEffect(() => {
    async function load() {
      try {
        const t: RawPrayerTimes = await fetchPrayerTimes()
        const toDate = (ts: string) => {
          const [h, m] = ts.split(':').map(Number)
          const d = new Date()
          d.setHours(h, m, 0, 0)
          return d
        }

        const evts: Event[] = [
          { name: 'Fajr Jamʿā',  type: 'jamaat', timeString: t.fajrJamaat,  time: toDate(t.fajrJamaat) },
          { name: 'Sunrise',     type: 'sunrise',timeString: t.sunrise,       time: toDate(t.sunrise)    },
          { name: 'Dhuhr Jamʿā', type: 'jamaat', timeString: t.dhuhrJamaat, time: toDate(t.dhuhrJamaat)},
          { name: 'ʿAṣr Jamʿā',  type: 'jamaat', timeString: t.asrJamaat,   time: toDate(t.asrJamaat)  },
          { name: 'Maghrib',     type: 'prayer', timeString: t.maghrib,      time: toDate(t.maghrib)    },
          { name: 'ʿIshā',       type: 'prayer', timeString: t.ishaStart,    time: toDate(t.ishaStart)  },
        ]

        const start = new Date(evts[0].time.getTime() - PRE_EVENT_HOURS * 3_600_000)
        const end   = new Date(evts.at(-1)!.time.getTime()  + POST_EVENT_HOURS * 3_600_000)
        setEvents(evts)
        setRange({ start, end })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  // center “now” in view
  useEffect(() => {
    if (!range || !scrollRef.current || !innerRef.current) return
    const container = scrollRef.current
    const width     = innerRef.current.scrollWidth
    const pct       = (now.getTime() - range.start.getTime()) / (range.end.getTime() - range.start.getTime())
    const scrollPos = Math.min(Math.max(0, pct), 1) * width
    container.scrollTo({ left: scrollPos - container.offsetWidth / 2, behavior: 'auto' })
  }, [now, range])

  if (!range) return null

  const totalMs   = range.end.getTime() - range.start.getTime()
  const passedPct = Math.min(100, Math.max(0, (now.getTime() - range.start.getTime()) / totalMs * 100))

  const computeOffset = (e: Event) => ({
    position:  'absolute' as const,
    left:      `${((e.time.getTime() - range.start.getTime()) / totalMs) * 100}%`,
    transform: 'translateX(-50%)',
  })

  const nextEvt = events.find(e => e.time.getTime() > now.getTime())

  return (
    <div className="flex flex-col h-full w-full text-[var(--text-color)]">
      {/* Timeline container fills all available space */}
      <div
        ref={scrollRef}
        className="flex-grow overflow-x-hidden overflow-y-hidden py-30 bg-[var(--background-end)]"
      >
        <div
          ref={innerRef}
          className="relative w-full min-w-[900px] py-10"
        >
          {/* background bar */}
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
            const passed  = now >= evt.time
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

                {/* Icon without background circle */}
                <div
                  style={{
                    width:          `${WRAPPER_MOBILE}px`,
                    height:         `${WRAPPER_MOBILE}px`,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
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

      {/* Countdown to next event */}
      {nextEvt && (
        <TimeUntil
          eventName={nextEvt.name.replace(' Jamʿā', '')}
          eventTime={nextEvt.time}
        />
      )}
    </div>
  )
}
