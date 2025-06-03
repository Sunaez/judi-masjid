// src/app/display/ThemeProvider.tsx
// TODO: Make sure changes are dynamic, currently needs refresh to update theme
'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import gsap from 'gsap'
import { usePrayerTimes } from './usePrayerTimes'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const times = usePrayerTimes()
  const [ready, setReady] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  // GSAP loading dots animation
  useEffect(() => {
    const loaderEl = loaderRef.current
    if (!loaderEl) return

    const dots = loaderEl.querySelectorAll<HTMLElement>('.dot')
    const tl = gsap.timeline({ repeat: -1 })
    tl.fromTo(
      dots,
      { y: 0, autoAlpha: 0 },
      { y: 20, autoAlpha: 1, ease: 'back.inOut', stagger: 0.1 }
    )
    tlRef.current = tl

    return () => { tl.kill() }
  }, [])

  // once we have prayer times, pick theme & tear down loader
  useEffect(() => {
    if (!times) return

    const now = new Date()

    const toToday = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number)
      const d = new Date()
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
    }

    const sunrise = toToday(times.sunrise)
    const maghrib = toToday(times.maghrib)
    const html = document.documentElement

    // midnight -> sunrise: DARK
    // sunrise -> maghrib: LIGHT
    // maghrib -> midnight: DARK
    if (now < sunrise || now >= maghrib) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

    // tear down loader animation
    tlRef.current?.kill()

    // fade loader out, then render rest of app
    if (loaderRef.current) {
      gsap.to(loaderRef.current, {
        autoAlpha: 0,
        duration: 0.3,
        onComplete: () => setReady(true),
      })
    } else {
      setReady(true)
    }
  }, [times])

  if (!ready) {
    return (
      <div ref={loaderRef} className="loader-container">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
    )
  }

  return <>{children}</>
}
