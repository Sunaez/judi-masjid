'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface TarawehProps {
  displayDuration: number;
  tarawehTime: string;
}

export default function Taraweh({ displayDuration, tarawehTime }: TarawehProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const entryDur = 0.8;
    const exitDur = 0.6;
    const totalSec = displayDuration / 1000;
    const idleSec = Math.max(0, totalSec - entryDur - exitDur);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.from('.taraweh-title', {
        autoAlpha: 0,
        y: 30,
        duration: entryDur,
        ease: 'power2.out',
      });

      tl.from(
        '.taraweh-time',
        {
          autoAlpha: 0,
          scale: 0.9,
          duration: entryDur,
          ease: 'back.out(1.3)',
        },
        '-=0.5'
      );

      tl.to(
        '.taraweh-time',
        {
          y: -8,
          repeat: 1,
          yoyo: true,
          duration: idleSec / 2 || 0.4,
          ease: 'sine.inOut',
        },
        `+=${idleSec / 4}`
      );

      tl.to(
        ['.taraweh-title', '.taraweh-time'],
        {
          autoAlpha: 0,
          y: -20,
          duration: exitDur,
          ease: 'power1.in',
          stagger: 0.1,
        },
        `+=${idleSec / 2}`
      );
    }, rootRef);

    return () => ctx.revert();
  }, [displayDuration]);

  return (
    <div
      ref={rootRef}
      className="w-full h-full flex flex-col items-center justify-center text-center gap-10"
      style={{ color: 'var(--text-color)' }}
    >
      <h2 className="taraweh-title text-8xl font-bold">
        Taraweh Starts At
      </h2>
      <div
        className="taraweh-time rounded-3xl px-16 py-10 text-9xl font-extrabold"
        style={{
          backgroundColor: 'var(--accent-color)',
          color: 'var(--background-end)',
          boxShadow: '0 12px 30px var(--shadow-color)',
        }}
      >
        {tarawehTime}
      </div>
    </div>
  );
}
