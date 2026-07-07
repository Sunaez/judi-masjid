// src/app/display/ThemeProvider.tsx
'use client'

import { useCallback, useEffect, useRef, useState, ReactNode, useMemo } from 'react'
import gsap from 'gsap'
import { usePrayerTimesContext } from './context/PrayerTimesContext'

const DAY_MS = 24 * 60 * 60 * 1000
const MINUTE_MS = 60 * 1000
const BOUNDARY_BUFFER_MS = 1000

export function timeStringToMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  return hours * 60 + minutes
}

function getMinutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

function getMsSinceMidnight(date: Date): number {
  return (
    date.getHours() * 60 * 60 * 1000 +
    date.getMinutes() * 60 * 1000 +
    date.getSeconds() * 1000 +
    date.getMilliseconds()
  )
}

export function shouldUseLightThemeAt(
  now: Date,
  sunriseMinutes: number,
  maghribMinutes: number
): boolean {
  const currentMinutes = getMinutesSinceMidnight(now)

  if (sunriseMinutes <= maghribMinutes) {
    return currentMinutes >= sunriseMinutes && currentMinutes < maghribMinutes
  }

  // Defensive fallback for unusual schedules where the light window crosses midnight.
  return currentMinutes >= sunriseMinutes || currentMinutes < maghribMinutes
}

export function getMsUntilNextThemeBoundary(
  now: Date,
  sunriseMinutes: number,
  maghribMinutes: number
): number {
  const currentMs = getMsSinceMidnight(now)
  const sunriseMs = sunriseMinutes * MINUTE_MS
  const maghribMs = maghribMinutes * MINUTE_MS

  const boundaries =
    sunriseMinutes <= maghribMinutes
      ? [sunriseMs, maghribMs, sunriseMs + DAY_MS]
      : [maghribMs, sunriseMs, maghribMs + DAY_MS]

  const nextBoundary = boundaries.find(boundary => boundary > currentMs) ?? boundaries[0] + DAY_MS

  return Math.max(BOUNDARY_BUFFER_MS, nextBoundary - currentMs + BOUNDARY_BUFFER_MS)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { prayerTimes: times, isLoading, error } = usePrayerTimesContext()
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

  const themeTimes = useMemo(() => {
    if (!times) return null

    const sunriseMinutes = timeStringToMinutes(times.sunrise)
    const maghribMinutes = timeStringToMinutes(times.maghrib)

    if (sunriseMinutes === null || maghribMinutes === null) return null

    return {
      sunriseMinutes,
      maghribMinutes,
    }
  }, [times])

  const applyTheme = useCallback((now = new Date()) => {
    if (!themeTimes) return

    const useLightTheme = shouldUseLightThemeAt(
      now,
      themeTimes.sunriseMinutes,
      themeTimes.maghribMinutes
    )
    const html = document.documentElement

    // sunrise -> Maghrib: light. Maghrib -> sunrise: dark.
    html.classList.toggle('dark', !useLightTheme)
  }, [themeTimes])

  useEffect(() => {
    if (!themeTimes) return

    let boundaryTimeout: number | null = null

    const clearBoundaryTimeout = () => {
      if (boundaryTimeout !== null) {
        window.clearTimeout(boundaryTimeout)
        boundaryTimeout = null
      }
    }

    const scheduleNextBoundary = () => {
      clearBoundaryTimeout()

      const now = new Date()
      applyTheme(now)

      boundaryTimeout = window.setTimeout(
        scheduleNextBoundary,
        getMsUntilNextThemeBoundary(
          now,
          themeTimes.sunriseMinutes,
          themeTimes.maghribMinutes
        )
      )
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        scheduleNextBoundary()
      }
    }

    scheduleNextBoundary()
    const fallbackInterval = window.setInterval(() => applyTheme(), MINUTE_MS)

    window.addEventListener('focus', scheduleNextBoundary)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearBoundaryTimeout()
      window.clearInterval(fallbackInterval)
      window.removeEventListener('focus', scheduleNextBoundary)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [themeTimes, applyTheme])

  // Once we have prayer times, tear down loader.
  useEffect(() => {
    if (!times || ready) return

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
  }, [times, ready])

  // Show error state
  if (error && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[var(--background-start)] to-[var(--background-end)]">
        <div className="text-center p-8 bg-[var(--background-end)] rounded-2xl shadow-xl max-w-md border border-[var(--secondary-color)]">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[var(--accent-color)] mb-3">
            Prayer Times Unavailable
          </h2>
          <p className="text-[var(--text-color)] mb-4">
            {error}
          </p>
          <p className="text-sm text-[var(--secondary-color)]">
            Please contact the administrator or try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 py-2 px-6 bg-[var(--accent-color)] text-[var(--background-end)] font-semibold rounded-md hover:opacity-90 transition"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

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
