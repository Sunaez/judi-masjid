// src/app/(themed)/admin/dashboard/DashBoardComponents/MessageList/index.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

import type { MessageData, ConditionData } from '../AddMessage/types';
import Display from './Display';
import DeleteModal from './Delete';
import Notification from '../Notification';

export interface MessageRecord {
  id: string;
  data: Omit<MessageData, 'conditions'>;
  createdAt: Timestamp;
  conditionsData: ConditionData[];
}

// 1) Define a props interface including onAddAnimation
interface MessageListProps {
  onAddAnimation: (msg: MessageRecord) => void;
}

export default function MessageList({ onAddAnimation }: MessageListProps) {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Notification state for delete success/failure
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'delete';
    message: string;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      async (snapshot) => {
        try {
          const results: MessageRecord[] = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const raw = docSnap.data() as any;

              if (!(raw.createdAt instanceof Timestamp)) {
                console.warn(
                  `Document ${docSnap.id} has no valid createdAt. Using fallback.`
                );
              }

              let conds: ConditionData[] = [];
              try {
                const condSnap = await getDocs(
                  collection(db, 'messages', docSnap.id, 'conditions')
                );
                conds = condSnap.docs.map((d) => d.data() as ConditionData);
              } catch (subErr) {
                console.error(
                  `Error fetching conditions for message ${docSnap.id}:`,
                  subErr
                );
              }

              return {
                id: docSnap.id,
                data: {
                  sourceType: raw.sourceType,
                  quran: raw.quran,
                  hadith: raw.hadith,
                  other: raw.other,
                },
                createdAt: raw.createdAt ?? Timestamp.fromDate(new Date(0)),
                conditionsData: conds,
              };
            })
          );

          setMessages(results);
          setLoading(false);
        } catch (err: any) {
          console.error('Error inside onSnapshot callback:', err);
          setError(err.message || 'Failed to load messages (inside snapshot).');
          setLoading(false);
        }
      },
      (listenErr) => {
        console.error('Listener error (onSnapshot):', listenErr);
        setError(listenErr.message || 'Failed to listen for messages.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const openDeleteModal = (id: string) => {
    setDeleteTargetId(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDeleteTargetId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      // Delete all condition documents in batch
      const condCollRef = collection(db, 'messages', deleteTargetId, 'conditions');
      const condSnap = await getDocs(condCollRef);
      const batch = writeBatch(db);
      condSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      // Delete the main message document
      await deleteDoc(doc(db, 'messages', deleteTargetId));

      // Optimistically update local state
      setMessages((prev) => prev.filter((m) => m.id !== deleteTargetId));

      // Show **red + trash** notification on delete
      setToast({ type: 'delete', message: 'Message successfully deleted' });
    } catch (err: any) {
      console.error('Error deleting message:', err);
      setToast({ type: 'error', message: err.message || 'Failed to delete message' });
    } finally {
      closeModal();
    }
  };

  return (
    <>
      {/* 2) Pass onAddAnimation down into <Display> */}
      <Display
        messages={messages}
        loading={loading}
        error={error}
        onDeleteClick={openDeleteModal}
        onAddAnimation={onAddAnimation}
      />

      <DeleteModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
      />

      {toast && (
        <Notification
          type={toast.type}
          message={toast.message}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}
