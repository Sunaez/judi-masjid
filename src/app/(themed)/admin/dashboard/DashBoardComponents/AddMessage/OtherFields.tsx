// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/OtherFields.tsx
import React from 'react';

export default function OtherFields({
  arabicText, setArabicText,
  englishText,setEnglishText
}: {
  arabicText: string;
  setArabicText:(s:string)=>void;
  englishText:string;
  setEnglishText:(s:string)=>void;
}) {
  return (
    <>
      <textarea
        value={arabicText}
        onChange={e=>setArabicText(e.target.value)}
        placeholder="Arabic text"
        rows={2}
        className="w-full border rounded p-2 mb-2 bg-[var(--background-end)] text-[var(--text-color)]"
      />
      <textarea
        value={englishText}
        onChange={e=>setEnglishText(e.target.value)}
        placeholder="English text"
        rows={2}
        className="w-full border rounded p-2 bg-[var(--background-end)] text-[var(--text-color)]"
      />
    </>
  );
}
