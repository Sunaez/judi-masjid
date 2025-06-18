// src/app/IndexComponents/PrayerTimeline.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { fetchPrayerTimes, RawPrayerTimes } from '../../FetchPrayerTimes'
import TimeUntil from './TimeUntil'  // updated import path

// SVG icons in public/icons
const ICON_MAP: Record<string, string> = {
  'Fajr':           '/Icons/icon-fajr.svg',
  'Fajr Jamʿā':     '/Icons/icon-masjid.svg',
  'Sunrise':        '/Icons/icon-sunrise.svg',
  'Dhuhr Jamʿā':    '/Icons/icon-masjid.svg',
  'Dhuhr':          '/Icons/icon-dhuhr.svg',
  'ʿAṣr Jamʿā':     '/Icons/icon-masjid.svg',
  'ʿAṣr':           '/Icons/icon-asr.svg',
  'Maghrib':        '/Icons/icon-maghrib.svg',
  'ʿIshā':          '/Icons/icon-isha.svg',
}

//////////////////////////////////////////
// Adjustable parameters ↓↓↓
//////////////////////////////////////////

const PRE_EVENT_HOURS   = 1
const POST_EVENT_HOURS  = 1
const BAR_HEIGHT        = 16
const BAR_BG_COLOR      = 'var(--secondary-color)'
const BAR_FILL_COLOR    = 'var(--accent-color)'
const BAR_BORDER_RADIUS = BAR_HEIGHT
const ICON_SIZE_MOBILE  = 20
const WRAPPER_MOBILE    = 32
const LABEL_ABOVE_GAP   = 4
const LABEL_BELOW_GAP   = 4
const TICK_INTERVAL     = 60_000  // update every minute; use 1_000 for seconds

//////////////////////////////////////////

type Event = {
  name:       string
  time:       Date
  timeString: string
  type:       'prayer' | 'jamaat' | 'sunrise'
}

