// src/app/display/Components/Rotator/Specials.tsx
'use client';

import React from 'react';
import type { ConditionData } from './types';

interface SpecialsProps {
  conditions: ConditionData[];
}

export default function Specials({ conditions }: SpecialsProps) {
  const txt = conditions
    .filter(c => c.type !== 'normal')
    .flatMap(c => {
      switch (c.type) {
        case 'time':    return c.entries.map(e => `From ${e.from} to ${e.to}`);
        case 'prayer':  return c.entries.map(e =>
                          `${e.when==='both'?'Before and After':
                            e.when==='before'?'Before':'After'} ${e.name} for ${e.duration} minutes`);
        case 'weather': return c.entries.map(e => `During ${e.weather} weather`);
        case 'day':     return c.entries.map(d => `On ${d}`);
        default:        return [];
      }
    })
    .join(' | ');

  if (!txt) return null;
  return (
    <div
      className="absolute top-2 left-1/2 -translate-x-1/2 text-sm"
      style={{ color: 'var(--text-color)' }}
    >
      {txt}
    </div>
  );
}
