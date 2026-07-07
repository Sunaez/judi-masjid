'use client'

import { useEffect, useMemo, useState } from 'react'
import gsap from 'gsap'
import { IoChatbox } from 'react-icons/io5'

import { usePrayerTimesContext } from '../../display/context/PrayerTimesContext'

const KURDISH_LINE_1 = '\u0628\u06d5\u062e\u06ce\u0631 \u0628\u06ce\u0646 \u0628\u06c6'
const KURDISH_LINE_2 = '\u0645\u0632\u06af\u06d5\u0648\u062a\u06cc \u062c\u0648\u062f\u06cc'

function splitToChars(text: string): string[] {
  return text.split('').map(char => (char === ' ' ? '\u00A0' : char))
}

function splitToWords(text: string): string[] {
  return text.trim().split(/\s+/)
}

export default function Welcome() {
  const [fontsReady, setFontsReady] = useState(false)
  const { isEid } = usePrayerTimesContext()

  const englishLine1 = useMemo(() => splitToChars('Welcome to'), [])
  const englishLine2 = useMemo(() => splitToChars('Al-judi Masjid'), [])
  const arabicLine1 = useMemo(() => splitToWords(KURDISH_LINE_1), [])
  const arabicLine2 = useMemo(() => splitToWords(KURDISH_LINE_2), [])

  useEffect(() => {
    if (!document.fonts?.ready) {
      setFontsReady(true)
      return
    }

    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  useEffect(() => {
    if (!fontsReady) return

    const chars = document.querySelectorAll<HTMLSpanElement>('.char')
    const feedback = document.querySelector<HTMLDivElement>('.feedback-box')
    const eidBadge = document.querySelector<HTMLDivElement>('.eid-badge')
    const animatedExtras = [feedback, eidBadge].filter(Boolean)

    if (chars.length === 0 || !feedback) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(
      [...chars, ...animatedExtras],
      { opacity: 0, y: 20, scale: (index: number) => (index >= chars.length ? 0.8 : 1) },
      { opacity: 1, y: 0, scale: 1, duration: 1.2, stagger: 0.08 }
    )

    return () => {
      tl.kill()
    }
  }, [fontsReady, isEid])

  return (
    <section className={`flex min-h-full flex-col justify-between rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-5 shadow-xl transition-opacity sm:p-6 lg:p-8 ${fontsReady ? 'opacity-100' : 'opacity-0'}`}>
      <div>
        <h1
          className="text-4xl font-bold leading-tight text-[var(--text-color)] sm:text-5xl"
          aria-label="Welcome to Al-judi Masjid"
        >
          <div>
            {englishLine1.map((char, idx) => (
              <span key={idx} className="char inline-block will-change-transform">
                {char}
              </span>
            ))}
          </div>
          <div className="text-[var(--accent-color)]">
            {englishLine2.map((char, idx) => (
              <span key={idx} className="char inline-block will-change-transform">
                {char}
              </span>
            ))}
          </div>
        </h1>

        <div
          className="arabic mt-5 text-[var(--text-color)]"
          dir="rtl"
          aria-label={`${KURDISH_LINE_1} ${KURDISH_LINE_2}`}
        >
          <div>
            {arabicLine1.map((word, idx) => (
              <span key={idx} className="char inline-block will-change-transform">
                {word}
                {idx < arabicLine1.length - 1 && '\u00A0'}
              </span>
            ))}
          </div>
          <div className="text-[var(--accent-color)]">
            {arabicLine2.map((word, idx) => (
              <span key={idx} className="char inline-block will-change-transform">
                {word}
                {idx < arabicLine2.length - 1 && '\u00A0'}
              </span>
            ))}
          </div>
        </div>

        {isEid && (
          <div className="eid-badge mt-5 inline-flex w-fit items-center rounded-full border border-[var(--accent-color)]/40 bg-[var(--secondary-color)]/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-color)] shadow-lg">
            Eid Mubarak
          </div>
        )}
      </div>

      <div className="feedback-box mt-6 rounded-lg border border-[var(--secondary-color)] bg-[var(--background-start)] p-4 text-center shadow-sm dark:bg-[var(--background-end)]">
        <a
          href="https://forms.gle/o2PUq1vq3QDomWKk9"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto inline-flex min-h-11 items-center rounded-lg bg-[var(--accent-color)] px-4 py-2 font-semibold text-[var(--background-end)] shadow transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-start)]"
        >
          <IoChatbox className="mr-2 h-5 w-5" />
          Add feedback
        </a>
        <p className="mt-3 text-sm leading-6 text-[var(--text-color)]">
          Suggest a Quran verse, site improvement, or anything that needs attention.
        </p>
      </div>

      <style jsx>{`
        .char {
          word-break: keep-all;
        }
      `}</style>
    </section>
  )
}
