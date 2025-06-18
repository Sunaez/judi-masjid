'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { IoChatbox } from 'react-icons/io5'

export default function Welcome() {
  const containerRef = useRef<HTMLDivElement>(null)
  const headingRef   = useRef<HTMLHeadingElement>(null)
  const feedbackRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.fonts.ready.then(() => {
      const container = containerRef.current!
      const heading   = headingRef.current!
      const arabic    = container.querySelector<HTMLParagraphElement>('p.arabic')!
      const feedback  = feedbackRef.current!

      // split English heading into individual characters per line
      const splitToChars = (el: HTMLElement) => {
        const txt = el.textContent || ''
        el.textContent = ''
        txt.split('').forEach(char => {
          if (char === ' ') {
            el.appendChild(document.createTextNode(' '))
          } else {
            const span = document.createElement('span')
            span.textContent = char
            span.className   = 'char'
            el.appendChild(span)
          }
        })
      }

      // split Arabic into whole words per line
      const splitToWords = (el: HTMLElement) => {
        const txt = el.textContent || ''
        el.textContent = ''
        const words = txt.trim().split(/\s+/)
        words.forEach((word, i) => {
          const span = document.createElement('span')
          span.textContent = word
          span.className   = 'char'
          el.appendChild(span)
          if (i < words.length - 1) el.appendChild(document.createTextNode(' '))
        })
      }

      // perform splits on each line
      heading.querySelectorAll('div').forEach(splitToChars)
      arabic.querySelectorAll('div').forEach(splitToWords)

      // reveal container
      container.style.visibility = 'visible'

      // animate chars and feedback together
      const chars = container.querySelectorAll<HTMLSpanElement>('.char')
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(
        [ ...chars, feedback ],
        { opacity: 0, y: 20, scale: (i: any) => (i >= chars.length ? 0.8 : 1) },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, stagger: 0.08 }
      )
    })
  }, [])

  return (
    <>
      <div
        ref={containerRef}
        className="flex-1 space-y-4 p-4"
        style={{ visibility: 'hidden' }}
      >
        <h1
          ref={headingRef}
          className="text-4xl font-bold text-[var(--text-color)]"
          aria-label="Welcome to Al-judi Masjid"
        >
          <div>Welcome to</div>
          <div className="text-[var(--accent-color)]">Al-judi Masjid</div>
        </h1>
        <p
          className="arabic text-[var(--text-color)]"
          dir="rtl"
          aria-label="بەخێر بێن بۆ مزگەوتی جودی"
        >
          <div>بەخێر بێن بۆ</div>
          <div className="text-[var(--accent-color)]">مزگەوتی جودی</div>
        </p>

        <div
          ref={feedbackRef}
          className="mt-6 bg-[var(--background-start)] dark:bg-[var(--background-end)] p-4 rounded-2xl shadow-lg text-center"
        >
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
      </div>

      <style>{`
        .char {
          display: inline-block;
          will-change: transform, opacity;
          word-break: keep-all;
        }
      `}</style>
    </>
  )
}
