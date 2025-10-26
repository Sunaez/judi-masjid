// src/app/display/Components/Rotator/Specials/Welcome.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface WelcomeProps {
  displayDuration: number;
}

export default function Welcome({ displayDuration }: WelcomeProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const entryDur  = 0.8;
    const exitDur   = 0.6;
    const totalSec  = displayDuration / 1000;
    const exitDelay = Math.max(0, totalSec - entryDur - exitDur);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1) Animate first Kurdish line (بەخێر بێن بۆ)
      const kurdFirst = rootRef.current?.querySelectorAll<HTMLElement>(
        '.kurdish-first .word'
      ) ?? [];
      tl.from(kurdFirst, {
        autoAlpha: 0,
        y: 40,
        stagger: 0.15,
        duration: entryDur / kurdFirst.length,
        ease: 'power2.out',
      });

      // 2) Animate second Kurdish line (مزگەوتی جودی)
      const kurdSecond = rootRef.current?.querySelectorAll<HTMLElement>(
        '.kurdish-second .word'
      ) ?? [];
      tl.from(
        kurdSecond,
        {
          autoAlpha: 0,
          y: 40,
          stagger: 0.15,
          duration: entryDur / kurdSecond.length,
          ease: 'power2.out',
        },
        `-=${entryDur * 0.5}`
      );

      // 3) Animate English welcome
      const engWords = rootRef.current?.querySelectorAll<HTMLElement>(
        '.english-row .word'
      ) ?? [];
      tl.from(
        engWords,
        {
          autoAlpha: 0,
          y: 40,
          stagger: 0.15,
          duration: entryDur / engWords.length,
          ease: 'power2.out',
        },
        `-=${entryDur * 0.5}`
      );

      // 4) Fade in Jummah time & link
      const jumm = rootRef.current?.querySelector<HTMLElement>('.jummah-row');
      const link = rootRef.current?.querySelector<HTMLElement>('.link-row');
      if (jumm && link) {
        tl.from(
          [jumm, link],
          {
            autoAlpha: 0,
            y: 20,
            duration: 0.6,
            ease: 'power2.out',
            stagger: 0.1,
          },
          `-=${0.3}`
        );
      }

      // 5) Exit all at once after delay
      const allLines = rootRef.current?.querySelectorAll<HTMLElement>('.line') ?? [];
      tl.to(
        allLines,
        {
          autoAlpha: 0,
          y: -30,
          stagger: 0.1,
          duration: exitDur,
          ease: 'power2.in',
        },
        exitDelay + entryDur
      );
      tl.to(
        rootRef.current,
        { autoAlpha: 0, duration: 0.3, ease: 'power1.in' },
        exitDelay + entryDur + exitDur - 0.3
      );
    }, rootRef);

    return () => ctx.revert();
  }, [displayDuration]);

  // words arrays
  const kurdishFirst  = ['بەخێر', 'بێن', 'بۆ'];
  const kurdishSecond = ['مزگەوتی', 'جودی'];
  const english       = ['Welcome', 'to'];

  return (
    <div
      ref={rootRef}
      className="w-full h-full grid grid-cols-2 gap-8 p-8 text-center"
      style={{
        background: 'linear-gradient(var(--background-start), var(--background-end))',
        color: 'var(--text-color)',
      }}
    >
      {/* Left column: Kurdish in two lines */}
      <div
        className="line flex flex-col justify-center items-center"
        dir="rtl"
      >
        <div className="kurdish-first text-8xl font-extrabold flex flex-wrap justify-center mb-2">
          {kurdishFirst.map((w, i) => (
            <span key={i} className="word inline-block mx-2">
              {w}
            </span>
          ))}
        </div>
        <div className="kurdish-second text-8xl font-extrabold flex flex-wrap justify-center">
          {kurdishSecond.map((w, i) => (
            <span
              key={i}
              className="word inline-block mx-2"
              style={{ color: 'var(--accent-color)' }}
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* Right column: English welcome */}
      <div className="line english-row text-7xl font-bold flex flex-wrap justify-center items-center">
        {english.map((w, i) => (
          <span key={i} className="word inline-block mr-2">
            {w}
          </span>
        ))}
        <span className="word inline-block">
          <strong style={{ color: 'var(--accent-color)' }}>Al-judi Masjid</strong>
        </span>
      </div>

      {/* Jummah time (spans both) */}
      <div className="line jummah-row col-span-2 text-6xl font-semibold">
        Masjid Jummah time is at{' '}
        <strong style={{ color: 'var(--accent-color)' }}>12:45</strong>
      </div>

      {/* Website link (spans both) */}
      <div
        className="line link-row col-span-2 text-3xl underline"
        style={{ textDecorationColor: 'var(--secondary-color)' }}
      >
        <a
          href="https://www.aljudi-masjid.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--secondary-color)' }}
        >
          aljudi-masjid.co.uk
        </a>
      </div>
    </div>
  );
}
