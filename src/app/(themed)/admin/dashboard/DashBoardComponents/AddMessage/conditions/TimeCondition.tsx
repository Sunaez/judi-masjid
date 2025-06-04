// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/conditions/TimeCondition.tsx
'use client';

import React from 'react';
import { TimeEntry } from '../types';

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

/**
 * We removed the `EncodedValue` alias and now simply accept `string`.
 * Internally, we still split on ":" to determine prayer vs time.
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
  newFrom: string;            // was "EncodedValue"
  newTo: string;              // was "EncodedValue"
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  addTime: () => void;
  removeTime: (i: number) => void;
}) {
  // Parse a raw string of form "prayer:Fajr" or "time:HH:MM"
  const parseEncoded = (enc: string) => {
    const [type, ...rest] = enc.split(':');
    const value = rest.join(':');
    if (type === 'prayer') {
      return { type: 'prayer' as const, value };
    } else {
      return { type: 'time' as const, value };
    }
  };

  const fromParsed = parseEncoded(newFrom);
  const toParsed = parseEncoded(newTo);

  // Determine validity (only checking same-type comparisons).
  let isValid = true;
  let errorMsg = '';

  if (fromParsed.type === 'prayer' && toParsed.type === 'prayer') {
    const fromIdx = PRAYER_ORDER.indexOf(fromParsed.value);
    const toIdx = PRAYER_ORDER.indexOf(toParsed.value);
    if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) {
      isValid = false;
      errorMsg = 'Start prayer must come before end prayer.';
    }
  }

  if (fromParsed.type === 'time' && toParsed.type === 'time') {
    if (fromParsed.value >= toParsed.value) {
      isValid = false;
      errorMsg = 'Start time must be before end time.';
    }
  }

  // Handlers
  const handleFromTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value as 'prayer' | 'time';
    if (selectedType === 'prayer') {
      onFromChange(`prayer:${PRAYER_ORDER[0]}`);
    } else {
      onFromChange(`time:00:00`);
    }
  };

  const handleToTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value as 'prayer' | 'time';
    if (selectedType === 'prayer') {
      onToChange(`prayer:${PRAYER_ORDER[0]}`);
    } else {
      onToChange(`time:00:00`);
    }
  };

  const handleFromPrayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFromChange(`prayer:${e.target.value}`);
  };

  const handleFromTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFromChange(`time:${e.target.value}`);
  };

  const handleToPrayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onToChange(`prayer:${e.target.value}`);
  };

  const handleToTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToChange(`time:${e.target.value}`);
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-[var(--text-color)]">From</label>

        {/* Choose whether "From" is a prayer or a clock time */}
        <select
          value={fromParsed.type}
          onChange={handleFromTypeChange}
          className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
        >
          <option value="prayer">Prayer</option>
          <option value="time">Time</option>
        </select>

        {fromParsed.type === 'prayer' ? (
          <select
            value={fromParsed.value}
            onChange={handleFromPrayerChange}
            className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
          >
            {PRAYER_ORDER.map((prayer) => (
              <option key={prayer} value={prayer}>
                {prayer}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="time"
            value={fromParsed.value}
            onChange={handleFromTimeChange}
            className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
          />
        )}

        <label className="text-[var(--text-color)]">to</label>

        {/* Choose whether "To" is prayer or clock time */}
        <select
          value={toParsed.type}
          onChange={handleToTypeChange}
          className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
        >
          <option value="prayer">Prayer</option>
          <option value="time">Time</option>
        </select>

        {toParsed.type === 'prayer' ? (
          <select
            value={toParsed.value}
            onChange={handleToPrayerChange}
            className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
          >
            {PRAYER_ORDER.map((prayer) => (
              <option key={prayer} value={prayer}>
                {prayer}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="time"
            value={toParsed.value}
            onChange={handleToTimeChange}
            className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
          />
        )}

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

      {!isValid && (
        <p className="text-red-500 text-sm mt-1">{errorMsg}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        {entries.map((t, i) => {
          const fromDisplay = t.from.split(':')[1];
          const toDisplay = t.to.split(':')[1];
          return (
            <span
              key={i}
              className="
                px-3 py-1 rounded flex items-center
                bg-[var(--time-bg-1)] text-[var(--text-color)]
              "
            >
              {fromDisplay}–{toDisplay}
              <button
                onClick={() => removeTime(i)}
                className="text-red-500 text-xl ml-2 p-1"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
