// src/app/(themed)/admin/dashboard/page.tsx
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import NavBar from '../AdminComponents/NavBar';
import MessageList from './DashBoardComponents/MessageList';

// Turn off SSR for AddMessage to avoid hydration mismatch
const AddMessage = dynamic(
  () => import('./DashBoardComponents/AddMessage'),
  { ssr: false }
);

export default function AdminDashboardPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal  = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <div className="flex-grow bg-gradient-to-b from-[var(--background-start)] to-[var(--background-end)] p-6">
        <h1 className="text-4xl font-bold text-[var(--accent-color)] mb-8">
          Admin Dashboard
        </h1>

        <button
          onClick={openModal}
          className="mb-6 py-3 px-6 bg-[var(--accent-color)] text-[var(--background-end)] font-semibold rounded-md hover:opacity-90 transition"
        >
          Add Message
        </button>

        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
            onClick={closeModal}
          >
            <div
              className="bg-[var(--background-end)] rounded-2xl shadow-2xl w-full sm:w-11/12 lg:w-4/5 xl:w-3/4 max-w-screen-xl max-h-[95vh] overflow-y-auto p-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[var(--accent-color)]">
                  Add Message
                </h2>
                <button
                  onClick={closeModal}
                  className="text-2xl font-bold text-[var(--text-color)] hover:opacity-70"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              <AddMessage />
            </div>
          </div>
        )}

        {/* Message list */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-[var(--accent-color)] mb-4">
            Existing Messages
          </h2>
          <MessageList />
        </div>
      </div>
    </div>
  );
}
