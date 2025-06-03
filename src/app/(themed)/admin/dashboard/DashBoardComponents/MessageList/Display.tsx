// src/app/(themed)/admin/dashboard/DashBoardComponents/MessageList/Display.tsx
'use client';

import React from 'react';
import type { MessageRecord } from './index';
import { IoTrash } from 'react-icons/io5';

interface DisplayProps {
  messages: MessageRecord[];
  loading: boolean;
  error: string | null;
  onDeleteClick: (id: string) => void;
}

export default function Display({
  messages,
  loading,
  error,
  onDeleteClick,
}: DisplayProps) {
  if (loading) return <p className="text-[var(--text-color)]">Loading messages…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!messages.length) return <p className="text-[var(--text-color)]">No messages found.</p>;

  return (
    <div className="space-y-6">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="
            grid grid-cols-4
            bg-[var(--background-end)]
            border border-[var(--secondary-color)]
            rounded-2xl shadow-lg
            overflow-hidden
          "
        >
          {/* Content (75%) */}
          <div className="col-span-3 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-[var(--accent-color)]">
                Message #{msg.id}
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-[var(--secondary-color)]">
                  {msg.createdAt.toDate().toLocaleString()}
                </span>
                <button
                  onClick={() => onDeleteClick(msg.id)}
                  className="text-red-600 hover:text-[var(--yellow)] transition-colors duration-200"
                  aria-label="Delete message"
                >
                  <IoTrash size={20} />
                </button>
              </div>
            </div>

            <span
              className="
                inline-block px-3 py-1
                bg-[var(--accent-color)] text-[var(--x-text-color)]
                rounded-full text-sm font-medium
              "
            >
              {msg.data.sourceType.toUpperCase()}
            </span>

            {msg.data.sourceType === 'quran' && msg.data.quran && (
              <div className="space-y-2">
                <p className="text-[var(--text-color)]">
                  <strong>Surah:</strong> {msg.data.quran.surah}
                </p>
                <p className="text-[var(--text-color)]">
                  <strong>Ayahs:</strong> {msg.data.quran.startAyah}–{msg.data.quran.endAyah}
                </p>
                <p className="font-arabic text-right text-lg leading-relaxed">
                  {msg.data.quran.arabicText}
                </p>
                <p className="text-[var(--text-color)] italic">
                  {msg.data.quran.englishText}
                </p>
              </div>
            )}

            {msg.data.sourceType === 'hadith' && msg.data.hadith && (
              <div className="space-y-2">
                <p className="text-[var(--text-color)]">
                  <strong>Author:</strong> {msg.data.hadith.author}
                </p>
                <p className="text-[var(--text-color)]">
                  <strong>Number:</strong> {msg.data.hadith.number}
                </p>
                <p className="text-[var(--text-color)]">
                  <strong>Authenticity:</strong> {msg.data.hadith.authenticity}
                </p>
                <p className="font-arabic text-right text-lg leading-relaxed">
                  {msg.data.hadith.arabicText}
                </p>
                <p className="text-[var(--text-color)] italic">
                  {msg.data.hadith.englishText}
                </p>
              </div>
            )}

            {msg.data.sourceType === 'other' && msg.data.other && (
              <div className="space-y-2">
                <p className="text-[var(--text-color)] italic">
                  {msg.data.other.englishText}
                </p>
                {msg.data.other.arabicText && (
                  <p className="font-arabic text-right text-lg leading-relaxed">
                    {msg.data.other.arabicText}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Conditions (25%) */}
          <div className="col-span-1 bg-[var(--background-start)] p-6 border-l border-[var(--secondary-color)]">
            <h4 className="text-lg font-semibold text-[var(--text-color)] mb-4">
              Conditions ({msg.conditionsData.length})
            </h4>
            <div className="space-y-4 overflow-y-auto max-h-[300px]">
              {msg.conditionsData.map((c, i) => (
                <div
                  key={i}
                  className="
                    bg-[var(--background-end)]
                    border border-[var(--secondary-color)]
                    rounded-lg p-3
                  "
                >
                  <span
                    className="
                      inline-block px-2 py-0.5
                      bg-[var(--accent-color)]
                      text-[var(--x-text-color)]
                      text-xs font-semibold rounded
                    "
                  >
                    {c.type.toUpperCase()}
                  </span>
                  <div className="mt-2 text-[var(--text-color)] text-sm space-y-1">
                    {c.type === 'normal' && <p>Always active</p>}
                    {c.type === 'time' &&
                      c.entries.map((e, j) => (
                        <p key={j}>
                          {e.from} – {e.to}
                        </p>
                      ))}
                    {c.type === 'prayer' &&
                      c.entries.map((e, j) => (
                        <p key={j}>
                          {e.when} {e.name} ({e.duration} min)
                        </p>
                      ))}
                    {c.type === 'weather' &&
                      c.entries.map((e, j) => <p key={j}>{e.weather}</p>)}
                    {c.type === 'day' &&
                      c.entries.map((d, j) => <p key={j}>{d}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
