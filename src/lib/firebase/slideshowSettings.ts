import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type FirestoreError,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';

const SLIDESHOW_STATE_REF = doc(db, 'state', 'slideshow');

export async function saveSlideIndex(index: number): Promise<void> {
  await setDoc(
    SLIDESHOW_STATE_REF,
    { slideIndex: index, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export function subscribeSlideIndex(
  onChange: (index: number) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    SLIDESHOW_STATE_REF,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.slideIndex === 'number' && data.slideIndex >= 0) {
          onChange(data.slideIndex);
        }
      }
    },
    onError
  );
}

export interface SlideshowSettings {
  active: boolean;
  startTime: string | null;
  endTime: string | null;
  updatedAt?: Timestamp;
}

export type EditableSlideshowSettings = Pick<
  SlideshowSettings,
  'active' | 'startTime' | 'endTime'
>;

export const DEFAULT_SLIDESHOW_SETTINGS: SlideshowSettings = {
  active: false,
  startTime: null,
  endTime: null,
};

const SLIDESHOW_SETTINGS_REF = doc(db, 'settings', 'slideshow');
const DAILY_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toClockTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function normalizeDailyTimeValue(value: string | null): string {
  if (!value) return '';

  if (DAILY_TIME_PATTERN.test(value)) {
    return value;
  }

  const legacyDate = new Date(value);
  if (!Number.isNaN(legacyDate.getTime())) {
    return toClockTime(legacyDate);
  }

  return '';
}

export function dailyTimeToMinutes(value: string | null): number | null {
  const normalized = normalizeDailyTimeValue(value);
  const match = DAILY_TIME_PATTERN.exec(normalized);

  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

function normalizeSlideshowSettings(data: unknown): SlideshowSettings {
  if (!data || typeof data !== 'object') {
    return DEFAULT_SLIDESHOW_SETTINGS;
  }

  const value = data as Record<string, unknown>;

  return {
    active: value.active === true,
    startTime:
      typeof value.startTime === 'string'
        ? normalizeDailyTimeValue(value.startTime) || null
        : null,
    endTime:
      typeof value.endTime === 'string'
        ? normalizeDailyTimeValue(value.endTime) || null
        : null,
    updatedAt: value.updatedAt as Timestamp | undefined,
  };
}

export function subscribeSlideshowSettings(
  onChange: (settings: SlideshowSettings) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    SLIDESHOW_SETTINGS_REF,
    (snapshot) => {
      onChange(
        snapshot.exists()
          ? normalizeSlideshowSettings(snapshot.data())
          : DEFAULT_SLIDESHOW_SETTINGS
      );
    },
    onError
  );
}

export async function saveSlideshowSettings(
  settings: EditableSlideshowSettings
): Promise<void> {
  await setDoc(
    SLIDESHOW_SETTINGS_REF,
    {
      active: settings.active,
      startTime: normalizeDailyTimeValue(settings.startTime) || null,
      endTime: normalizeDailyTimeValue(settings.endTime) || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function clearSlideshowSettings(): Promise<void> {
  await setDoc(
    SLIDESHOW_SETTINGS_REF,
    {
      active: false,
      startTime: null,
      endTime: null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function isSlideshowWindowActive(
  settings: SlideshowSettings | null,
  now: Date = new Date()
): boolean {
  if (!settings?.active || !settings.startTime || !settings.endTime) {
    return false;
  }

  const start = dailyTimeToMinutes(settings.startTime);
  const end = dailyTimeToMinutes(settings.endTime);

  if (start === null || end === null || start === end) {
    return false;
  }

  const current = now.getHours() * 60 + now.getMinutes();

  if (start < end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}
