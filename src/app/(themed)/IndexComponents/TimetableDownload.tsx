// src/app/(themed)/IndexComponents/TimetableDownload.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { getActiveTimetable, type TimetableFile } from '@/lib/firebase/timetableStorage';

const TimetableDownload: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getActiveTimetable()
      .then((t) => {
        if (!cancelled) setTimetable(t);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Don't render anything if there's no active timetable
  if (loading || !timetable) return null;

  return (
    <>
      <section className="py-8 px-6">
        <div className="rounded-2xl border border-[var(--secondary-color)] bg-[var(--background-end)] dark:bg-[var(--x-background-start)] overflow-hidden shadow-md">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--secondary-color)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-[var(--accent-color)] dark:text-[var(--x-accent-color)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              <h3 className="text-lg font-semibold text-[var(--text-color)] dark:text-[var(--x-text-color)]">
                Prayer Timetable
              </h3>
            </div>
          </div>

          {/* Preview thumbnail */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="w-full cursor-pointer"
          >
            <div className="max-h-60 overflow-hidden flex items-center justify-center bg-[var(--background-start)] dark:bg-[var(--x-background-end)]">
              <img
                src={timetable.imageData}
                alt={timetable.label}
                className="w-full h-auto object-contain"
              />
            </div>
          </button>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">{timetable.label}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="py-2 px-4 text-sm font-semibold rounded-lg border border-[var(--secondary-color)] text-[var(--text-color)] dark:text-[var(--x-text-color)] hover:opacity-80 transition"
              >
                View
              </button>
              <a
                href={timetable.imageData}
                download={timetable.originalName || 'timetable.jpg'}
                className="py-2 px-4 text-sm font-semibold rounded-lg bg-[var(--accent-color)] dark:bg-[var(--x-accent-color)] text-[var(--background-end)] dark:text-[var(--x-background-end)] hover:opacity-90 transition flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Full-screen preview */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-10 right-0 text-white hover:opacity-70 text-2xl font-bold"
            >
              &times;
            </button>

            <div className="bg-[var(--background-end)] rounded-t-xl px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-color)] truncate">
                {timetable.label}
              </h3>
              <a
                href={timetable.imageData}
                download={timetable.originalName || 'timetable.jpg'}
                className="flex items-center gap-1 text-sm font-semibold text-[var(--accent-color)] hover:opacity-70 transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </a>
            </div>

            <div className="bg-[var(--background-start)] rounded-b-xl overflow-auto max-h-[75vh]">
              <img
                src={timetable.imageData}
                alt={timetable.label}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TimetableDownload;
