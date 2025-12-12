// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/conditions/TimeCondition.tsx
'use client';

import React from 'react';
import { TimeEntry } from '../types';

/**
 * Simple time condition component for HH:MM to HH:MM ranges.
 */
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
  newFrom: string;   // HH:MM format
  newTo: string;     // HH:MM format
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  addTime: () => void;
  removeTime: (i: number) => void;
}) {
  // Validate that start time is before end time
  const isValid = (() => {
    if (!newFrom || !newTo) return false;
    const [fH, fM] = newFrom.split(':').map(Number);
    const [tH, tM] = newTo.split(':').map(Number);
    if (isNaN(fH) || isNaN(fM) || isNaN(tH) || isNaN(tM)) return false;
    return fH * 60 + fM < tH * 60 + tM;
  })();

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-[var(--text-color)]">From</label>
        <input
          type="time"
          value={newFrom}
          onChange={(e) => onFromChange(e.target.value)}
          className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
        />

        <label className="text-[var(--text-color)]">to</label>
        <input
          type="time"
          value={newTo}
          onChange={(e) => onToChange(e.target.value)}
          className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
        />

        <button
          onClick={addTime}
          disabled={!isValid}
          className={`px-4 py-2 rounded text-[var(--x-text-color)] ${
            isValid
              ? 'bg-[var(--accent-color)] hover:opacity-90'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Add
        </button>
      </div>

      {newFrom && newTo && !isValid && (
        <p className="text-red-500 text-sm">Start time must be before end time.</p>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        {entries.map((t, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded flex items-center bg-[var(--background-end)] text-[var(--text-color)]"
          >
            {t.from} – {t.to}
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
