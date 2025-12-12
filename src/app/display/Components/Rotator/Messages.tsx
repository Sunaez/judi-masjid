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
import type { MessageData, ConditionData, AnimationData } from './types';

export interface MessageWithConditions extends MessageData {
  id: string;
  conditions: ConditionData[];
  animations?: AnimationData;
}

export default function useMessages() {
  const [messages, setMessages] = useState<MessageWithConditions[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, async snap => {
      const loaded = await Promise.all(
        snap.docs.map(async (docSnap: QueryDocumentSnapshot<DocumentData>) => {
          const condSnap = await getDocs(collection(docSnap.ref, 'conditions'));
          const data = docSnap.data() as MessageData;
          return {
            id: docSnap.id,
            ...data,
            conditions: condSnap.docs.map(c => c.data() as ConditionData),
            animations: data.animations,
          } as MessageWithConditions;
        })
      );
      setMessages(loaded);
    });
    return () => unsub();
  }, []);

  return messages;
}
