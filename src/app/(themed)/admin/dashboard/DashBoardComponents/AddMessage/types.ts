// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/types.ts

export type ConditionType = 'normal' | 'time' | 'prayer' | 'weather' | 'day';
export type SourceType    = 'quran' | 'hadith' | 'other';

export interface TimeEntry   { from: string; to: string; }
export interface PrayerEntry {
  when: 'before' | 'after' | 'both';
  name: string;
  duration: number;
}

export interface SurahInfo {
  surah_no: string;
  surah_name_roman: string;
  total_ayah_surah: string;
}
export interface VerseRecord extends Record<string,string> {
  surah_no:         string;
  ayah_no_surah:    string;
  ayah_ar:          string;
  ayah_en:          string;
  surah_name_roman: string;
  total_ayah_surah: string;
}

// Export the weather list so useAddMessage can import it
export const weatherGroups = [
  'Clear','Cloudy','Rain','Snow','Sleet','Drizzle','Fog','Thunder','Ice'
];

export type AnimationType = 'fade' | 'slide' | 'bounce' | 'zoom' | 'word-appear';

export interface AnimationConfig {
  enabled: boolean;
  animation: AnimationType;
  duration: number;
}

export interface AnimationData {
  [key: string]: AnimationConfig;
}

/**
 * The full message payload (minus createdAt) you send to Firestore
 */
export interface MessageData {
  sourceType: SourceType;
  quran?: {
    surah: string;
    startAyah: number;
    endAyah: number;
    arabicText: string;
    englishText: string;
  };
  hadith?: {
    author: string;
    number: number;
    authenticity: string;
    arabicText: string;
    englishText: string;
  };
  other?: {
    arabicText: string;
    englishText: string;
  };
  conditions: ConditionData[];
  animations?: AnimationData;
}

/**
 * Each document in messages/{msgId}/conditions
 */
export type ConditionData =
  | { type: 'normal' }
  | { type: 'time';    entries: TimeEntry[] }
  | { type: 'prayer';  entries: PrayerEntry[] }
  | { type: 'weather'; entries: { weather: string }[] }
  | { type: 'day';     entries: string[] };