export default function PrayerTimeline() {
  const [events, setEvents] = useState<Event[]>([])
  const [range,  setRange]  = useState<{ start: Date; end: Date } | null>(null)
  const [now,    setNow]    = useState(new Date())

  const scrollRef = useRef<HTMLDivElement>(null)
  const innerRef  = useRef<HTMLDivElement>(null)

  // tick “now”
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_INTERVAL)
    return () => clearInterval(id)
  }, [])

  // fetch all prayer times
  useEffect(() => {
    async function loadTimeline() {
      try {
        const t: RawPrayerTimes = await fetchPrayerTimes()
        const toDate = (ts: string) => {
          const [h, m] = ts.split(':').map(Number)
          const d = new Date()
          d.setHours(h, m, 0, 0)
          return d
        }

        const evts: Event[] = [
          { name: 'Fajr Jamʿā', type: 'jamaat', timeString: t.fajrJamaat, time: toDate(t.fajrJamaat) },
          { name: 'Fajr',       type: 'prayer', timeString: t.fajrStart,   time: toDate(t.fajrStart)  },
          { name: 'Sunrise',    type: 'sunrise',timeString: t.sunrise,      time: toDate(t.sunrise)    },
          { name: 'Dhuhr Jamʿā',type: 'jamaat', timeString: t.dhuhrJamaat, time: toDate(t.dhuhrJamaat)},
          { name: 'Dhuhr',      type: 'prayer', timeString: t.dhuhrStart,  time: toDate(t.dhuhrStart)},
          { name: 'ʿAṣr Jamʿā', type: 'jamaat', timeString: t.asrJamaat,   time: toDate(t.asrJamaat)  },
          { name: 'ʿAṣr',       type: 'prayer', timeString: t.asrStart,    time: toDate(t.asrStart)   },
          { name: 'Maghrib',    type: 'prayer', timeString: t.maghrib,     time: toDate(t.maghrib)    },
          { name: 'ʿIshā',      type: 'prayer', timeString: t.ishaStart,   time: toDate(t.ishaStart)  },
        ]

        const start = new Date(evts[1].time.getTime() - PRE_EVENT_HOURS * 3_600_000)
        const end   = new Date(evts[evts.length - 1].time.getTime() + POST_EVENT_HOURS * 3_600_000)

        setEvents(evts)
        setRange({ start, end })
      } catch (e) {
        console.error('Failed to load timeline prayer times', e)
      }
    }
    loadTimeline()
  }, [])

  // auto-scroll so “now” stays centered
  useEffect(() => {
    if (!range || !scrollRef.current || !innerRef.current) return
    const container = scrollRef.current
    const width = innerRef.current.scrollWidth
    const pct = (now.getTime() - range.start.getTime()) / (range.end.getTime() - range.start.getTime())
    const scrollPos = Math.min(Math.max(0, pct), 1) * width
    container.scrollTo({ left: scrollPos - container.offsetWidth / 2, behavior: 'auto' })
  }, [now, range])

  if (!range) return null

  const totalMs = range.end.getTime() - range.start.getTime()
  const passedPct = Math.min(
    100,
    Math.max(0, (now.getTime() - range.start.getTime()) / totalMs * 100)
  )

  const computeOffset = (e: Event) => ({
    position: 'absolute' as const,
    left:     `${((e.time.getTime() - range.start.getTime()) / totalMs) * 100}%`,
    transform:'translateX(-50%)',
  })

  // next adhān (prayer times)
  const nextPrayer = events.find(
    e => e.type === 'prayer' && e.time.getTime() > now.getTime()
  )

  // next jamʿāh (jamaat events; include Maghrib/Ishā if you wish)
  const nextJamaat = events.find(e =>
    (e.type === 'jamaat' || e.name === 'Maghrib' || e.name === 'ʿIshā')
    && e.time.getTime() > now.getTime()
  )

  return (
    <>
      <div ref={scrollRef} className="overflow-x-auto touch-pan-x overflow-y-hidden py-12">
        <div ref={innerRef} className="relative w-full min-w-[600px] py-6">
          {/* background bar */}
          <div
            style={{
              position:     'absolute',
              top:          '50%',
              left:         0,
              right:        0,
              height:       BAR_HEIGHT,
              background:   BAR_BG_COLOR,
              borderRadius: BAR_BORDER_RADIUS,
              transform:    'translateY(-50%)',
            }}
          />
          {/* dynamic fill */}
          <div
            style={{
              position:     'absolute',
              top:          '50%',
              left:         0,
              width:        `${passedPct}%`,
              height:       BAR_HEIGHT,
              background:   BAR_FILL_COLOR,
              borderRadius: BAR_BORDER_RADIUS,
              transform:    'translateY(-50%)',
            }}
          />
          {events.map(evt => {
            const passed  = now >= evt.time
            const isAbove = evt.type === 'jamaat' || evt.type === 'sunrise'
            const bgColor = evt.type === 'sunrise'
              ? (passed ? 'var(--yellow)' : 'var(--secondary-color)')
              : (passed ? 'var(--accent-color)' : 'var(--secondary-color)')
            const filter = passed
              ? 'brightness(0) invert(1)'
              : 'brightness(0) invert(0.2)'

            return (
              <div
                key={evt.name}
                className="flex flex-col items-center"
                style={{
                  ...computeOffset(evt),
                  top: isAbove ? 'calc(-60%)' : 'calc(15%)',
                }}
              >
                {isAbove && (
                  <div style={{ marginBottom: LABEL_ABOVE_GAP, textAlign: 'center' }}>
                    <div className="text-[10px] sm:text-xs font-bold">{evt.timeString}</div>
                    <div className="text-xs">{evt.name}</div>
                  </div>
                )}

                <div
                  style={{
                    width:           `${WRAPPER_MOBILE}px`,
                    height:          `${WRAPPER_MOBILE}px`,
                    borderRadius:    '50%',
                    backgroundColor: bgColor,
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                  }}
                >
                  <Image
                    src={ICON_MAP[evt.name]}
                    width={ICON_SIZE_MOBILE}
                    height={ICON_SIZE_MOBILE}
                    alt={evt.name}
                    style={{ filter }}
                  />
                </div>

                {!isAbove && (
                  <div style={{ marginTop: LABEL_BELOW_GAP, textAlign: 'center' }}>
                    <div className="text-xs font-semibold">{evt.name}</div>
                    <div className="text-[10px] sm:text-xs font-bold">{evt.timeString}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-center text-sm text-gray-600 mt-4">
        • Maghrib and Isha are prayed at the Athaan (no separate jamaʿāh time)
      </p>

      {/* two countdowns */}
      <div className="flex flex-col items-center space-y-2 mt-6">
        {nextPrayer && (
          <TimeUntil
            eventName={nextPrayer.name}
            eventTime={nextPrayer.time}
          />
        )}
        {nextJamaat && (
          <TimeUntil
            eventName={nextJamaat.name}
            eventTime={nextJamaat.time}
          />
        )}
      </div>
    </>
  )
}
