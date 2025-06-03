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
      className="flex flex-col h-screen w-screen font-sans overflow-hidden"
    >
      <Rotator />
      <PrayerTimeline />
      <PrayerOverlay />
    </div>
  );
}
