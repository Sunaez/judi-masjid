// src/app/(themed)/admin/dashboard/DashBoardComponents/Notification.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

type NotificationProps = {
  type: 'success' | 'error' | 'delete';
  message: string;
  /** Duration in milliseconds before auto‐hiding (default: 3000) */
  duration?: number;
  /** Callback invoked after the hide animation completes */
  onDone: () => void;
};

export default function Notification({
  type,
  message,
  duration = 3000,
  onDone,
}: NotificationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

    // Animate in: from y=20, opacity=0 → y=0, opacity=1
    gsap.fromTo(
      container,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
    );

    // Timeline: overlay expands from 0% → 100% over "duration", then fade out
    const tl = gsap.timeline({ onComplete: onDone });
    tl.to(overlay, {
      width: '100%',
      duration: duration / 1000,
      ease: 'none',
    }).to(
      container,
      {
        y: 20,
        opacity: 0,
        duration: 0.4,
        ease: 'ease.InOut',
      },
      '>-0.2'
    );

    return () => {
      tl.kill();
    };
  }, [message, duration, onDone]);

  // Decide base and overlay colors
  const isSuccess = type === 'success';
  const isDelete = type === 'delete';
  // Both 'error' and 'delete' use red background, but 'delete' shows trash icon
  const baseBg = isSuccess ? 'bg-green-600' : 'bg-red-600';
  const overlayBg = isSuccess ? 'bg-green-300' : 'bg-red-300';

  return (
    <div
      ref={containerRef}
      className={`
        fixed bottom-6 right-6 z-50 max-w-xs w-full
        ${baseBg} text-white rounded-lg shadow-lg overflow-hidden
      `}
    >
      {/* Softer overlay expands from right → left */}
      <div
        ref={overlayRef}
        className={`
          absolute top-0 right-0 bottom-0 ${overlayBg} w-0
        `}
      />

      <div className="relative flex items-center px-4 py-3">
        <svg
          className="w-5 h-5 mr-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          {isSuccess ? (
            // Checkmark icon for success
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          ) : (
            // Trash icon for delete or error
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 6h18M9 6V4h6v2m2 0v14H7V6m4 4v6m-2-6v6m6-6v6"
            />
          )}
        </svg>
        <span className="flex-1 text-sm">{message}</span>
      </div>
    </div>
  );
}
