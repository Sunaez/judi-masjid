// src/app/display/ThemeProvider.tsx
'use client'

import { useEffect, useRef, useState, ReactNode, useMemo } from 'react'
import gsap from 'gsap'
import { usePrayerTimesContext } from './context/PrayerTimesContext'

// Helper to convert "HH:MM" to Date for today - moved outside component
const toToday = (hhmm: string): Date => {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { prayerTimes: times, isLoading } = usePrayerTimesContext()
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

  // Memoize theme times to avoid recalculation
  const { sunrise, maghrib } = useMemo(() => {
    if (!times) return { sunrise: null, maghrib: null }
    return {
      sunrise: toToday(times.sunrise),
      maghrib: toToday(times.maghrib),
    }
  }, [times])

  // once we have prayer times, pick theme & tear down loader
  useEffect(() => {
    if (!times || !sunrise || !maghrib) return

    const now = new Date()
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
  }, [times, sunrise, maghrib])

  if (!ready || isLoading) {
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
