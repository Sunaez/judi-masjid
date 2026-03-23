// src/lib/firebase/timetableStorage.ts
// Stores timetable images as base64 data URLs directly in Firestore.
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ---------- Types ----------

export interface TimetableFile {
  id: string;
  originalName: string;
  /** base64 data URL (data:image/...;base64,...) */
  imageData: string;
  contentType: string;
  size: number;
  label: string;
  archived: boolean;
  active: boolean;
  uploadedAt: Timestamp;
}

// ---------- Constants ----------

const COLLECTION = 'timetables';
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB input limit
// Firestore doc limit is ~1 MiB. We compress to keep data URL under ~900 KB.
const MAX_DATA_URL_BYTES = 900 * 1024;

// ---------- Validation ----------

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Invalid file type. Only PNG, JPG, and JPEG files are allowed.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
  }
  return null;
}

// ---------- Image compression ----------

/**
 * Compresses an image file into a base64 data URL that fits within Firestore's
 * document size limit. Uses canvas to resize and re-encode as JPEG.
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Try original size first, then progressively shrink
        let quality = 0.85;
        let scale = 1;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const attempt = (): string => {
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          canvas.width = w;
          canvas.height = h;
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          return canvas.toDataURL('image/jpeg', quality);
        };

        let dataUrl = attempt();

        // Progressively reduce quality and scale until it fits
        while (dataUrl.length > MAX_DATA_URL_BYTES && quality > 0.3) {
          quality -= 0.1;
          dataUrl = attempt();
        }
        while (dataUrl.length > MAX_DATA_URL_BYTES && scale > 0.2) {
          scale -= 0.1;
          quality = 0.7;
          dataUrl = attempt();
        }

        if (dataUrl.length > MAX_DATA_URL_BYTES) {
          reject(new Error('Image is too large even after compression. Try a smaller image.'));
          return;
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ---------- Upload ----------

export async function uploadTimetable(
  file: File,
  label: string,
  onProgress?: (progress: number) => void
): Promise<TimetableFile> {
  onProgress?.(10);

  const imageData = await compressImage(file);
  onProgress?.(60);

  const docRef = await addDoc(collection(db, COLLECTION), {
    originalName: file.name,
    imageData,
    contentType: 'image/jpeg',
    size: file.size,
    label,
    archived: false,
    active: false,
    uploadedAt: serverTimestamp(),
  });

  onProgress?.(100);

  return {
    id: docRef.id,
    originalName: file.name,
    imageData,
    contentType: 'image/jpeg',
    size: file.size,
    label,
    archived: false,
    active: false,
    uploadedAt: null as unknown as Timestamp,
  };
}

// ---------- List ----------

export async function getTimetables(): Promise<TimetableFile[]> {
  const q = query(collection(db, COLLECTION), orderBy('uploadedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TimetableFile));
}

export async function getActiveTimetable(): Promise<TimetableFile | null> {
  const q = query(
    collection(db, COLLECTION),
    where('active', '==', true),
    where('archived', '==', false)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as TimetableFile;
}

// ---------- Set Active ----------

export async function setActiveTimetable(id: string): Promise<void> {
  // Deactivate all current active timetables
  const q = query(collection(db, COLLECTION), where('active', '==', true));
  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map((d) => updateDoc(d.ref, { active: false }));
  await Promise.all(updates);

  // Activate the selected one
  await updateDoc(doc(db, COLLECTION, id), { active: true, archived: false });
}

// ---------- Archive / Restore ----------

export async function archiveTimetable(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { archived: true, active: false });
}

export async function restoreTimetable(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { archived: false });
}

// ---------- Delete ----------

export async function deleteTimetable(timetable: TimetableFile): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, timetable.id));
}

// ---------- Helpers ----------

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
