// src/app/(themed)/admin/dashboard/DashBoardComponents/MessageList/Delete.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteModal({ isOpen, onClose, onConfirm }: DeleteModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (overlayRef.current) {
        gsap.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Fade-in blur overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="
          relative bg-[var(--background-start)] rounded-2xl shadow-xl
          max-w-2xl w-full p-8 z-10 ring-2 ring-[var(--secondary-color)]
        "
      >
        <h2 className="text-2xl font-semibold mb-4 text-[var(--accent-color)]">
          Confirm Delete
        </h2>
        <p className="text-[var(--text-color)] mb-6">
          Are you sure you want to delete this message? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="
              px-5 py-2 rounded-lg border
              border-[var(--secondary-color)] text-[var(--text-color)]
              transform transition-transform duration-200 hover:scale-105
            "
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="
              px-5 py-2 rounded-lg bg-[var(--accent-color)] text-[var(--x-text-color)]
              transform transition-transform duration-200 hover:scale-105
            "
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
