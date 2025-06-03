// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/conditions/TimeCondition.tsx
'use client';

import React from 'react';
import { TimeEntry } from '../types';

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export default function TimeCondition({
  idx,
  entries,
  newFrom,
  newTo,
  onFromChange,
  onToChange,
  addTime,
  removeTime,
}: {
  idx: number;
  entries: TimeEntry[];
  newFrom: string;
  newTo: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  addTime: () => void;
  removeTime: (i: number) => void;
}) {
  // Ensure we always have a valid "from"
  const actualFrom = PRAYER_ORDER.includes(newFrom) ? newFrom : PRAYER_ORDER[0];
  const fromIndex  = PRAYER_ORDER.indexOf(actualFrom);
  const toOptions  = PRAYER_ORDER.slice(fromIndex + 1);

  // Ensure we always have a valid "to"
  const actualTo = toOptions.includes(newTo)
    ? newTo
    : toOptions[0] || '';

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-[var(--text-color)]">From</label>
        <select
          value={actualFrom}
          onChange={e => onFromChange(e.target.value)}
          className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
        >
          {PRAYER_ORDER.map(prayer => (
            <option key={prayer} value={prayer}>
              {prayer}
            </option>
          ))}
        </select>

        <label className="text-[var(--text-color)]">to</label>
        <select
          value={actualTo}
          onChange={e => onToChange(e.target.value)}
          className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
        >
          {toOptions.map(prayer => (
            <option key={prayer} value={prayer}>
              {prayer}
            </option>
          ))}
        </select>

        <button
          onClick={addTime}
          className="px-4 py-2 rounded bg-[var(--accent-color)] text-[var(--x-text-color)]"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {entries.map((t, i) => (
          <span
            key={i}
            className="
              px-3 py-1 rounded flex items-center
              bg-[var(--time-bg-1)] text-[var(--text-color)]
            "
          >
            {t.from}–{t.to}
            <button
              onClick={() => removeTime(i)}
              className="text-red-500 text-xl ml-2 p-1"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
