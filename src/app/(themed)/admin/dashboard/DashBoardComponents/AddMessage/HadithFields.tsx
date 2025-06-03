// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/HadithFields.tsx
import React from 'react';

export default function HadithFields({
  hadithAuthor, setHadithAuthor,
  hadithNumber, setHadithNumber,
  hadithAuth,   setHadithAuth,
  arabicText,   setArabicText,
  englishText,  setEnglishText,
}: {
  hadithAuthor: string;
  setHadithAuthor: (s: string) => void;
  hadithNumber: number | '';
  setHadithNumber: (n: number | '') => void;
  hadithAuth: string;
  setHadithAuth: (s: string) => void;

  arabicText: string;
  setArabicText: (s: string) => void;
  englishText: string;
  setEnglishText: (s: string) => void;
}) {
  return (
    <div className="space-y-2 mb-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={hadithAuthor}
          onChange={e => setHadithAuthor(e.target.value)}
          placeholder="Author"
          className="border rounded p-2 flex-1 bg-[var(--background-end)] text-[var(--text-color)]"
        />
        <input
          type="number"
          value={hadithNumber}
          onChange={e => setHadithNumber(e.target.value ? +e.target.value : '')}
          placeholder="Number"
          className="w-24 border rounded p-2 bg-[var(--background-end)] text-[var(--text-color)]"
        />
        <input
          type="text"
          value={hadithAuth}
          onChange={e => setHadithAuth(e.target.value)}
          placeholder="Authenticity Level"
          className="border rounded p-2 flex-1 bg-[var(--background-end)] text-[var(--text-color)]"
        />
      </div>
      <textarea
        value={arabicText}
        onChange={e => setArabicText(e.target.value)}
        placeholder="Arabic text"
        rows={2}
        className="w-full border rounded p-2 bg-[var(--background-end)] text-[var(--text-color)]"
      />
      <textarea
        value={englishText}
        onChange={e => setEnglishText(e.target.value)}
        placeholder="English translation"
        rows={2}
        className="w-full border rounded p-2 bg-[var(--background-end)] text-[var(--text-color)]"
      />
    </div>
  );
}
