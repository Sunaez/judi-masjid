// src/app/display/Components/Rotator/types.ts

export type ConditionType = 'normal' | 'time' | 'prayer' | 'weather' | 'day';

export interface TimeEntry   { from: string; to: string; }
export interface PrayerEntry {
  when: 'before' | 'after' | 'both';
  name: string;
  duration: number;
}

export type ConditionData =
  | { type: 'normal' }
  | { type: 'time';    entries: TimeEntry[] }
  | { type: 'prayer';  entries: PrayerEntry[] }
  | { type: 'weather'; entries: { weather: string }[] }
  | { type: 'day';     entries: string[] };

export type SourceType = 'quran' | 'hadith' | 'other';

export type AnimationType = 'fade' | 'slide' | 'bounce' | 'zoom' | 'word-appear';

export interface AnimationConfig {
  enabled: boolean;
  animation: AnimationType;
  duration: number;
}

export interface AnimationData {
  [key: string]: AnimationConfig;
}

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
  animations?: AnimationData;
}
