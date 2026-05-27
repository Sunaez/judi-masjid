'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'

import {
  EID_AL_ADHA_NOTICE_END_MS,
  EID_AL_ADHA_NOTICE_START_MS,
  isEidAlAdhaPrayerNoticeActive,
} from '@/lib/eidPrayerNotice'

export default function EidSalahNotice() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const nowMs = Date.now()
    const timeoutIds: number[] = []

    setIsVisible(isEidAlAdhaPrayerNoticeActive(nowMs))

    if (nowMs < EID_AL_ADHA_NOTICE_START_MS) {
      timeoutIds.push(
        window.setTimeout(
          () => setIsVisible(true),
          EID_AL_ADHA_NOTICE_START_MS - nowMs
        )
      )
    }

    if (nowMs < EID_AL_ADHA_NOTICE_END_MS) {
      timeoutIds.push(
        window.setTimeout(
          () => setIsVisible(false),
          EID_AL_ADHA_NOTICE_END_MS - nowMs
        )
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
        className="mx-auto max-w-6xl rounded-3xl border border-[var(--accent-color)]/25 bg-[var(--background-start)]/90 px-5 py-5 shadow-[0_18px_40px_rgba(21,49,71,0.12)] backdrop-blur-sm"
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_minmax(320px,480px)] lg:items-stretch">
          <div className="flex flex-col gap-3">
            <div
              className="inline-flex w-fit items-center rounded-full bg-[var(--accent-color)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--background-end)]"
            >
              Eid al-Adha notice
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-[var(--text-color)]">
                Eid al-Adha Prayer at Summerfield Park
              </h2>

              <p className="text-base leading-7 text-[var(--text-color)]">
                Eid al-Adha Prayer will take place at Summerfield Park at 9:00am.
              </p>

              <p className="text-base leading-7 text-[var(--text-color)]">
                Brothers and sisters are welcome.
              </p>

              <div className="grid gap-4 rounded-2xl border border-[var(--accent-color)]/20 bg-[var(--background-end)]/35 p-4 sm:grid-cols-[132px_1fr] sm:items-center">
                <div className="relative h-32 overflow-hidden rounded-xl border border-[var(--accent-color)]/15 bg-[var(--background-start)]">
                  <Image
                    src="/PrayerMat.jpeg"
                    alt="Prayer mat"
                    fill
                    sizes="(min-width: 640px) 132px, 100vw"
                    className="object-cover"
                  />
                </div>

                <div className="space-y-3">
                  <p
                    dir="rtl"
                    className="text-right text-base leading-8 text-[var(--text-color)]"
                  >
                    برایان و خوشکانی بەڕێز، بۆ نوێژی جەژن لە پارکی سومەرفیڵد
                    تکایە هەر یەکە و بەرماڵێك لەگەڵ خۆیدا بێنێ. کاتژمێر ٩
                  </p>

                  <p className="text-base leading-7 text-[var(--text-color)]">
                    Dear brothers and sisters, for the Eid al-Adha prayer at
                    Summerfield Park, please bring a prayer mat with you
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="min-h-[260px] overflow-hidden rounded-2xl border border-[var(--accent-color)]/20 bg-[var(--background-end)]/40"
            aria-label="Summerfield Park map"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4017.7106427106723!2d-1.9409240605776887!3d52.48623845872842!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4870bd2d20add84f%3A0x2d6e8cd7a26221a4!2sSummerfield%20Park!5e1!3m2!1sen!2suk!4v1779802694730!5m2!1sen!2suk"
              width="600"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Summerfield Park map"
              className="h-full min-h-[260px] w-full"
            />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
