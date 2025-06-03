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

  // 2) compute HH:MM:SS & split into digits
  const diff   = Math.max(0, eventTime.getTime() - now.getTime())
  const totalS = Math.floor(diff / 1000)
  const H      = Math.floor(totalS / 3600)
  const M      = Math.floor((totalS % 3600) / 60)
  const S      = totalS % 60
  const pad2   = (n: number) => n.toString().padStart(2, '0')
  const [ht, ho] = pad2(H).split('').map(Number)
  const [mt, mo] = pad2(M).split('').map(Number)
  const [st, so] = pad2(S).split('').map(Number)

  // 3) refs for each digit column
  const hTR = useRef<HTMLUListElement>(null!)
  const hOR = useRef<HTMLUListElement>(null!)
  const mTR = useRef<HTMLUListElement>(null!)
  const mOR = useRef<HTMLUListElement>(null!)
  const sTR = useRef<HTMLUListElement>(null!)
  const sOR = useRef<HTMLUListElement>(null!)

  // 4) slide digits on change
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

  // 5) digit pools
  const H_TENS = [0, 1, 2]
  const DIGITS = Array.from({ length: 10 }, (_, i) => i)
  const M_TENS = [0, 1, 2, 3, 4, 5]

  return (
    <div className="w-full bg-[var(--background-end)] text-[var(--text-color)] py-8">
      <div className="flex items-center justify-center space-x-6">
        {/* Label */}
        <div className="text-4xl md:text-5xl lg:text-6xl font-semibold">
          Time until{' '}
          <span className="text-[var(--accent-color)]">
            {eventName}
          </span>
        </div>

        {/* Clock */}
        <div className="inline-flex font-mono text-4xl md:text-6xl lg:text-7xl overflow-hidden">
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
                  <div className="px-2 select-none">:</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
