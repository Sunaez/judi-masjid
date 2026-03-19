'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

const NOTICE_START_MS = Date.parse('2026-03-19T00:00:00Z')
const NOTICE_END_MS = Date.parse('2026-03-21T00:00:00Z')
const SUMMERFIELD_PARK_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Summerfield+Park,+Birmingham+B16+0HG'

function isNoticeActive(nowMs: number) {
  return nowMs >= NOTICE_START_MS && nowMs < NOTICE_END_MS
}

export default function EidSalahNotice() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const nowMs = Date.now()
    const timeoutIds: number[] = []

    setIsVisible(isNoticeActive(nowMs))

    if (nowMs < NOTICE_START_MS) {
      timeoutIds.push(
        window.setTimeout(() => setIsVisible(true), NOTICE_START_MS - nowMs)
      )
    }

    if (nowMs < NOTICE_END_MS) {
      timeoutIds.push(
        window.setTimeout(() => setIsVisible(false), NOTICE_END_MS - nowMs)
      )
    }

    return () => {
      timeoutIds.forEach(timeoutId => window.clearTimeout(timeoutId))
    }
  }, [])

  if (!isVisible) return null

  return (
    <section className="px-6 pt-5">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="rounded-3xl border border-[var(--accent-color)]/20 bg-[var(--background-start)]/90 px-5 py-5 shadow-[0_18px_40px_rgba(21,49,71,0.12)] backdrop-blur-sm"
      >
        <div className="flex flex-col gap-3">
          <div
            className="inline-flex w-fit items-center rounded-full bg-[var(--accent-color)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--background-end)]"
          >
            Eid salah
          </div>

          <p className="text-base leading-7 text-[var(--text-color)]">
            The Eid salah will take place at 08:30AM at{' '}
            <a
              href={SUMMERFIELD_PARK_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--accent-color)] underline underline-offset-4 hover:opacity-80"
            >
              Summerfield Park, Birmingham B16 0HG
            </a>
            .
          </p>

          <p className="text-base leading-7 text-[var(--text-color)]">
            The prayer area will be the centre of the park, with brothers wearing high vis
            vests to guide everyone to the correct location.
          </p>

          <p className="text-base leading-7 text-[var(--text-color)]">
            <strong>
              Everyone is kindly requested to bring their own prayer mats or rugs.
            </strong>
          </p>

          <p className="text-base leading-7 text-[var(--text-color)]">
            JazakAllah khair.{' '}
            {'\u062c\u0632\u0627\u0643\u0645 \u0627\u0644\u0644\u0647 \u062e\u064a\u0631\u0627\u064b'}
          </p>
        </div>
      </motion.div>
    </section>
  )
}
