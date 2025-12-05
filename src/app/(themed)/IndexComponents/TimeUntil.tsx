// src/app/IndexComponents/TimeUntil.tsx
'use client'

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'
import { usePrayerTimesContext } from '../../display/context/PrayerTimesContext'

type TimeUntilProps = {
  eventName?: string
  eventTime?: Date
}

// Digit pools - constant, no need to recalculate
const H_TENS = [0, 1, 2]
const DIGITS = Array.from({ length: 10 }, (_, i) => i)
const M_TENS = [0, 1, 2, 3, 4, 5]

type PrayerEvent = {
  name: string
  time: Date
}

export default function TimeUntil({ eventName, eventTime }: TimeUntilProps = {}) {
  // Get prayer times from context (only needed if no props provided)
  const { prayerTimes, isLoading, error } = usePrayerTimesContext()
  const autoMode = !eventName || !eventTime

  // 1) ticking clock
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // 2) Find the next prayer time (only in auto mode)
  const nextPrayer = useMemo(() => {
    if (!autoMode) return null
    if (!prayerTimes) return null

    const toDate = (timeString: string) => {
      const [h, m] = timeString.split(':').map(Number)
      const d = new Date()
      d.setHours(h, m, 0, 0)
      return d
    }

    // All prayer and jamaat times for the day, in chronological order
    // NOTE: Sunrise is excluded as it's not a prayer or jamaat
    const prayers: PrayerEvent[] = [
      { name: 'Fajr', time: toDate(prayerTimes.fajrStart) },
      { name: 'Fajr Jamʿā', time: toDate(prayerTimes.fajrJamaat) },
      { name: 'Dhuhr', time: toDate(prayerTimes.dhuhrStart) },
      { name: 'Dhuhr Jamʿā', time: toDate(prayerTimes.dhuhrJamaat) },
      { name: 'ʿAṣr', time: toDate(prayerTimes.asrStart) },
      { name: 'ʿAṣr Jamʿā', time: toDate(prayerTimes.asrJamaat) },
      { name: 'Maghrib', time: toDate(prayerTimes.maghrib) },
      { name: 'ʿIshā', time: toDate(prayerTimes.ishaStart) },
    ]

    // Find the first prayer time that's still in the future
    return prayers.find(prayer => prayer.time.getTime() > now.getTime()) || null
  }, [autoMode, prayerTimes, now])

  // 3) Determine which event to use (auto-detected or provided)
  const currentEventName = autoMode ? nextPrayer?.name : eventName
  const currentEventTime = autoMode ? nextPrayer?.time : eventTime

  // 4) time difference
  const diffMs = currentEventTime ? currentEventTime.getTime() - now.getTime() : 0

  // 3) compute HH:MM:SS & split - memoized (always call, even if diffMs <= 0)
  const { H, M, S, ht, ho, mt, mo, st, so } = useMemo(() => {
    const totalS = Math.max(0, Math.floor(diffMs / 1000)) // Clamp to 0
    const H      = Math.floor(totalS / 3600)
    const M      = Math.floor((totalS % 3600) / 60)
    const S      = totalS % 60
    const pad2   = (n: number) => n.toString().padStart(2, '0')
    const [ht, ho] = pad2(H).split('').map(Number)
    const [mt, mo] = pad2(M).split('').map(Number)
    const [st, so] = pad2(S).split('').map(Number)

    return { H, M, S, ht, ho, mt, mo, st, so }
  }, [diffMs])

  // 4) refs for each digit column
  const hTR = useRef<HTMLUListElement>(null!)
  const hOR = useRef<HTMLUListElement>(null!)
  const mTR = useRef<HTMLUListElement>(null!)
  const mOR = useRef<HTMLUListElement>(null!)
  const sTR = useRef<HTMLUListElement>(null!)
  const sOR = useRef<HTMLUListElement>(null!)

  // Keep track of previous values to only animate when changed
  const prevValues = useRef({ ht, ho, mt, mo, st, so })
  const isFirstRender = useRef(true)

  // 5) Set initial positions on mount, then animate on change
  useLayoutEffect(() => {
    const slide = (ref: React.RefObject<HTMLUListElement>, digit: number, prevDigit: number, isFirst: boolean) => {
      if (!ref.current) return

      if (isFirst) {
        // On first render, set position immediately without animation
        gsap.set(ref.current, { y: `-${digit}em` })
      } else if (digit !== prevDigit) {
        // Only animate if the digit actually changed
        gsap.to(ref.current, {
          y: `-${digit}em`,
          duration: 0.4,
          ease: 'power1.out',
        })
      }
    }

    const prev = prevValues.current
    const isFirst = isFirstRender.current

    slide(hTR, ht, prev.ht, isFirst)
    slide(hOR, ho, prev.ho, isFirst)
    slide(mTR, mt, prev.mt, isFirst)
    slide(mOR, mo, prev.mo, isFirst)
    slide(sTR, st, prev.st, isFirst)
    slide(sOR, so, prev.so, isFirst)

    // Update previous values and mark that first render is complete
    prevValues.current = { ht, ho, mt, mo, st, so }
    isFirstRender.current = false
  }, [ht, ho, mt, mo, st, so])

  // 6) Handle loading, error, and no next prayer states (only in auto mode)
  if (autoMode && isLoading) {
    return (
      <div className="w-full py-2 text-center text-sm md:text-xs">
        Loading prayer times...
      </div>
    )
  }

  if (autoMode && error) {
    return (
      <div className="w-full py-2 text-center text-sm md:text-xs text-red-500">
        Error loading prayer times
      </div>
    )
  }

  if (!currentEventName || !currentEventTime || diffMs <= 0) {
    return (
      <div className="w-full py-2 text-center text-sm md:text-xs">
        {autoMode ? 'No more prayers today' : 'Started'}
      </div>
    )
  }

  return (
    <div className="w-full text-[var(--text-color)] py-2">
      <div className="flex flex-col md:flex-row items-center justify-center
                      space-y-2 md:space-y-0 md:space-x-4">
        {/* Label */}
        <div className="text-xl md:text-2xl lg:text-3xl font-semibold text-center">
          Time until{' '}
          <span className="text-[var(--accent-color)]">
            {currentEventName}
          </span>
        </div>

        {/* Clock */}
        <div className="inline-flex font-mono text-2xl md:text-3xl lg:text-4xl overflow-hidden">
          {[
            { ref: hTR, pool: H_TENS, idx: 0 },
            { ref: hOR, pool: DIGITS, idx: 1 },
            { ref: mTR, pool: M_TENS, idx: 2 },
            { ref: mOR, pool: DIGITS, idx: 3 },
            { ref: sTR, pool: M_TENS, idx: 4 },
            { ref: sOR, pool: DIGITS, idx: 5 },
          ].map(({ ref, pool, idx }) => (
            <div key={idx} className="flex items-center">
              <div className="h-[1em] overflow-hidden">
                <ul ref={ref} className="m-0 p-0">
                  {pool.map(d => (
                    <li key={d} className="h-[1em] leading-[1em]">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              {(idx === 1 || idx === 3) && (
                <div className="px-1 select-none">:</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
