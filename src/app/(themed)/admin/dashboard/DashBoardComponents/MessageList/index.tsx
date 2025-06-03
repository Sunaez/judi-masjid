// src/app/(themed)/admin/dashboard/DashBoardComponents/MessageList/index.tsx
//TODO: CRUD operations
//TODO: Make preview changes to add to the mosque display (Add a "See preview" to see message using the display component)
'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import type { MessageData, ConditionData } from '../AddMessage/types';
import Display from './Display';
import DeleteModal from './Delete';

export interface MessageRecord {
  id: string;
  data: Omit<MessageData, 'conditions'>;
  createdAt: Timestamp;
  conditionsData: ConditionData[];
}

export default function Database() {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const results = await Promise.all(
          snap.docs.map(async (docSnap) => {
            const raw = docSnap.data() as any;
            const condSnap = await getDocs(
              collection(db, 'messages', docSnap.id, 'conditions')
            );
            const conds = condSnap.docs.map((d) => d.data() as ConditionData);
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
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
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
      // Delete all condition documents
      const condCollRef = collection(db, 'messages', deleteTargetId, 'conditions');
      const condSnap = await getDocs(condCollRef);
      const batch = writeBatch(db);
      condSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      // Delete the main message document
      await deleteDoc(doc(db, 'messages', deleteTargetId));

      // Update local state
      setMessages((prev) => prev.filter((m) => m.id !== deleteTargetId));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to delete message');
    } finally {
      closeModal();
    }
  };

  return (
    <>
      <Display
        messages={messages}
        loading={loading}
        error={error}
        onDeleteClick={openDeleteModal}
      />
      <DeleteModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
