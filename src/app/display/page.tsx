// src/app/display/page.tsx
'use client';

import React from 'react';
import Rotator from './Components/Rotator';
import PrayerTimeline from './Components/PrayerTimeline';
import PrayerOverlay from './Components/PrayerOverlay';

export default function Display() {
  return (
    <div
      id="app"
      className="relative flex flex-col w-full h-screen overflow-hidden"
    >
      {/* Rotator: fixed 65vh height, full width */}
      <div className="flex-none w-full h-[60vh] overflow-auto">
        <Rotator />
      </div>

      {/* PrayerTimeline: fixed 35vh height, full width, scroll if overflow */}
      <div className="flex-none w-full h-[40vh] overflow-auto">
        <PrayerTimeline />
      </div>

      {/* Overlay on top, spanning the full viewport */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <PrayerOverlay />
      </div>
    </div>
  );
}
