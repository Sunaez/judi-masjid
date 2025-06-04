// src/app/(themed)/admin/dashboard/page.tsx
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import NavBar from '../AdminComponents/NavBar';
import MessageList from './DashBoardComponents/MessageList';
import Notification from './DashBoardComponents/Notification';

// Turn off SSR for AddMessage to avoid hydration mismatch
const AddMessage = dynamic(
  () => import('./DashBoardComponents/AddMessage'),
  { ssr: false }
);

// Turn off SSR for AddAnimation
const AddAnimation = dynamic(
  () => import('./DashBoardComponents/AddAnimation'),
  { ssr: false }
);

export default function AdminDashboardPage() {
  // ─── State for AddMessage modal ─────────────────────────────────────
  const [isMessageModalOpen, setMessageModalOpen] = useState(false);
  const [messageChildIsClosing, setMessageChildIsClosing] = useState(false);

  // ─── State for AddAnimation modal ──────────────────────────────────
  const [isAnimModalOpen, setAnimModalOpen] = useState(false);
  const [animChildIsClosing, setAnimChildIsClosing] = useState(false);
  const [selectedMessageForAnimation, setSelectedMessageForAnimation] = useState<null | any>(null);

  // ─── Page‐level toast state ─────────────────────────────────────────
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // ─── Handlers for AddMessage ────────────────────────────────────────
  const openMessageModal = () => {
    setMessageChildIsClosing(false);
    setMessageModalOpen(true);
  };
  const handleMessageChildClose = () => {
    setMessageModalOpen(false);
    setMessageChildIsClosing(false);
  };
  const handleMessageSuccessToast = () => {
    setToast({ type: 'success', message: 'Message added successfully' });
  };
  const handleMessageErrorToast = (msg: string) => {
    setToast({ type: 'error', message: msg });
  };
  // ───────────────────────────────────────────────────────────────────

  // ─── Handlers for AddAnimation ─────────────────────────────────────
  const openAnimModal = (msg: any) => {
    setSelectedMessageForAnimation(msg);
    setAnimChildIsClosing(false);
    setAnimModalOpen(true);
  };
  const handleAnimChildClose = () => {
    setAnimModalOpen(false);
    setAnimChildIsClosing(false);
    setSelectedMessageForAnimation(null);
  };
  const handleAnimSuccessToast = () => {
    setToast({ type: 'success', message: 'Animation previewed successfully' });
  };
  const handleAnimErrorToast = (msg: string) => {
    setToast({ type: 'error', message: msg });
  };
  // ───────────────────────────────────────────────────────────────────

  // If backdrop clicked while neither child is closing, close modals
  const handleBackdropClick = () => {
    if (!messageChildIsClosing && isMessageModalOpen) {
      setMessageModalOpen(false);
    }
    if (!animChildIsClosing && isAnimModalOpen) {
      setAnimModalOpen(false);
      setSelectedMessageForAnimation(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <div className="flex-grow bg-gradient-to-b from-[var(--background-start)] to-[var(--background-end)] p-6">
        <h1 className="text-4xl font-bold text-[var(--accent-color)] mb-8">
          Admin Dashboard
        </h1>

        <div className="flex items-center space-x-4 mb-6">
          {/* Add Message Button */}
          <button
            onClick={openMessageModal}
            className="py-3 px-6 bg-[var(--accent-color)] text-[var(--background-end)] font-semibold rounded-md hover:opacity-90 transition flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 mr-2 flex-shrink-0"
            >
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
            Add Message
          </button>

          <a
            href="https://docs.google.com/spreadsheets/d/1TqARmQOth6B1BEA8wx-EHGJY-bgEeCtYDHqeYTRmISc/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-6 bg-[var(--accent-color)] text-[var(--background-end)] font-semibold rounded-md hover:opacity-90 transition flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="w-5 h-5 mr-2 flex-shrink-0 text-green-500"
            >
              <path
                fill="currentColor"
                d="M3 3h18v18H3V3zm2 2v4h4V5H5zm0 6v4h4v-4H5zm0 6v4h4v-4H5zm6-12v4h4V5h-4zm0 6v4h4v-4h-4zm0 6v4h4v-4h-4zm6-12v4h4V5h-4zm0 6v4h4v-4h-4zm0 6v4h4v-4h-4z"
              />
            </svg>
            Manage timetable Spreadsheet
          </a>

          <a
            href="https://trello.com/b/9jKqsYXt"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-6 bg-[var(--accent-color)] text-[var(--background-end)] font-semibold rounded-md hover:opacity-90 transition flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="w-5 h-5 mr-2 flex-shrink-0 text-blue-500"
            >
              <path
                fill="currentColor"
                d="M2 0C.9 0 0 .9 0 2v20c0 1.1 .9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2H2zm6 4h4v16H8V4zm8 6h4v10h-4V10z"
              />
            </svg>
            Trello Board
          </a>
        </div>

        {/* Add Message Modal */}
        {isMessageModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
            onClick={handleBackdropClick}
          >
            <div
              className="bg-[var(--background-end)] rounded-2xl shadow-2xl w-full sm:w-11/12 lg:w-4/5 xl:w-3/4 max-w-screen-xl max-h-[95vh] overflow-y-auto p-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[var(--accent-color)]">
                  Add Message
                </h2>
                <button
                  onClick={() => {
                    if (!messageChildIsClosing) {
                      setMessageModalOpen(false);
                    }
                  }}
                  className="text-2xl font-bold text-[var(--text-color)] hover:opacity-70"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              <AddMessage
                onClose={handleMessageChildClose}
                setClosing={(flag) => setMessageChildIsClosing(flag)}
                onSuccess={handleMessageSuccessToast}
                onError={handleMessageErrorToast}
              />
            </div>
          </div>
        )}

        {/* Add Animation Modal */}
        {isAnimModalOpen && selectedMessageForAnimation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
            onClick={handleBackdropClick}
          >
            <div
              className="bg-[var(--background-end)] rounded-2xl shadow-2xl w-full sm:w-11/12 lg:w-4/5 xl:w-3/4 max-w-screen-xl max-h-[95vh] overflow-y-auto p-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-green-500">
                  Add Animation
                </h2>
                <button
                  onClick={() => {
                    if (!animChildIsClosing) {
                      setAnimModalOpen(false);
                      setSelectedMessageForAnimation(null);
                    }
                  }}
                  className="text-2xl font-bold text-[var(--text-color)] hover:opacity-70"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              <AddAnimation
                message={selectedMessageForAnimation}
                onClose={handleAnimChildClose}
                setClosing={(flag) => setAnimChildIsClosing(flag)}
                onSuccess={handleAnimSuccessToast}
                onError={handleAnimErrorToast}
              />
            </div>
          </div>
        )}

        {/* Page‐level Notification */}
        {toast && (
          <Notification
            type={toast.type}
            message={toast.message}
            onDone={() => setToast(null)}
          />
        )}

        {/* Message list (pass onAddAnimation down) */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-[var(--accent-color)] mb-4">
            Existing Messages
          </h2>
          <MessageList onAddAnimation={openAnimModal} />
        </div>
      </div>
    </div>
  );
}
