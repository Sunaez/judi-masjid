// src/app/display/page.tsx
'use client';

import React from 'react';
import Rotator from './Components/Rotator';
import PrayerTimeline from './Components/PrayerTimeline';
import PrayerOverlay from './Components/PrayerOverlay';
import DowntimeDisplay from './Components/DowntimeDisplay';
import { usePrayerTimesContext } from './context/PrayerTimesContext';

function DisplayContent() {
  const { isDowntime, isLoading } = usePrayerTimesContext();

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <div className="text-2xl opacity-50">Loading...</div>
      </div>
    );
  }

  // Downtime mode: simplified display
  if (isDowntime) {
    return <DowntimeDisplay />;
  }

  // Normal mode: full display
  return (
    <div
      id="app"
      className="relative flex flex-col w-full h-screen overflow-hidden"
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
  );
}

export default function Display() {
  return <DisplayContent />;
}
