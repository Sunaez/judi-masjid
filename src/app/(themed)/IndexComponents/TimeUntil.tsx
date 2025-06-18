// src/app/IndexComponents/TimeUntil.tsx
'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

type TimeUntilProps = {
  eventName: string
  eventTime: Date
}

export default function TimeUntil({ eventName, eventTime }: TimeUntilProps) {
  // 1) ticking clock
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // 2) time difference
  const diffMs = eventTime.getTime() - now.getTime()

  // 3) if we've reached (or passed) the event, show “Started”
  if (diffMs <= 0) {
    return (
      <div className="w-full py-2 text-center text-sm md:text-xs">
        Started
      </div>
    )
  }

  // 4) compute HH:MM:SS & split
  const totalS = Math.floor(diffMs / 1000)
  const H      = Math.floor(totalS / 3600)
  const M      = Math.floor((totalS % 3600) / 60)
  const S      = totalS % 60
  const pad2   = (n: number) => n.toString().padStart(2, '0')
  const [ht, ho] = pad2(H).split('').map(Number)
  const [mt, mo] = pad2(M).split('').map(Number)
  const [st, so] = pad2(S).split('').map(Number)

  // 5) refs for each digit column
  const hTR = useRef<HTMLUListElement>(null!)
  const hOR = useRef<HTMLUListElement>(null!)
  const mTR = useRef<HTMLUListElement>(null!)
  const mOR = useRef<HTMLUListElement>(null!)
  const sTR = useRef<HTMLUListElement>(null!)
  const sOR = useRef<HTMLUListElement>(null!)

  // 6) slide digits on change
  useLayoutEffect(() => {
    const slide = (ref: React.RefObject<HTMLUListElement>, digit: number) => {
      if (ref.current) {
        gsap.to(ref.current, {
          y: `-${digit}em`,
          duration: 0.4,
          ease: 'power1.out',
        })
      }
    }
    slide(hTR, ht)
    slide(hOR, ho)
    slide(mTR, mt)
    slide(mOR, mo)
    slide(sTR, st)
    slide(sOR, so)
  }, [ht, ho, mt, mo, st, so])

  // 7) digit pools
  const H_TENS = [0, 1, 2]
  const DIGITS = Array.from({ length: 10 }, (_, i) => i)
  const M_TENS = [0, 1, 2, 3, 4, 5]

  return (
    <div className="w-full text-[var(--text-color)] py-2">
      <div className="flex flex-col md:flex-row items-center justify-center
                      space-y-2 md:space-y-0 md:space-x-4">
        {/* Label */}
        <div className="text-xl md:text-2xl lg:text-3xl font-semibold text-center">
          Time until{' '}
          <span className="text-[var(--accent-color)]">
            {eventName}
          </span>
        </div>

        {/* Clock */}
        <div className="inline-flex font-mono text-2xl md:text-3xl lg:text-4xl overflow-hidden">
          {[hTR, hOR, mTR, mOR, sTR, sOR].map((ref, idx) => {
            const pool =
              idx === 0 ? H_TENS :
              idx === 1 ? DIGITS :
              idx === 2 ? M_TENS :
              idx === 3 ? DIGITS :
              idx === 4 ? M_TENS :
                           DIGITS

            return (
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
            )
          })}
        </div>
      </div>
    </div>
  )
}
