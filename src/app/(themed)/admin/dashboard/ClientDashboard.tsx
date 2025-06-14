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

export default function ClientDashboard() {
  const [isMessageModalOpen, setMessageModalOpen] = useState(false);
  const [messageChildIsClosing, setMessageChildIsClosing] = useState(false);

  const [isAnimModalOpen, setAnimModalOpen] = useState(false);
  const [animChildIsClosing, setAnimChildIsClosing] = useState(false);
  const [selectedMessageForAnimation, setSelectedMessageForAnimation] = useState<any>(null);

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
          <button
            onClick={openMessageModal}
            className="py-3 px-6 bg-[var(--accent-color)] text-[var(--background-end)] font-semibold rounded-md hover:opacity-90 transition flex items-center"
          >
            {/* svg icon omitted for brevity */}
            Add Message
          </button>

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
