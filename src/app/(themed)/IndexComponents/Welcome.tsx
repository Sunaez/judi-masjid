'use client'

import { useEffect, useMemo, useState } from 'react'
import gsap from 'gsap'
import { IoChatbox } from 'react-icons/io5'

import { usePrayerTimesContext } from '../../display/context/PrayerTimesContext'

function splitToChars(text: string): string[] {
  return text.split('').map(char => (char === ' ' ? '\u00A0' : char))
}

function splitToWords(text: string): string[] {
  return text.trim().split(/\s+/)
}

export default function Welcome() {
  const [fontsReady, setFontsReady] = useState(false)
  const { isEidAlFitr } = usePrayerTimesContext()

  const englishLine1 = useMemo(() => splitToChars('Welcome to'), [])
  const englishLine2 = useMemo(() => splitToChars('Al-judi Masjid'), [])
  const arabicLine1 = useMemo(() => splitToWords('بەخێر بێن بۆ'), [])
  const arabicLine2 = useMemo(() => splitToWords('مزگەوتی جودی'), [])

  useEffect(() => {
    document.fonts.ready.then(() => {
      setFontsReady(true)
    })
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
  }, [fontsReady, isEidAlFitr])

  return (
    <div className={`flex-1 space-y-4 p-4 ${fontsReady ? 'opacity-100' : 'opacity-0'}`}>
      <h1
        className="text-4xl font-bold text-[var(--text-color)]"
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
        className="arabic text-[var(--text-color)]"
        dir="rtl"
        aria-label="بەخێر بێن بۆ مزگەوتی جودی"
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

      {isEidAlFitr && (
        <div className="eid-badge inline-flex w-fit items-center rounded-full border border-[var(--accent-color)]/40 bg-[var(--secondary-color)]/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-color)] shadow-lg">
          Eid Mubarak
        </div>
      )}

      <div className="feedback-box mt-6 rounded-2xl bg-[var(--background-start)] p-4 text-center shadow-lg dark:bg-[var(--background-end)]">
        <a
          href="https://forms.gle/o2PUq1vq3QDomWKk9"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto inline-flex items-center rounded-lg bg-[var(--accent-color)] px-4 py-2 text-[var(--background-end)] shadow transition-all duration-200 hover:scale-110"
        >
          <IoChatbox className="mr-2 h-5 w-5" />
          Add feedback
        </a>
        <p className="mt-2 text-sm text-[var(--text-color)]">
          You can talk about adding a new Quran verse that you would like to see, something you would like to see change, anything you are unhappy with.
        </p>
      </div>

      <style jsx>{`
        .char {
          word-break: keep-all;
        }
      `}</style>
    </div>
  )
}
