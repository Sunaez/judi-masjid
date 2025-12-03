'use client'

import { useEffect, useState, useMemo } from 'react'
import gsap from 'gsap'
import { IoChatbox } from 'react-icons/io5'

// Split text into characters - memoized outside component
function splitToChars(text: string): string[] {
  return text.split('').map(char => char === ' ' ? '\u00A0' : char)
}

// Split text into words - memoized outside component
function splitToWords(text: string): string[] {
  return text.trim().split(/\s+/)
}

export default function Welcome() {
  const [fontsReady, setFontsReady] = useState(false)

  // Pre-split text content - memoized
  const englishLine1 = useMemo(() => splitToChars('Welcome to'), [])
  const englishLine2 = useMemo(() => splitToChars('Al-judi Masjid'), [])
  const arabicLine1 = useMemo(() => splitToWords('بەخێر بێن بۆ'), [])
  const arabicLine2 = useMemo(() => splitToWords('مزگەوتی جودی'), [])

  useEffect(() => {
    // Wait for fonts to load
    document.fonts.ready.then(() => {
      setFontsReady(true)
    })
  }, [])

  useEffect(() => {
    if (!fontsReady) return

    // Animate all chars and feedback together
    const chars = document.querySelectorAll<HTMLSpanElement>('.char')
    const feedback = document.querySelector<HTMLDivElement>('.feedback-box')

    if (chars.length === 0 || !feedback) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(
      [...chars, feedback],
      { opacity: 0, y: 20, scale: (i: number) => (i >= chars.length ? 0.8 : 1) },
      { opacity: 1, y: 0, scale: 1, duration: 1.2, stagger: 0.08 }
    )

    return () => {
      tl.kill()
    }
  }, [fontsReady])

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

      <p
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
      </p>

      <div className="feedback-box mt-6 bg-[var(--background-start)] dark:bg-[var(--background-end)] p-4 rounded-2xl shadow-lg text-center">
        <a
          href="https://forms.gle/o2PUq1vq3QDomWKk9"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center mx-auto px-4 py-2 bg-[var(--accent-color)] text-[var(--background-end)] rounded-lg shadow transform transition-all duration-200 hover:scale-110"
        >
          <IoChatbox className="w-5 h-5 mr-2" />
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
