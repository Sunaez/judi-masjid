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
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import type { MessageData, ConditionData, AnimationData } from './types';
import { withTimeout } from '@/lib/withTimeout';
import { isValidCondition, isValidMessage } from './validation';

const READ_TIMEOUT_MS = 20_000;
const INITIAL_RETRY_MS = 5_000;
const MAX_RETRY_MS = 60_000;

export interface MessageWithConditions extends MessageData {
  id: string;
  conditions: ConditionData[];
  animations?: AnimationData;
}

export default function useMessages() {
  const [messages, setMessages] = useState<MessageWithConditions[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    let disposed = false;
    let generation = 0;
    let retryDelay = INITIAL_RETRY_MS;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let request: AbortController | undefined;
    let unsubscribe: Unsubscribe | undefined;

    function cancelPending() {
      generation++;
      clearTimeout(retryTimer);
      request?.abort();
    }

    function retry(task: () => void) {
      retryTimer = setTimeout(task, retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
    }

    async function loadSnapshot(snap: QuerySnapshot<DocumentData>, version: number) {
      if (disposed || version !== generation) return;
      request = new AbortController();
      const isCurrent = () => !disposed && version === generation;
      try {
        const loaded = await withTimeout(Promise.all(
          snap.docs.map(async (docSnap: QueryDocumentSnapshot<DocumentData>) => {
            const condSnap = await getDocs(collection(docSnap.ref, 'conditions'));
            const data = docSnap.data();
            const conditions = condSnap.docs.map(c => c.data());
            if (!isValidMessage(data) || !conditions.every(isValidCondition)) {
              console.error('[Display] Skipping invalid notice:', docSnap.id);
              return null;
            }
            return {
              ...data,
              id: docSnap.id,
              conditions,
              animations: data.animations,
            } as MessageWithConditions;
          })
        ), READ_TIMEOUT_MS, request.signal);
        if (!isCurrent()) return;
        setMessages(loaded.filter((message): message is MessageWithConditions => message !== null));
        retryDelay = INITIAL_RETRY_MS;
      } catch (error) {
        if (!isCurrent()) return;
        console.error('[Display] Failed to load message conditions:', error);
        // Preserve the last complete set; never display messages with missing rules.
        retry(() => { void loadSnapshot(snap, version); });
      }
    }

    function subscribe() {
      if (disposed) return;
      unsubscribe?.();
      unsubscribe = onSnapshot(q, snap => {
        if (disposed) return;
        cancelPending();
        retryDelay = INITIAL_RETRY_MS;
        return loadSnapshot(snap, generation);
      }, error => {
        if (disposed) return;
        cancelPending();
        console.error('[Display] Message subscription failed:', error);
        retry(subscribe);
      });
    }

    subscribe();
    return () => {
      disposed = true;
      cancelPending();
      unsubscribe?.();
    };
  }, []);

  return messages;
}
