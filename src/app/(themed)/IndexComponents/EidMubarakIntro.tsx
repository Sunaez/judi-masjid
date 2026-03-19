'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import EidLanternBackdrop from '@/components/EidLanternBackdrop'

const INTRO_DURATION_MS = 3400

type EidMubarakIntroProps = {
  active: boolean
}

export default function EidMubarakIntro({ active }: EidMubarakIntroProps) {
  const [visible, setVisible] = useState(active)

  useEffect(() => {
    setVisible(active)
    if (!active) return

    const timeoutId = window.setTimeout(() => {
      setVisible(false)
    }, INTRO_DURATION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [active])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[linear-gradient(180deg,rgba(13,33,46,0.94),rgba(25,67,83,0.92))] px-6"
        >
          <EidLanternBackdrop className="opacity-95" />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-3xl rounded-[2rem] border border-[rgba(255,220,139,0.34)] bg-[rgba(10,26,36,0.62)] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-md"
          >
            <motion.p
              initial={{ opacity: 0, letterSpacing: '0.35em' }}
              animate={{ opacity: 1, letterSpacing: '0.18em' }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgba(255,224,153,0.9)]"
            >
              Al-judi Masjid
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-4 text-5xl font-black uppercase tracking-[0.08em] text-white sm:text-7xl"
            >
              Eid Mubarak
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-4 text-lg text-[rgba(245,243,234,0.92)] sm:text-2xl"
            >
              Wishing you a happy Eid.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.7 }}
              className="mt-6 text-sm uppercase tracking-[0.16em] text-[rgba(255,224,153,0.82)]"
            >
              From everyone at Al-judi Masjid
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
