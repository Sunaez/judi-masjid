'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface WelcomeProps {
  displayDuration: number;
  greetingText?: string;
}

export default function Welcome({ displayDuration, greetingText }: WelcomeProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const entryDur = 0.8;
    const exitDur = 0.6;
    const totalSec = displayDuration / 1000;
    const exitDelay = Math.max(0, totalSec - entryDur - exitDur);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      const kurdFirst =
        rootRef.current?.querySelectorAll<HTMLElement>('.kurdish-first .word') ?? [];
      tl.from(kurdFirst, {
        autoAlpha: 0,
        y: 40,
        stagger: 0.15,
        duration: entryDur / kurdFirst.length,
        ease: 'power2.out',
      });

      const kurdSecond =
        rootRef.current?.querySelectorAll<HTMLElement>('.kurdish-second .word') ?? [];
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

      const engWords =
        rootRef.current?.querySelectorAll<HTMLElement>('.english-row .word') ?? [];
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

      const greeting = rootRef.current?.querySelector<HTMLElement>('.greeting-row');
      const jummah = rootRef.current?.querySelector<HTMLElement>('.jummah-row');
      const link = rootRef.current?.querySelector<HTMLElement>('.link-row');
      const details = [greeting, jummah, link].filter(Boolean) as HTMLElement[];

      if (details.length > 0) {
        tl.from(
          details,
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
  }, [displayDuration, greetingText]);

  const kurdishFirst = ['بەخێر', 'بێن', 'بۆ'];
  const kurdishSecond = ['مزگەوتی', 'جودی'];
  const english = ['Welcome', 'to'];

  return (
    <div
      ref={rootRef}
      className="grid h-full w-full grid-cols-2 gap-8 p-8 text-center"
      style={{
        color: 'var(--text-color)',
      }}
    >
      <div className="line flex flex-col items-center justify-center" dir="rtl">
        <div className="kurdish-first mb-2 flex flex-wrap justify-center text-8xl font-extrabold">
          {kurdishFirst.map((word, index) => (
            <span key={index} className="word mx-2 inline-block">
              {word}
            </span>
          ))}
        </div>
        <div className="kurdish-second flex flex-wrap justify-center text-8xl font-extrabold">
          {kurdishSecond.map((word, index) => (
            <span
              key={index}
              className="word mx-2 inline-block"
              style={{ color: 'var(--accent-color)' }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      <div className="line english-row flex flex-wrap items-center justify-center text-7xl font-bold">
        {english.map((word, index) => (
          <span key={index} className="word mr-2 inline-block">
            {word}
          </span>
        ))}
        <span className="word inline-block">
          <strong style={{ color: 'var(--accent-color)' }}>Al-judi Masjid</strong>
        </span>
      </div>

      {greetingText && (
        <div className="line greeting-row col-span-2 text-6xl font-bold uppercase tracking-wide">
          <span style={{ color: 'var(--accent-color)' }}>{greetingText}</span>
        </div>
      )}

      <div className="line jummah-row col-span-2 text-6xl font-semibold">
        Masjid Jummah time is at{' '}
        <strong style={{ color: 'var(--accent-color)' }}>12:45</strong>
      </div>

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
