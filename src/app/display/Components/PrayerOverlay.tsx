// src/app/display/Components/PrayerOverlay.tsx
'use client'

import {
  AnimatePresence,
  motion,
  usePresence,
} from 'motion/react'
import { useEffect, useState, ReactNode, useMemo, memo } from 'react'
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

// Phone icons as SVG components
const PhoneOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="phone-icon">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
    <line x1="22" y1="2" x2="2" y2="22" />
  </svg>
)

const PhoneSilentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="phone-icon">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
    <path d="M8 6h8" />
    <line x1="4" y1="1" x2="20" y2="17" strokeWidth="2" />
  </svg>
)

const PrayerOverlay = memo(function PrayerOverlay() {
  const { prayerTimes: rawTimes, isLoading } = usePrayerTimesContext()
  const { prayerOverlayTestSignal } = useDebugContext()

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

  // AnimatePresence wraps the conditional to enable exit animations
  return (
    <AnimatePresence>
      {shouldShow && (
        <BlurOverlay key={testMode !== 'off' ? 'test' : 'real'}>
          <div className="overlay-content">
            <AnimatePresence initial={false} mode="wait">
              {effectivePhase === 'countdown' ? (
                <motion.div
                  key="countdown"
                  className="countdown-container"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, transition: { duration: 0.3 } }}
                  exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.3 } }}
                >
                  <div className="countdown-number">{effectiveSecsUntil}</div>
                  <div className="countdown-label">{effectivePrayerName} starting soon</div>
                </motion.div>
              ) : (
                <motion.div
                  key="prayer"
                  className="prayer-container"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { duration: 0.4 } }}
                  exit={{ y: -20, opacity: 0, transition: { duration: 0.4 } }}
                >
                  <div className="prayer-name">{effectivePrayerName}</div>
                  <div className="prayer-status">In Progress</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phone reminders */}
            <motion.div
              className="phone-reminders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.4 } }}
            >
              <div className="phone-reminder">
                <PhoneOffIcon />
                <span>Turn off your phone</span>
              </div>
              <div className="phone-reminder">
                <PhoneSilentIcon />
                <span>Or put it on silent</span>
              </div>
            </motion.div>
          </div>

          <style>{`
            .overlay-root {
              position: fixed;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              z-index: 50;
            }

            /* Light mode: light blur overlay */
            .overlay-root {
              background: rgba(245, 228, 211, 0.85);
              backdrop-filter: blur(20px);
            }

            /* Dark mode: dark blur overlay */
            html.dark .overlay-root {
              background: rgba(21, 49, 71, 0.9);
              backdrop-filter: blur(20px);
            }

            .overlay-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 4rem;
              text-align: center;
              z-index: 10;
            }

            .countdown-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1rem;
            }

            .countdown-number {
              font-size: 30vh;
              font-weight: 800;
              line-height: 1;
              color: var(--text-color);
              text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            }

            .countdown-label {
              font-size: 6vh;
              font-weight: 600;
              color: var(--text-color);
              opacity: 0.9;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }

            .prayer-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1.5rem;
            }

            .prayer-name {
              font-size: 20vh;
              font-weight: 800;
              line-height: 1;
              color: var(--text-color);
              text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            }

            .prayer-status {
              font-size: 8vh;
              font-weight: 600;
              color: var(--accent-color);
              text-transform: uppercase;
              letter-spacing: 0.15em;
            }

            .phone-reminders {
              display: flex;
              gap: 4rem;
              margin-top: 2rem;
            }

            .phone-reminder {
              display: flex;
              align-items: center;
              gap: 1.5rem;
              padding: 1.5rem 2.5rem;
              background: var(--secondary-color);
              border-radius: 1rem;
              color: var(--text-color);
              font-size: 2.5vh;
              font-weight: 500;
              opacity: 0.95;
            }

            html.dark .phone-reminder {
              background: rgba(173, 184, 187, 0.2);
            }

            .phone-icon {
              width: 4vh;
              height: 4vh;
              flex-shrink: 0;
            }
          `}</style>
        </BlurOverlay>
      )}
    </AnimatePresence>
  )
})

function BlurOverlay({ children }: { children: ReactNode }) {
  const [isPresent, safeToRemove] = usePresence()

  const variants = useMemo(() => ({
    open: {
      clipPath: 'circle(150% at 50% 100%)',
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
    closed: {
      clipPath: 'circle(0% at 50% 100%)',
      opacity: 0,
      transition: { duration: 0.8, ease: 'easeInOut' },
    },
  }), [])

  return (
    <motion.div
      className="overlay-root"
      initial="closed"
      animate="open"
      exit="closed"
      variants={variants}
      style={{ transformOrigin: '50% 100%' }}
      onAnimationComplete={() => {
        if (!isPresent) safeToRemove()
      }}
    >
      {children}
    </motion.div>
  )
}

export default PrayerOverlay
