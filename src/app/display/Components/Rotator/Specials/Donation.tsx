// src/app/display/Components/Rotator/Specials/Donation.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface DonationProps {
  displayDuration: number;
}

export default function Donation({ displayDuration }: DonationProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const entryDur = 0.8;
    const exitDur  = 0.6;
    const totalSec = displayDuration / 1000;
    // ensure exit starts no earlier than after entry
    const exitStart = Math.max(totalSec - exitDur, entryDur + 0.1);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1) Entry: fade + slide in the container
      tl.from(rootRef.current, {
        autoAlpha: 0,
        y: 20,
        duration: entryDur,
        ease: 'power2.out',
      });

      // 2) Stagger in each detail line
      const details = rootRef.current?.querySelectorAll<HTMLElement>('.detail') ?? [];
      tl.from(
        details,
        {
          autoAlpha: 0,
          y: 20,
          stagger: 0.2,
          duration: 0.6,
          ease: 'power2.out',
        },
        `-=${entryDur * 0.5}`
      );

      // 3) Fade in CTA
      const cta = rootRef.current?.querySelector<HTMLElement>('.cta');
      if (cta) {
        tl.from(
          cta,
          {
            autoAlpha: 0,
            y: 20,
            duration: 0.6,
            ease: 'power2.out',
          },
          `-=${0.4}`
        );
      }

      // 4) Exit animations scheduled at exitStart
      tl.to(
        details,
        {
          autoAlpha: 0,
          y: -20,
          stagger: 0.15,
          duration: exitDur,
          ease: 'power2.in',
        },
        exitStart
      );

      if (cta) {
        tl.to(
          cta,
          {
            autoAlpha: 0,
            scale: 0.9,
            duration: exitDur,
            ease: 'power2.in',
          },
          exitStart
        );
      }

      // container fade & shrink
      tl.to(
        rootRef.current,
        {
          autoAlpha: 0,
          scale: 0.95,
          duration: exitDur,
          ease: 'power1.in',
        },
        exitStart + exitDur * 0.1
      );
    }, rootRef);

    return () => ctx.revert();
  }, [displayDuration]);

  return (
    <div
      ref={rootRef}
      className="w-full h-full grid grid-cols-1 md:grid-cols-2 items-center p-12 gap-8"
      style={{
        backgroundImage:
          'linear-gradient(var(--background-start), var(--background-end))',
      }}
    >
      {/* Left column */}
      <div className="flex flex-col justify-center space-y-6">
        <h2
          className="text-8xl font-bold"
          style={{ color: 'var(--text-color)' }}
        >
          Support Our Masjid
        </h2>
        <p
          className="text-4xl"
          style={{ color: 'var(--text-color)' }}
        >
          Your generous donations help us serve the community.
        </p>
      </div>

      {/* Right column: bank details */}
      <div className="flex justify-center">
        <div
          className="w-full max-w-md p-10 rounded-lg"
          style={{
            backgroundColor: 'var(--accent-color)',
            color: 'var(--x-text-color)',
          }}
        >
          <div className="detail text-4xl mb-6">
            Name: <strong className="text-5xl">SBKC</strong>
          </div>
          <div className="detail text-4xl mb-6">
            Sort Code: <strong className="text-5xl">51-70-32</strong>
          </div>
          <div className="detail text-4xl mb-6">
            Account No.: <strong className="text-5xl">89886445</strong>
          </div>
          <div
            className="cta text-6xl font-semibold mt-8"
            style={{ color: 'var(--yellow)' }}
          >
            Donate Generously!
          </div>
        </div>
      </div>
    </div>
  );
}
