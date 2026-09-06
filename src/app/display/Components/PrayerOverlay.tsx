// src/app/display/Components/PrayerOverlay.tsx
'use client'

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'motion/react'
import { useEffect, useState, useMemo, memo } from 'react'
import { usePrayerTimesContext } from '../context/PrayerTimesContext'
import { useDebugContext } from '../context/DebugContext'

interface PrayerTime {
  name: string
  date: Date
}

// Helper to convert HH:MM to Date
const toDate = (ts: string): Date => {
  const [h, m] = ts.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

const WINDOW_MS = 180 * 1000 // 3 minutes active window

const PhoneSilentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="prayer-overlay-phone-icon" aria-hidden="true" focusable="false">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
    <path d="M8 6h8" />
    <line x1="4" y1="1" x2="20" y2="17" strokeWidth="2" />
  </svg>
)

const PrayerOverlay = memo(function PrayerOverlay() {
  const { prayerTimes: rawTimes, isLoading } = usePrayerTimesContext()
  const { prayerOverlayTestSignal } = useDebugContext()
  const reducedMotion = useReducedMotion()

  // ─── State: "now" ───────────────────────────────────────────
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // ─── Debug: Test mode state (Key 3 triggers) ───────────────────────────────
  const [testMode, setTestMode] = useState<'off' | 'countdown' | 'prayer'>('off')
  const [testCountdown, setTestCountdown] = useState(10)

  // When prayerOverlayTestSignal changes (Key 3 pressed), start test mode
  useEffect(() => {
    if (prayerOverlayTestSignal > 0) {
      // Start with countdown phase
      setTestMode('countdown')
      setTestCountdown(10)
    }
  }, [prayerOverlayTestSignal])

  // Handle test mode countdown and phase transitions
  useEffect(() => {
    if (testMode === 'off') return

    const interval = setInterval(() => {
      setTestCountdown(prev => {
        if (prev <= 1) {
          if (testMode === 'countdown') {
            // Switch to prayer phase
            setTestMode('prayer')
            return 5 // Show "in progress" for 5 seconds
          } else {
            // End test mode
            setTestMode('off')
            return 0
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [testMode])

  // ─── Memoize prayer times array ─────────────────────────
  const prayerTimes = useMemo<PrayerTime[] | null>(() => {
    if (!rawTimes) return null

    return [
      { name: 'Fajr',    date: toDate(rawTimes.fajrJamaat) },
      { name: 'Dhuhr',   date: toDate(rawTimes.dhuhrJamaat) },
      { name: 'Asr',     date: toDate(rawTimes.asrJamaat) },
      { name: 'Maghrib', date: toDate(rawTimes.maghrib)   },
      { name: 'Isha',    date: toDate(rawTimes.ishaJamaat) },
    ].sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [rawTimes])

  // Memoize next prayer and phase
  const { nextPrayer, phase, secsUntil } = useMemo(() => {
    if (!prayerTimes) {
      return { nextPrayer: null, phase: 'idle' as const, secsUntil: 0 }
    }

    const nextPr = prayerTimes.find(pt => now.getTime() < pt.date.getTime() + WINDOW_MS) || null

    if (!nextPr) {
      return { nextPrayer: null, phase: 'idle' as const, secsUntil: 0 }
    }

    const deltaMs = nextPr.date.getTime() - now.getTime()
    const secsUnt = Math.ceil(deltaMs / 1000)
    const secsSince = Math.floor(-deltaMs / 1000)

    let ph: 'idle' | 'countdown' | 'prayer' = 'idle'
    if (secsUnt >= 1 && secsUnt <= 60) {
      ph = 'countdown'
    } else if (secsSince >= 0 && secsSince < 180) {
      ph = 'prayer'
    }

    return { nextPrayer: nextPr, phase: ph, secsUntil: secsUnt }
  }, [prayerTimes, now])

  // Determine effective phase and values (test mode overrides real values)
  const effectivePhase = testMode !== 'off' ? testMode : phase
  const effectiveSecsUntil = testMode === 'countdown' ? testCountdown : secsUntil
  const effectivePrayerName = testMode !== 'off' ? 'Test Prayer' : nextPrayer?.name || ''

  // Don't render if not in any active state
  const shouldShow = testMode !== 'off' || (phase !== 'idle' && nextPrayer)

  if (isLoading) {
    return null
  }

  const countdownProgress = Math.max(0, Math.min(1, effectiveSecsUntil / (testMode === 'countdown' ? 10 : 60)))

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key={testMode !== 'off' ? 'test' : 'real'}
          className="prayer-overlay-root"
          data-phase={effectivePhase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.5 }}
          aria-label={effectivePrayerName + ' prayer'}
        >
          <svg className="prayer-overlay-arch" viewBox="0 0 1000 900" fill="none" aria-hidden="true" focusable="false">
            <path className="prayer-overlay-arch-fill" d="M30 900V460C30 235 350 185 500 35C650 185 970 235 970 460V900Z" />
            <path d="M30 900V460C30 235 350 185 500 35C650 185 970 235 970 460V900M65 900V470C65 258 359 213 500 76C641 213 935 258 935 470V900" />
          </svg>

          <div className="prayer-overlay-brand"><span>Al-Judi Masjid</span></div>

          <div className="prayer-overlay-content">
            <p className="prayer-overlay-eyebrow">Congregational prayer</p>
            <h2 className="prayer-overlay-name">{effectivePrayerName}</h2>
            <div className="prayer-overlay-phase">
              <AnimatePresence initial={false} mode="wait">
                {effectivePhase === 'countdown' ? (
                  <motion.div
                    key="countdown"
                    className="prayer-overlay-countdown"
                    initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.25 }}
                  >
                    <svg className="prayer-overlay-ring" viewBox="0 0 340 340" fill="none" aria-hidden="true" focusable="false">
                      <circle className="prayer-overlay-ring-track" cx="170" cy="170" r="159" />
                      <circle
                        className="prayer-overlay-ring-progress"
                        cx="170" cy="170" r="159" pathLength="1"
                        strokeDasharray="1" strokeDashoffset={1 - countdownProgress}
                        transform="rotate(-90 170 170)"
                      />
                    </svg>
                    <div className="prayer-overlay-timer" role="timer" aria-live="off" aria-label={effectivePrayerName + ' starts in ' + effectiveSecsUntil + ' seconds'}>
                      <span className="prayer-overlay-number" aria-hidden="true">{effectiveSecsUntil}</span>
                      <span className="prayer-overlay-seconds" aria-hidden="true">seconds to begin</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="prayer"
                    className="prayer-overlay-in-progress"
                    initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.35 }}
                    role="status"
                  >
                    <div className="prayer-overlay-status">Prayer in progress</div>
                    <p>Please keep the prayer hall quiet.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="prayer-overlay-reminder">
            <PhoneSilentIcon />
            <span>Please silence or switch off your phone</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export default PrayerOverlay
