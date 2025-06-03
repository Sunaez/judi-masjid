// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/SourceSelector.tsx
import React from 'react';
import { SourceType } from './types';

export default function SourceSelector({
  sourceType, setSourceType
}: {
  sourceType: SourceType;
  setSourceType: (s:SourceType)=>void;
}) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2 text-[var(--text-color)]">Content Source</h3>
      <div className="flex rounded-lg overflow-hidden shadow mb-4">
        {(['quran','hadith','other'] as SourceType[]).map(opt=>(
          <label key={opt}
            className={`flex-1 text-center py-2 cursor-pointer select-none ${
              sourceType===opt
                ? 'bg-[var(--accent-color)] text-[var(--x-text-color)]'
                : 'bg-[var(--background-end)] text-[var(--text-color)]'
            }`}
          >
            <input
              type="radio"
              className="hidden"
              value={opt}
              checked={sourceType===opt}
              onChange={()=>setSourceType(opt)}
            />
            {opt.charAt(0).toUpperCase()+opt.slice(1)}
          </label>
        ))}
      </div>
    </div>
  );
}
