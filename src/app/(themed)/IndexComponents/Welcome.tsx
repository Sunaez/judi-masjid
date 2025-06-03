// src/app/IndexComponents/Welcome.tsx
// Reference: https://codepen.io/GreenSock/pen/mdZoVKb
'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Welcome() {
  const containerRef = useRef<HTMLDivElement>(null)
  const headingRef   = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.fonts.ready.then(() => {
      const container = containerRef.current!
      const heading   = headingRef.current!
      const arabic    = container.querySelector<HTMLParagraphElement>('p.arabic')!

      // split English heading into individual characters
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

      // split Arabic into whole words so letters remain in one text node (and stay joined)
      const splitToWords = (el: HTMLElement) => {
        const txt = el.textContent || ''
        el.textContent = ''
        const words = txt.trim().split(/\s+/)
        words.forEach((word, i) => {
          const span = document.createElement('span')
          span.textContent = word
          span.className   = 'char'
          el.appendChild(span)
          // re-add spaces between words
          if (i < words.length - 1) {
            el.appendChild(document.createTextNode(' '))
          }
        })
      }

      // perform splits
      splitToChars(heading)
      splitToWords(arabic)

      // now reveal
      container.style.visibility = 'visible'

      // animate every .char (letters in English, words in Arabic)
      const chars = container.querySelectorAll<HTMLSpanElement>('.char')
      gsap.fromTo(
        chars,
        { opacity: 0, y: 20 },
        {
          opacity:   1,
          y:         0,
          ease:      'power3.out',
          duration:  1.2,
          stagger:   0.08,
        }
      )
    })
  }, [])

  return (
    <>
      <div
        ref={containerRef}
        className="flex-1 space-y-4"
        style={{ visibility: 'hidden' }}
      >
        <h1
          ref={headingRef}
          className="text-4xl font-bold"
          aria-label="Welcome to Al-judi Masjid"
        >
          Welcome to Al-judi Masjid
        </h1>
        <p
          className="arabic"
          dir="rtl"
          aria-label="بەخێر بێن بۆ مزگەوتی جودی"
        >
          بەخێر بێن بۆ مزگەوتی جودی
        </p>
      </div>

      <style>{`
        /* animate each chunk (letter or word) separately */
        .char {
          display: inline-block;
          will-change: transform, opacity;
        }
      `}</style>
    </>
  )
}
