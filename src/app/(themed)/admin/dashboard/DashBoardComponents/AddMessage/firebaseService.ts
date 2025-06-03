// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/firebaseService.ts
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  DocumentReference,
} from 'firebase/firestore';
import type { MessageData, ConditionData } from './types';

/**
 * Creates a new message doc under "messages" and then
 * writes each condition into messages/{msgId}/conditions.
 */
export async function saveMessageWithConditions(
  messagePayload: Omit<MessageData, 'conditions'>,
  conditions: ConditionData[]
): Promise<DocumentReference> {
  // 1) write the parent message
  const msgRef = await addDoc(
    collection(db, 'messages'),
    {
      ...messagePayload,
      createdAt: serverTimestamp(),
    }
  );

  // 2) write each condition into subcollection "conditions"
  await Promise.all(
    conditions.map(cond =>
      addDoc(collection(msgRef, 'conditions'), cond)
    )
  );

  return msgRef;
}
