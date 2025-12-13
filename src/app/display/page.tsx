// src/app/display/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Rotator from './Components/Rotator';
import PrayerTimeline from './Components/PrayerTimeline';
import PrayerOverlay from './Components/PrayerOverlay';
import DowntimeDisplay from './Components/DowntimeDisplay';
import { usePrayerTimesContext } from './context/PrayerTimesContext';
import { useDebugContext } from './context/DebugContext';

// Transition duration in seconds
const TRANSITION_DURATION = 1.2;

function DisplayContent() {
  const { isLoading } = usePrayerTimesContext();
  const { downtimeOverride } = useDebugContext();

  // Key 1 toggles between normal and off-peak mode
  const isDowntime = downtimeOverride;

  // Track which mode is currently displayed (allows for smooth transition)
  const [displayMode, setDisplayMode] = useState<'normal' | 'downtime' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Refs for transition animations
  const containerRef = useRef<HTMLDivElement>(null);
  const normalRef = useRef<HTMLDivElement>(null);
  const downtimeRef = useRef<HTMLDivElement>(null);

  // Initialize display mode once loading is complete
  useEffect(() => {
    if (!isLoading && displayMode === null) {
      setDisplayMode(isDowntime ? 'downtime' : 'normal');
    }
  }, [isLoading, isDowntime, displayMode]);

  // Handle transitions between modes
  useEffect(() => {
    if (isLoading || displayMode === null) return;

    const targetMode = isDowntime ? 'downtime' : 'normal';

    // If already in the target mode, no transition needed
    if (targetMode === displayMode) return;

    // Start transition
    setIsTransitioning(true);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setDisplayMode(targetMode);
          setIsTransitioning(false);
        },
      });

      // Fade out current mode with a slight scale and blur effect
      if (displayMode === 'normal' && normalRef.current) {
        tl.to(normalRef.current, {
          autoAlpha: 0,
          scale: 0.98,
          filter: 'blur(10px)',
          duration: TRANSITION_DURATION / 2,
          ease: 'power2.in',
        });
      } else if (displayMode === 'downtime' && downtimeRef.current) {
        tl.to(downtimeRef.current, {
          autoAlpha: 0,
          scale: 0.98,
          filter: 'blur(10px)',
          duration: TRANSITION_DURATION / 2,
          ease: 'power2.in',
        });
      }

      // Brief pause at the crossover
      tl.to({}, { duration: 0.1 });

      // Fade in new mode
      if (targetMode === 'downtime' && downtimeRef.current) {
        tl.fromTo(
          downtimeRef.current,
          {
            autoAlpha: 0,
            scale: 1.02,
            filter: 'blur(10px)',
          },
          {
            autoAlpha: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: TRANSITION_DURATION / 2,
            ease: 'power2.out',
          }
        );
      } else if (targetMode === 'normal' && normalRef.current) {
        tl.fromTo(
          normalRef.current,
          {
            autoAlpha: 0,
            scale: 1.02,
            filter: 'blur(10px)',
          },
          {
            autoAlpha: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: TRANSITION_DURATION / 2,
            ease: 'power2.out',
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isDowntime, isLoading, displayMode]);

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <div className="text-2xl opacity-50">Loading...</div>
      </div>
    );
  }

  // Determine what to render based on current display mode and transition state
  const showNormal = displayMode === 'normal' || (isTransitioning && !isDowntime);
  const showDowntime = displayMode === 'downtime' || (isTransitioning && isDowntime);

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden">
      {/* Normal mode display */}
      {showNormal && (
        <div
          ref={normalRef}
          id="app"
          className="absolute inset-0 flex flex-col w-full h-screen overflow-hidden"
          style={{ visibility: displayMode === 'normal' ? 'visible' : 'hidden' }}
        >
          {/* Rotator: fixed 65vh height, full width */}
          <div className="flex-none w-full h-[65vh] overflow-hidden">
            <Rotator />
          </div>

          {/* PrayerTimeline: fixed 35vh height, full width, scroll if overflow */}
          <div className="flex-none w-full h-[35vh] overflow-hidden">
            <PrayerTimeline />
          </div>

          {/* Overlay on top, spanning the full viewport */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <PrayerOverlay />
          </div>
        </div>
      )}

      {/* Downtime mode display */}
      {showDowntime && (
        <div
          ref={downtimeRef}
          className="absolute inset-0"
          style={{ visibility: displayMode === 'downtime' ? 'visible' : 'hidden' }}
        >
          <DowntimeDisplay />
        </div>
      )}
    </div>
  );
}

export default function Display() {
  return <DisplayContent />;
}
