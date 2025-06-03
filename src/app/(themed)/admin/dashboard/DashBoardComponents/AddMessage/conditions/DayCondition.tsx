// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/conditions/DayCondition.tsx
import React from 'react';

export default function DayCondition({
  idx,
  entries,
  toggleDate
}: {
  idx: number;
  entries: string[];
  toggleDate: (day:string)=>void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        .map(day => {
          const sel = entries.includes(day);
          return (
            <button key={day}
              onClick={()=>toggleDate(day)}
              className={`px-3 py-1 rounded-full border ${
                sel
                  ? 'bg-[var(--accent-color)] text-[var(--x-text-color)]'
                  : 'bg-[var(--background-end)] text-[var(--text-color)]'
              }`}
            >
              {day.slice(0,3)}
            </button>
          );
        })
      }
    </div>
  );
}
