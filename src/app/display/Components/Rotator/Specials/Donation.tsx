// src/app/display/Components/Rotator/Specials/Donation.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { HeartHandshake } from 'lucide-react';
import {
  DEFAULT_DONATION_SETTINGS,
  subscribeDonationSettings,
} from '@/lib/firebase/donationSettings';

interface DonationProps {
  displayDuration: number;
}

const formatPounds = (amount: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

export default function Donation({ displayDuration }: DonationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState(DEFAULT_DONATION_SETTINGS);

  useEffect(() => {
    const unsubscribe = subscribeDonationSettings(
      setSettings,
      (error) => {
        console.error('[Donation] Failed to load donation settings:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const { currentAmount, totalAmount } = settings;
  const progressPercent = (currentAmount / totalAmount) * 100;

  useEffect(() => {
    const entryDur = 0.8;
    const exitDur = 0.6;
    const totalSec = displayDuration / 1000;
    const exitStart = Math.max(totalSec - exitDur, entryDur + 0.1);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.from(rootRef.current, {
        autoAlpha: 0,
        y: 30,
        duration: entryDur,
        ease: 'power2.out',
      });

      const details =
        rootRef.current?.querySelectorAll<HTMLElement>('.donation-detail') ?? [];
      tl.from(
        details,
        {
          autoAlpha: 0,
          y: 20,
          stagger: 0.12,
          duration: 0.6,
          ease: 'power2.out',
        },
        `-=${entryDur * 0.5}`
      );

      tl.fromTo(
        meterRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          transformOrigin: 'left center',
          ease: 'power3.out',
        },
        '-=0.35'
      );

      tl.to(
        details,
        {
          autoAlpha: 0,
          y: -20,
          stagger: 0.08,
          duration: exitDur,
          ease: 'power2.in',
        },
        exitStart
      );

      tl.to(
        rootRef.current,
        {
          autoAlpha: 0,
          y: -30,
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
      className="flex h-full w-full flex-col justify-center px-12"
      style={{ color: 'var(--text-color)' }}
    >
      <div className="grid grid-cols-[1.15fr_0.85fr] items-center gap-20">
        <div className="flex flex-col justify-center">
          <div className="donation-detail mb-8 flex items-center gap-6">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: 'var(--accent-color)',
                color: 'var(--background-end)',
              }}
            >
              <HeartHandshake className="h-12 w-12" strokeWidth={1.8} />
            </div>
            <p
              className="text-3xl font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--secondary-color)' }}
            >
              Al-Judi Masjid fundraising appeal
            </p>
          </div>

          <h2 className="donation-detail max-w-4xl text-7xl font-bold leading-[1.08]">
            Together, we can reach our
            <span style={{ color: 'var(--accent-color)' }}>
              {' '}
              {formatPounds(totalAmount)} goal.
            </span>
          </h2>

          <p className="donation-detail mt-7 max-w-3xl text-3xl leading-relaxed opacity-75">
            Your support helps us continue serving and strengthening our
            community.
          </p>
        </div>

        <div
          className="donation-detail flex items-center justify-center border-l-2 pl-16"
          style={{
            borderColor: 'var(--secondary-color)',
          }}
        >
          <div className="text-center">
            <p
              className="mb-2 text-3xl font-semibold uppercase tracking-[0.14em]"
              style={{ color: 'var(--secondary-color)' }}
            >
              Raised so far
            </p>
            <p
              className="text-8xl font-bold leading-none"
              style={{ color: 'var(--accent-color)' }}
            >
              {formatPounds(currentAmount)}
            </p>
            <p className="mt-6 text-4xl font-semibold">
              <span style={{ color: 'var(--accent-color)' }}>
                {progressPercent.toFixed(1).replace(/\.0$/, '')}%
              </span>{' '}
              of our target
            </p>
          </div>
        </div>
      </div>

      <div className="donation-detail mt-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p
              className="mb-1 text-2xl font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--secondary-color)' }}
            >
              Current total
            </p>
            <p className="text-4xl font-bold">{formatPounds(currentAmount)}</p>
          </div>
          <div className="text-right">
            <p
              className="mb-1 text-2xl font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--secondary-color)' }}
            >
              Fundraising target
            </p>
            <p className="text-4xl font-bold">{formatPounds(totalAmount)}</p>
          </div>
        </div>

        <div className="relative">
          <div
            className="h-10 overflow-hidden rounded-full p-1.5"
            style={{ backgroundColor: 'var(--secondary-color)' }}
            role="progressbar"
            aria-label={`${formatPounds(currentAmount)} raised of ${formatPounds(totalAmount)}`}
            aria-valuemin={0}
            aria-valuemax={totalAmount}
            aria-valuenow={currentAmount}
          >
            <div
              ref={meterRef}
              className="h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: 'var(--accent-color)',
                transition: 'width 700ms ease',
              }}
            />
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-10"
            aria-hidden="true"
          >
            {Array.from({ length: 9 }, (_, index) => {
              const percentage = (index + 1) * 10;

              return (
                <div
                  key={percentage}
                  className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    left: `${percentage}%`,
                    backgroundColor: 'var(--background-end)',
                    opacity: 0.75,
                  }}
                />
              );
            })}
          </div>

          <div
            className="absolute top-1/2 z-20 h-14 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${progressPercent}%`,
              backgroundColor: 'var(--text-color)',
              transition: 'left 700ms ease',
            }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-2xl font-semibold">
          <span style={{ color: 'var(--accent-color)' }}>
            Thank you for every contribution
          </span>
          <span>
            {formatPounds(totalAmount - currentAmount)} still to raise
          </span>
        </div>
      </div>
    </div>
  );
}
