// src/app/display/Components/PrayerOverlay.tsx
'use client'

import {
  AnimatePresence,
  motion,
  useAnimation,
  usePresence,
} from 'motion/react'
import { useEffect, useState, ReactNode } from 'react'
import { fetchPrayerTimes, RawPrayerTimes } from '../../FetchPrayerTimes'

export default function PrayerOverlay() {
  // ─── State: “now” ───────────────────────────────────────────
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // ─── State: prayer times as Date objects ────────────────────
  const [prayerDates, setPrayerDates] = useState<Date[] | null>(null)

  useEffect(() => {
    async function loadTimes() {
      try {
        const t: RawPrayerTimes = await fetchPrayerTimes()
        // Helper to parse an "HH:MM" string into a Date for today
        const toDate = (ts: string) => {
          const [h, m] = ts.split(':').map(Number)
          const d = new Date()
          d.setHours(h, m, 0, 0)
          return d
        }

        // ── CHANGED HERE: Use the “jamaat” fields (when available) instead of the adhan “start” times
        const dates: Date[] = [
          toDate(t.fajrJamaat),   // was t.fajrStart
          toDate(t.dhuhrJamaat),  // was t.dhuhrStart
          toDate(t.asrJamaat),    // was t.asrStart
          toDate(t.maghrib),      // no maghribJamaat column; leave as-is
          toDate(t.ishaJamaat),   // was t.ishaStart
        ].sort((a, b) => a.getTime() - b.getTime())

        setPrayerDates(dates)
      } catch (e) {
        console.error('Failed to load prayer times:', e)
      }
    }

    loadTimes()
  }, [])

  if (!prayerDates) return null

  // ─── Determine the “current” prayer time to watch ─────────────
  // We want the first prayer time for which now < (time + 165s).
  const WINDOW_MS = 165 * 1000
  const nextPrayerTime: Date | null =
    prayerDates.find(pt => now.getTime() < pt.getTime() + WINDOW_MS) || null

  if (!nextPrayerTime) {
    // No upcoming or in-progress prayer
    return null
  }

  // ─── Compute secsUntil & secsSince relative to nextPrayerTime ─
  const deltaMs = nextPrayerTime.getTime() - now.getTime()
  const secsUntil = Math.ceil(deltaMs / 1000)
  const secsSince = Math.floor(-deltaMs / 1000) // if deltaMs is negative

  // ─── Phase logic: countdown 1–60, prayer 0–164s, else idle ──
  let phase: 'idle' | 'countdown' | 'prayer' = 'idle'
  if (secsUntil >= 1 && secsUntil <= 60) {
    phase = 'countdown'
  } else if (secsSince >= 0 && secsSince < 165) {
    phase = 'prayer'
  }

  return (
    <AnimatePresence>
      {phase !== 'idle' && (
        <ShrinkingOverlay>
          <GradientOverlay />

          <AnimatePresence initial={false} mode="wait">
            {phase === 'countdown' ? (
              <motion.div
                key="countdown"
                className="countdown-text"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, transition: { duration: 0.3 } }}
                exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.3 } }}
              >
                {secsUntil}
              </motion.div>
            ) : (
              <motion.div
                key="prayer"
                className="inprogress-text"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { duration: 0.4 } }}
                exit={{ y: 20, opacity: 0, transition: { duration: 0.4 } }}
              >
                Prayer in progress
              </motion.div>
            )}
          </AnimatePresence>

          <style>{`
            .overlay-root {
              position: fixed;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(0,0,0,0.2);
              color: var(--text-color);
              overflow: hidden;
              z-index: 50;
            }
            .countdown-text {
              font-size: 6vh;
              font-weight: bold;
              color: var(--x-text-color);
              z-index: 10;
            }
            .inprogress-text {
              font-size: 5vh;
              font-weight: 600;
              color: var(--x-text-color);
              z-index: 10;
            }
          `}</style>
        </ShrinkingOverlay>
      )}
    </AnimatePresence>
  )
}

function ShrinkingOverlay({ children }: { children: ReactNode }) {
  const [isPresent, safeToRemove] = usePresence()

  const variants = {
    open: {
      clipPath: 'circle(150% at 50% 100%)',
      opacity: 1,
      backdropFilter: 'blur(8px)',
      transition: { duration: 0.6, ease: 'easeOut' },
    },
    closed: {
      clipPath: 'circle(0% at 50% 100%)',
      opacity: 0,
      backdropFilter: 'blur(0px)',
      transition: { duration: 0.6, ease: 'easeInOut' },
    },
  }

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

function GradientOverlay() {
  const popCtrl     = useAnimation()
  const breatheCtrl = useAnimation()

  useEffect(() => {
    async function play() {
      // 1) pop once on mount
      await popCtrl.start({
        scaleY: [0, 10, 10],
        scaleX: [0, 0, 10],
        opacity: [1, 0.2, 0.2],
        transition: { duration: 0.6, ease: 'easeInOut', times: [0, 0.3, 1] },
      })
      // 2) then breathe forever
      breatheCtrl.start({
        scale: [1, 0.85, 1],
        opacity: [0.2, 0.35, 0.2],
        transition: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
      })
    }
    play()
  }, [popCtrl, breatheCtrl])

  return (
    <div className="gradient-container">
      {/* big pop-blob */}
      <motion.div
        className="expanding-circle"
        initial={{ scaleX: 0, scaleY: 0, opacity: 1 }}
        animate={popCtrl}
        exit={{
          scaleY: 0,
          scaleX: 0,
          opacity: 0,
          transition: { duration: 0.6, ease: 'easeInOut' },
        }}
      />

      {/* breathing blobs for each CSS var */}
      {['bg-start','bg-end','text-color','accent-color','secondary-color'].map(cls => (
        <motion.div
          key={cls}
          className={`gradient-circle ${cls}`}
          initial={{ scale: 1, opacity: 0.2 }}
          animate={breatheCtrl}
          exit={{
            scale: 0,
            opacity: 0,
            transition: { duration: 0.6, ease: 'easeInOut' },
          }}
        />
      ))}

      <style>{`
        .gradient-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 1;
          pointer-events: none;
        }
        .expanding-circle {
          position: absolute;
          left: 50%;
          bottom: 0;
          width: 33vh;
          height: 33vh;
          margin-left: -16.5vh;
          border-radius: 50%;
          background: var(--x-background-start);
          filter: blur(10px);
          transform-origin: 50% 100%;
        }
        .gradient-circle {
          position: absolute;
          width: 200vh;
          aspect-ratio: 1;
          border-radius: 50%;
          filter: blur(100px);
        }
        .bg-start        { top: -100vh; left: -100vw; background: var(--x-background-start); }
        .bg-end          { top: -100vh; right: -100vw; background: var(--x-background-end); }
        .text-color      { bottom: -80vh; left: -80vw; background: var(--text-color); }
        .accent-color    { bottom: -60vh; right: -60vw; background: var(--x-accent-color); }
        .secondary-color { top: 30vh;  left: 50vw;   background: var(--secondary-color); }
      `}</style>
    </div>
  )
}
