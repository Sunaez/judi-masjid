// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/QuranField.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SURAH_LIST } from './QuranData';
import { IoCheckmark } from 'react-icons/io5';

interface QuranFieldProps {
  surah: string;
  setSurah: (no: string) => void;
  startAyah: number | '';
  setStartAyah: (ayah: number | '') => void;
  arabicText: string;
  setArabicText: (text: string) => void;
  englishText: string;
  setEnglishText: (text: string) => void;
}

export default function QuranField({
  surah,
  setSurah,
  startAyah,
  setStartAyah,
  arabicText,
  setArabicText,
  englishText,
  setEnglishText,
}: QuranFieldProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // how many ayahs to fetch (1–6)
  const [rangeLength, setRangeLength] = useState<number>(6);

  // Local textarea state
  const [localArabic, setLocalArabic] = useState(arabicText);
  const [localEnglish, setLocalEnglish] = useState(englishText);

  useEffect(() => { setLocalArabic(arabicText); }, [arabicText]);
  useEffect(() => { setLocalEnglish(englishText); }, [englishText]);

  const startNum = typeof startAyah === 'number' ? startAyah : null;
  const totalAyahs = SURAH_LIST.find(s => s.no === surah)?.totalAyahs || 0;

  // compute effective end based on rangeLength, clamped to totalAyahs
  const endNumEffective =
    startNum !== null
      ? Math.min(startNum + rangeLength - 1, totalAyahs)
      : null;

  const validStart = startNum !== null && startNum >= 1 && startNum <= totalAyahs;

  const handleAutoFill = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!surah || !validStart || endNumEffective === null) return;

    const ayahCount = endNumEffective - startNum! + 1;
    setTotalCount(ayahCount);
    setProgress(0);
    setIsLoading(true);

    const arabicArr: string[] = [];
    const englishArr: string[] = [];

    for (let i = 0; i < ayahCount; i++) {
      const ay = startNum! + i;
      try {
        const res = await fetch(
          `https://api.alquran.cloud/v1/ayah/${surah}:${ay}/editions/quran-uthmani,en.sahih`
        );
        const json = await res.json();
        const [arabicData, englishData] = json.data;
        arabicArr.push(arabicData.text.trim() + '.');
        englishArr.push(englishData.text.trim() + '.');
      } catch {
        console.error(`Error fetching ayah ${surah}:${ay}`);
      }
      setProgress(i + 1);
    }

    const newArabic = arabicArr.join('\n');
    const newEnglish = englishArr.join('\n');

    setLocalArabic(newArabic);
    setLocalEnglish(newEnglish);
    setArabicText(newArabic);
    setEnglishText(newEnglish);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Surah Select */}
      <div>
        <label className="block text-sm font-medium">Surah</label>
        <select
          value={surah}
          onChange={e => setSurah(e.target.value)}
          className="mt-1 block w-full p-2 border rounded bg-[var(--background-start)] text-[var(--text-color)]"
        >
          <option value="">— select —</option>
          {SURAH_LIST.map(s => (
            <option key={s.no} value={s.no}>
              {s.no}. {s.english} ({s.arabic}) – {s.totalAyahs} ayahs
            </option>
          ))}
        </select>
      </div>

      {/* Start Ayah */}
      <div>
        <label className="block text-sm font-medium">Start Ayah</label>
        <input
          type="number"
          min={1}
          max={totalAyahs}
          value={startAyah}
          onChange={e => setStartAyah(e.target.value ? Number(e.target.value) : '')}
          className="mt-1 block w-full p-2 border rounded"
          placeholder="e.g. 1"
        />
      </div>

      {/* Range Length Selector */}
      <div>
        <label className="block text-sm font-medium">How many ayahs?</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setRangeLength(n)}
              className={`px-3 py-1 border rounded focus:outline-none ${
                rangeLength === n
                  ? 'bg-[var(--background-start)] text-[var(--text-color)] border-[var(--background-start)]'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Covers from ayah {startNum ?? '?'} to{' '}
          {endNumEffective ?? '?'} (up to {rangeLength})
        </p>
      </div>

      {/* AutoFill */}
      <div>
        <button
          type="button"
          onClick={handleAutoFill}
          disabled={!validStart || isLoading}
          className="mt-1 w-full px-4 py-2 rounded font-semibold bg-gray-400 text-white disabled:opacity-50"
        >
          AutoFill
        </button>
        <div className="mt-2 text-sm flex items-center">
          {validStart ? (
            <IoCheckmark className="w-5 h-5 text-green-500" />
          ) : (
            <IoCheckmark className="w-5 h-5 text-red-500 rotate-45" />
          )}
          <span className="ml-1">
            Start between 1 and {totalAyahs}
          </span>
        </div>
      </div>

      {/* Progress */}
      {isLoading && (
        <div className="space-y-1">
          <div className="text-sm text-gray-600">
            Loading… {progress}/{totalCount}
          </div>
          <progress
            max={totalCount}
            value={progress}
            className="w-full h-2"
          />
        </div>
      )}

      {/* Arabic Text */}
      <div>
        <label className="block text-sm font-medium">Arabic Text</label>
        <textarea
          rows={4}
          value={localArabic}
          onChange={e => {
            setLocalArabic(e.target.value);
            setArabicText(e.target.value);
          }}
          className="mt-1 block w-full p-2 border rounded"
          placeholder="Enter Arabic text here"
        />
      </div>

      {/* English Text */}
      <div>
        <label className="block text-sm font-medium">English Text</label>
        <textarea
          rows={4}
          value={localEnglish}
          onChange={e => {
            setLocalEnglish(e.target.value);
            setEnglishText(e.target.value);
          }}
          className="mt-1 block w-full p-2 border rounded"
          placeholder="Enter English translation here"
        />
        <p className="text-xs text-gray-500">(Sahih International)</p>
      </div>
    </div>
  );
}
