'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface EidPrayerProps {
  displayDuration: number;
}

export default function EidPrayer({ displayDuration }: EidPrayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const entryDur = 0.8;
    const exitDur = 0.6;
    const totalSec = displayDuration / 1000;
    const exitStart = Math.max(totalSec - exitDur, entryDur + 0.1);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.from(rootRef.current, {
        autoAlpha: 0,
        y: 24,
        duration: entryDur,
        ease: 'power2.out',
      });

      const details = rootRef.current?.querySelectorAll<HTMLElement>('.eid-detail') ?? [];
      tl.from(
        details,
        {
          autoAlpha: 0,
          y: 24,
          stagger: 0.16,
          duration: 0.55,
          ease: 'power2.out',
        },
        `-=${entryDur * 0.4}`
      );

      tl.to(
        rootRef.current,
        {
          autoAlpha: 0,
          y: -24,
          duration: exitDur,
          ease: 'power1.in',
        },
        exitStart
      );
    }, rootRef);

    return () => ctx.revert();
  }, [displayDuration]);

  return (
    <div
      ref={rootRef}
      className="grid h-full w-full grid-cols-[1.05fr_0.95fr] items-start gap-8 p-4"
      style={{ color: 'var(--text-color)' }}
    >
      <div className="flex h-full flex-col justify-start pt-2">
        <div
          className="eid-detail mb-6 w-fit rounded-full px-8 py-3 text-3xl font-bold uppercase tracking-wide"
          style={{
            backgroundColor: 'var(--accent-color)',
            color: 'var(--x-text-color)',
          }}
        >
          Eid al-Adha Notice
        </div>

        <h2 className="eid-detail text-8xl font-extrabold leading-[1.08]">
          Eid al-Adha Prayer
        </h2>

        <div className="eid-detail mt-5 text-7xl font-bold leading-[1.08]">
          Summerfield Park
        </div>

        <div className="eid-detail mt-8 flex items-end gap-5">
          <span className="text-5xl font-semibold">Starts at</span>
          <span
            className="text-8xl font-extrabold leading-[1.08]"
            style={{ color: 'var(--accent-color)' }}
          >
            9:00am
          </span>
        </div>

        <p className="eid-detail mt-8 text-5xl font-semibold leading-[1.12]">
          Brothers and sisters are welcome.
        </p>
      </div>

      <div className="eid-detail h-[72vh] overflow-hidden rounded-2xl border-4 border-white/20 shadow-2xl">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4017.7106427106723!2d-1.9409240605776887!3d52.48623845872842!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4870bd2d20add84f%3A0x2d6e8cd7a26221a4!2sSummerfield%20Park!5e1!3m2!1sen!2suk!4v1779802694730!5m2!1sen!2suk"
          width="600"
          height="450"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Summerfield Park map"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
