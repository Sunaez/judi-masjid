// src/app/display/Components/Rotator/Specials/Feedback.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface FeedbackProps {
  displayDuration: number;
}

const FEEDBACK_URL = 'https://your-mosque-website.com/feedback';

export default function Feedback({ displayDuration }: FeedbackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const entryDur = 0.8;
    const exitDur = 0.6;
    const totalSec = displayDuration / 1000;
    const idleDur = Math.max(0, totalSec - entryDur - exitDur);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Entry: container fades/slides up
      tl.from(containerRef.current, {
        autoAlpha: 0,
        y: 20,
        duration: entryDur,
        ease: 'power2.out',
      });

      // Fade in the link text
      tl.from(
        linkRef.current,
        { autoAlpha: 0, y: 10, duration: entryDur * 0.8, ease: 'power2.out' },
        `-=${entryDur * 0.5}`
      );

      // Idle: gentle pulse on the link text
      tl.to(
        linkRef.current,
        { scale: 1.02, repeat: 1, yoyo: true, duration: idleDur / 2, ease: 'sine.inOut' },
        `+=${idleDur / 4}`
      );

      // Exit: container fades/slides down
      tl.to(
        containerRef.current,
        { autoAlpha: 0, y: -20, duration: exitDur, ease: 'power1.in' },
        `+=${idleDur / 2}`
      );
    }, containerRef);

    return () => ctx.revert();
  }, [displayDuration]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full grid grid-cols-1 md:grid-cols-2 items-center p-12 gap-8"
      style={{
        backgroundImage: 'linear-gradient(var(--background-start), var(--background-end))',
      }}
    >
      {/* Left column: heading + instruction */}
      <div className="flex flex-col justify-center items-center md:items-start space-y-4">
        <h2 className="text-8xl font-bold" style={{ color: 'var(--text-color)' }}>
          We Value Your Feedback
        </h2>
        <p
          ref={linkRef}
          className="text-3xl text-center md:text-left"
          style={{ color: 'var(--text-color)' }}
        >
          Please visit www.aljudi-masjid.co.uk to share any ideas you have.
        </p>
      </div>

      {/* Right column: a simple icon or illustration (optional) */}
      <div className="flex items-center justify-center">
        {/* You can drop in a static “feedback” icon or illustration here */}
        <svg
          width="192"
          height="192"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    </div>
  );
}
