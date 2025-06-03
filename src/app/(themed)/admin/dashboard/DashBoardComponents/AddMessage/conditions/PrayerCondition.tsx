// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/conditions/PrayerCondition.tsx
import React from 'react';
import { PrayerEntry } from '../types';

export default function PrayerCondition({
  idx,
  entries,
  newWhen, newName, newDuration,
  onWhenChange, onNameChange, onDurationChange,
  addPrayer, removePrayer
}: {
  idx: number;
  entries: PrayerEntry[];
  newWhen: 'before'|'after'|'both';
  newName: string;
  newDuration: number;
  onWhenChange: (v:'before'|'after'|'both')=>void;
  onNameChange:(v:string)=>void;
  onDurationChange:(v:number)=>void;
  addPrayer:()=>void;
  removePrayer:(i:number)=>void;
}) {
  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        {entries.map((p,i)=>(
          <div key={i} className="px-3 py-1 rounded flex items-center bg-[var(--background-end)]">
            The message will appear <strong className="mx-1">{p.when}</strong>
            the <strong className="mx-1">{p.name}</strong> jamaat for
            <strong className="mx-1">{p.duration}</strong>.
            <button onClick={()=>removePrayer(i)}
              className="ml-2 text-red-500 text-xl p-2">×</button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[var(--text-color)]">The message will appear</span>
        <select value={newWhen} onChange={e=>onWhenChange(e.target.value as any)}
          className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]">
          <option value="before">Before</option>
          <option value="after">After</option>
          <option value="both">Before and after</option>
        </select>
        <span className="text-[var(--text-color)]">the</span>
        <select value={newName} onChange={e=>onNameChange(e.target.value)}
          className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]">
          {['Fajr','Dhuhr','Asr','Maghrib','Isha'].map(p=>(
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <span className="text-[var(--text-color)]">jamaat for</span>
        <select value={newDuration} onChange={e=>onDurationChange(+e.target.value)}
          className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]">
          {[...Array(12)].map((_,i)=>(
            <option key={i} value={(i+1)*5}>
              {(i+1)*5} minutes
            </option>
          ))}
        </select>
        <span className="text-[var(--text-color)]">.</span>
      </div>
      <button onClick={addPrayer}
        className="mt-2 underline text-[var(--accent-color)]">
        Add another time
      </button>
    </div>
  );
}
