// src/app/display/Components/Rotator/Specials/Feedback.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface FeedbackProps {
  displayDuration: number;
}

export default function Feedback({ displayDuration }: FeedbackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLImageElement>(null);

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

      // Fade in QR shortly after
      tl.from(
        qrRef.current,
        { autoAlpha: 0, scale: 0.95, duration: entryDur * 0.8, ease: 'power2.out' },
        `-=${entryDur * 0.5}`
      );

      // Idle: gentle pulse on QR
      tl.to(
        qrRef.current,
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
      {/* Left column: heading + subtitle */}
      <div className="flex flex-col justify-center items-center md:items-start space-y-4">
        <h2
          className="text-8xl font-bold"
          style={{ color: 'var(--text-color)' }}
        >
          We Value Your Feedback
        </h2>
        <p
          className="text-3xl"
          style={{ color: 'var(--text-color)' }}
        >
          Scan the QR code →
        </p>
      </div>

      {/* Right column: oversized QR */}
      <div className="flex items-center justify-center">
        <img
          ref={qrRef}
          src="/FeedbackQR.svg"
          alt="Feedback QR Code"
          className="w-96 h-96"
          style={{
            backgroundColor: 'var(--secondary-color)',
            padding: '1rem',
            borderRadius: '1rem',
          }}
        />
      </div>
    </div>
  );
}
