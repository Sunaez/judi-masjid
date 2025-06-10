// src/app/display/Components/Rotator/Messages.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { MessageData, ConditionData } from './types';

export interface MessageWithConditions extends MessageData {
  id: string;
  conditions: ConditionData[];
}

export default function useMessages() {
  const [messages, setMessages] = useState<MessageWithConditions[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, async snap => {
      const loaded = await Promise.all(
        snap.docs.map(async (doc: QueryDocumentSnapshot<DocumentData>) => {
          const condSnap = await getDocs(collection(doc.ref, 'conditions'));
          return {
            id: doc.id,
            ...(doc.data() as MessageData),
            conditions: condSnap.docs.map(c => c.data() as ConditionData),
          } as MessageWithConditions;
        })
      );
      setMessages(loaded);
    });
    return () => unsub();
  }, []);

  return messages;
}
