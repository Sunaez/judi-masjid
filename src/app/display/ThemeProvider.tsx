// src/app/display/ThemeProvider.tsx
'use client'

import { useCallback, useEffect, useRef, useState, ReactNode, useMemo } from 'react'
import gsap from 'gsap'
import { usePrayerTimesContext } from './context/PrayerTimesContext'
import { mosqueMinutes, mosqueTimeOnDate } from '@/lib/mosqueClock'

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
  return mosqueMinutes(date)
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
  const boundaries = [0, 1].flatMap(day => [sunriseMinutes, maghribMinutes].map(minutes =>
    mosqueTimeOnDate(Math.floor(minutes / 60), minutes % 60, now, day).getTime()
  )).filter(at => at > now.getTime())
  return Math.max(BOUNDARY_BUFFER_MS, Math.min(...boundaries) - now.getTime() + BOUNDARY_BUFFER_MS)
}

// Persistent error box. Kept as a separate component with `key={error}` so that
// re-renders driven by connection-attempt changes (see <IndicatorLight>) do NOT
// cause this node to remount/flicker while the error text stays identical.
export function ErrorBox({ error, isLoading }: { error: string | null; isLoading: boolean }) {
  if (!error && !isLoading) return null;

  return (
    <div className="prayer-times-error flex items-center justify-center min-h-screen bg-gradient-to-b from-[var(--background-start)] to-[var(--background-end)]">
      <div className="text-center p-8 bg-[var(--background-end)] rounded-2xl shadow-xl max-w-md border border-[var(--secondary-color)]">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-2xl font-bold text-[var(--accent-color)] mb-3">Prayer Times Unavailable</h3>
        <p className="text-[var(--text-color)] mb-4">{error}</p>
        <p className="text-sm text-[var(--secondary-color)]">Retrying automatically. Please contact the administrator if this continues.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 py-2 px-6 bg-[var(--accent-color)] text-[var(--background-end)] font-semibold rounded-md hover:opacity-90 transition"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

// Connection indicator light. Renders nothing until there is at least one failed
// attempt, then flashes ~1s per attempt via a CSS animation keyed on `attempts`
// (each increment remounts the element and triggers a fresh flash).
export function IndicatorLight({ attempts }: { attempts: number }) {
  if (!attempts) return null;

  return (
    <span key={attempts} className="indicator-light" title={`Connection attempt ${attempts}`} aria-hidden="true" />
  );
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

  // Show error state. ErrorBox is keyed on `error` so it stays stable across
  // re-renders driven by connection-attempt changes (IndicatorLight flashes).
  if (error && !isLoading && !times) {
    return <ErrorBox key={error} error={error} isLoading={isLoading} />;
  }

  if (!ready || (isLoading && !times)) {
    return (
      <div ref={loaderRef} className="loader-container">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
    )
  }

  return (
    <>
      {children}
      {error && times && (
        <div role="status" className="fixed bottom-2 right-2 z-[70] rounded bg-black/70 px-3 py-1 text-sm text-white">
          Timetable refresh delayed. Retrying…
        </div>
      )}
    </>
  );
}
