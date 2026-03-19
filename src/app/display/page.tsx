// src/app/display/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Rotator from './Components/Rotator';
import PrayerTimeline from './Components/PrayerTimeline';
import PrayerOverlay from './Components/PrayerOverlay';
import PostPrayerTableOverlay from './Components/PostPrayerTableOverlay';
import DowntimeDisplay from './Components/DowntimeDisplay';
import { usePrayerTimesContext } from './context/PrayerTimesContext';
import { useDebugContext } from './context/DebugContext';

// Transition duration in seconds
const TRANSITION_DURATION = 1.2;
const DISPLAY_BASE_WIDTH = 1920;
const DISPLAY_BASE_HEIGHT = 1080;
const ROTATOR_SECTION_HEIGHT_PERCENT = 65;
const TIMELINE_SECTION_HEIGHT_PERCENT = 35;
const ROTATOR_GRADIENT_HOLD_PERCENT = 18;
const ROTATOR_GRADIENT_BLEND_END_PERCENT = 100;
const ROTATOR_BOUNDARY_FADE_HEIGHT_PX = 160;

function DisplayContent() {
  const { isLoading, isDowntime: contextDowntime } = usePrayerTimesContext();
  const { downtimeOverride, downtimeOverrideActive } = useDebugContext();
  const [viewport, setViewport] = useState(() => ({
    width: DISPLAY_BASE_WIDTH,
    height: DISPLAY_BASE_HEIGHT,
  }));

  // Use automatic time-based detection, but allow debug override when active
  const isDowntime = downtimeOverrideActive ? downtimeOverride : contextDowntime;

  // Track which mode is currently displayed (allows for smooth transition)
  const [displayMode, setDisplayMode] = useState<'normal' | 'downtime' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Refs for transition animations
  const containerRef = useRef<HTMLDivElement>(null);
  const normalRef = useRef<HTMLDivElement>(null);
  const downtimeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

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
      <div
        className="flex h-full w-full items-center justify-center"
        style={{
          color: 'var(--text-color)',
        }}
      >
        <div className="text-2xl opacity-50">Loading...</div>
      </div>
    );
  }

  const scale = Math.min(
    viewport.width / DISPLAY_BASE_WIDTH,
    viewport.height / DISPLAY_BASE_HEIGHT
  );
  const stageWidth = DISPLAY_BASE_WIDTH * scale;
  const stageHeight = DISPLAY_BASE_HEIGHT * scale;

  // Determine what to render based on current display mode and transition state
  const showNormal = displayMode === 'normal' || (isTransitioning && !isDowntime);
  const showDowntime = displayMode === 'downtime' || (isTransitioning && isDowntime);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={containerRef}
        className="absolute left-1/2 top-1/2 overflow-hidden"
        style={{
          width: stageWidth,
          height: stageHeight,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="origin-top-left"
          style={{
            width: DISPLAY_BASE_WIDTH,
            height: DISPLAY_BASE_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          {/* Normal mode display */}
          {showNormal && (
            <div
              ref={normalRef}
              id="app"
              className="absolute inset-0 flex h-full w-full flex-col overflow-hidden"
              style={{
                visibility: displayMode === 'normal' ? 'visible' : 'hidden',
                backgroundColor: 'var(--background-end)',
              }}
            >
              <div
                className="relative w-full flex-none overflow-hidden"
                style={{
                  height: `${ROTATOR_SECTION_HEIGHT_PERCENT}%`,
                  background: `linear-gradient(
                    180deg,
                    var(--background-start) 0%,
                    var(--background-start) ${ROTATOR_GRADIENT_HOLD_PERCENT}%,
                    var(--background-end) ${ROTATOR_GRADIENT_BLEND_END_PERCENT}%,
                    var(--background-end) 100%
                  )`,
                }}
              >
                <Rotator />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0"
                  style={{
                    height: `${ROTATOR_BOUNDARY_FADE_HEIGHT_PX}px`,
                    background: 'linear-gradient(180deg, transparent 0%, var(--background-end) 100%)',
                  }}
                />
              </div>

              <div
                className="w-full flex-none overflow-hidden"
                style={{
                  height: `${TIMELINE_SECTION_HEIGHT_PERCENT}%`,
                  backgroundColor: 'var(--background-end)',
                }}
              >
                <PrayerTimeline />
              </div>

              <div className="pointer-events-none absolute inset-0 h-full w-full">
                <PrayerOverlay />
                <PostPrayerTableOverlay />
              </div>
            </div>
          )}

          {/* Downtime mode display */}
          {showDowntime && (
            <div
              ref={downtimeRef}
              className="absolute inset-0 h-full w-full"
              style={{ visibility: displayMode === 'downtime' ? 'visible' : 'hidden' }}
            >
              <DowntimeDisplay />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Display() {
  return <DisplayContent />;
}
