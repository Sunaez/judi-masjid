// src/app/(themed)/admin/dashboard/ClientDashboard.tsx
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import NavBar from '../AdminComponents/NavBar';
import MessageList from './DashBoardComponents/MessageList';
import Notification from './DashBoardComponents/Notification';

const AddMessage = dynamic(
  () => import('./DashBoardComponents/AddMessage'),
  { ssr: false }
);
const AddAnimation = dynamic(
  () => import('./DashBoardComponents/AddAnimation'),
  { ssr: false }
);
const SyncPrayerTimes = dynamic(
  () => import('./DashBoardComponents/SyncPrayerTimes'),
  { ssr: false }
);

export default function ClientDashboard() {
  const [isMessageModalOpen, setMessageModalOpen] = useState(false);
  const [messageChildIsClosing, setMessageChildIsClosing] = useState(false);

  const [isAnimModalOpen, setAnimModalOpen] = useState(false);
  const [animChildIsClosing, setAnimChildIsClosing] = useState(false);
  const [selectedMessageForAnimation, setSelectedMessageForAnimation] = useState<any>(null);

  const [isSyncModalOpen, setSyncModalOpen] = useState(false);
  const [syncChildIsClosing, setSyncChildIsClosing] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openMessageModal = () => {
    setMessageChildIsClosing(false);
    setMessageModalOpen(true);
  };
  const handleMessageChildClose = () => {
    setMessageChildIsClosing(false);
    setMessageModalOpen(false);
  };
  const handleMessageSuccessToast = () => setToast({ type: 'success', message: 'Message added successfully' });
  const handleMessageErrorToast = (msg: string) => setToast({ type: 'error', message: msg });

  const openAnimModal = (msg: any) => {
    setSelectedMessageForAnimation(msg);
    setAnimChildIsClosing(false);
    setAnimModalOpen(true);
  };
  const handleAnimChildClose = () => {
    setAnimChildIsClosing(false);
    setAnimModalOpen(false);
    setSelectedMessageForAnimation(null);
  };
  const handleAnimSuccessToast = () => setToast({ type: 'success', message: 'Animation previewed successfully' });
  const handleAnimErrorToast = (msg: string) => setToast({ type: 'error', message: msg });

  const openSyncModal = () => {
    setSyncChildIsClosing(false);
    setSyncModalOpen(true);
  };
  const handleSyncChildClose = () => {
    setSyncChildIsClosing(false);
    setSyncModalOpen(false);
  };
  const handleSyncSuccessToast = (msg: string) => setToast({ type: 'success', message: msg });
  const handleSyncErrorToast = (msg: string) => setToast({ type: 'error', message: msg });

  const handleBackdropClick = () => {
    if (!messageChildIsClosing && isMessageModalOpen) {
      setMessageModalOpen(false);
    }
    if (!animChildIsClosing && isAnimModalOpen) {
      setAnimModalOpen(false);
      setSelectedMessageForAnimation(null);
    }
    if (!syncChildIsClosing && isSyncModalOpen) {
      setSyncModalOpen(false);
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
          <button
            onClick={openMessageModal}
            className="py-3 px-6 bg-[var(--accent-color)] text-[var(--background-end)] font-semibold rounded-md hover:opacity-90 transition flex items-center"
          >
            {/* svg icon omitted for brevity */}
            Add Message
          </button>

          <button
            onClick={openSyncModal}
            className="py-3 px-6 bg-[var(--accent-color)] text-[var(--background-end)] font-semibold rounded-md hover:opacity-90 transition flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Sync Prayer Times
          </button>

          <a
            href="/admin/dashboard/prayer-times-editor"
            className="py-3 px-6 bg-[var(--accent-color)] text-[var(--background-end)] font-semibold rounded-md hover:opacity-90 transition flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Local Prayer Times Editor
          </a>

          <a
            href="https://docs.google.com/spreadsheets/d/1TqARmQOth6B1BEA8wx-EHGJY-bgEeCtYDHqeYTRmISc/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-6 bg-[var(--accent-color)] text-[var(--background-end)] font-semibold rounded-md hover:opacity-90 transition flex items-center"
          >
            {/* svg icon omitted for brevity */}
            Manage timetable Spreadsheet
          </a>

          <a
            href="https://trello.com/b/9jKqsYXt"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-6 bg-[var(--accent-color)] text-[var(--background-end)] font-semibold rounded-md hover:opacity-90 transition flex items-center"
          >
            {/* svg icon omitted for brevity */}
            Trello Board
          </a>
        </div>

        {isMessageModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
            onClick={handleBackdropClick}
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
                  onClick={() => !messageChildIsClosing && setMessageModalOpen(false)}
                  className="text-2xl font-bold text-[var(--text-color)] hover:opacity-70"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <AddMessage
                onClose={handleMessageChildClose}
                setClosing={setMessageChildIsClosing}
                onSuccess={handleMessageSuccessToast}
                onError={handleMessageErrorToast}
              />
            </div>
          </div>
        )}

        {isAnimModalOpen && selectedMessageForAnimation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
            onClick={handleBackdropClick}
          >
            <div
              className="bg-[var(--background-end)] rounded-2xl shadow-2xl w-full sm:w-11/12 lg:w-4/5 xl:w-3/4 max-w-screen-xl max-h-[95vh] overflow-y-auto p-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-green-500">
                  Add Animation
                </h2>
                <button
                  onClick={() => !animChildIsClosing && handleAnimChildClose()}
                  className="text-2xl font-bold text-[var(--text-color)] hover:opacity-70"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <AddAnimation
                message={selectedMessageForAnimation}
                onClose={handleAnimChildClose}
                setClosing={setAnimChildIsClosing}
                onSuccess={handleAnimSuccessToast}
                onError={handleAnimErrorToast}
              />
            </div>
          </div>
        )}

        {isSyncModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
            onClick={handleBackdropClick}
          >
            <div
              className="bg-[var(--background-end)] rounded-2xl shadow-2xl w-full sm:w-11/12 lg:w-3/5 max-w-3xl max-h-[95vh] overflow-y-auto p-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[var(--accent-color)]">
                  Sync Prayer Times
                </h2>
                <button
                  onClick={() => !syncChildIsClosing && setSyncModalOpen(false)}
                  className="text-2xl font-bold text-[var(--text-color)] hover:opacity-70"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <SyncPrayerTimes
                onClose={handleSyncChildClose}
                setClosing={setSyncChildIsClosing}
                onSuccess={handleSyncSuccessToast}
                onError={handleSyncErrorToast}
              />
            </div>
          </div>
        )}

        {toast && (
          <Notification
            type={toast.type}
            message={toast.message}
            onDone={() => setToast(null)}
          />
        )}

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
