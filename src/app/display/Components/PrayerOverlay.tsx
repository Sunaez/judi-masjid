// src/app/display/Components/PrayerOverlay.tsx
'use client'

import {
  AnimatePresence,
  motion,
  useAnimation,
  usePresence,
} from 'motion/react'
import { useEffect, useState, ReactNode, useMemo, memo } from 'react'
import { usePrayerTimesContext } from '../context/PrayerTimesContext'

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

const PrayerOverlay = memo(function PrayerOverlay() {
  const { prayerTimes: rawTimes, isLoading } = usePrayerTimesContext()

  // ─── State: "now" ───────────────────────────────────────────
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

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

  if (isLoading || !prayerTimes || !nextPrayer || phase === 'idle') {
    return null
  }

  return (
    <AnimatePresence>
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
              {`${nextPrayer.name} in progress`}
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
            font-size: 6vw;
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
    </AnimatePresence>
  )
})

function ShrinkingOverlay({ children }: { children: ReactNode }) {
  const [isPresent, safeToRemove] = usePresence()

  const variants = useMemo(() => ({
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

const GradientOverlay = memo(function GradientOverlay() {
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
})

export default PrayerOverlay
