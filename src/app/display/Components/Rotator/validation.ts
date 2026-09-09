import type { ConditionData, MessageData } from './types';

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const time = (value: unknown) => typeof value === 'string' && /^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(value);
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function isValidCondition(value: unknown): value is ConditionData {
  if (!record(value)) return false;
  if (value.type === 'normal') return true;
  if (!Array.isArray(value.entries)) return false;
  return value.entries.every(entry => {
    if (value.type === 'day') return typeof entry === 'string' && days.includes(entry);
    if (!record(entry)) return false;
    switch (value.type) {
      case 'time': return time(entry.from) && time(entry.to);
      case 'weather': return typeof entry.weather === 'string' && entry.weather.length > 0;
      case 'prayer': return typeof entry.name === 'string' &&
        ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(entry.name.toLowerCase()) &&
        ['before', 'after', 'both'].includes(String(entry.when)) &&
        typeof entry.duration === 'number' && Number.isFinite(entry.duration) &&
        entry.duration >= 0 && entry.duration <= 1440;
      default: return false;
    }
  }) && ['time', 'weather', 'prayer', 'day'].includes(String(value.type));
}

export function isValidMessage(value: unknown): value is MessageData {
  if (!record(value) || !['quran', 'hadith', 'other'].includes(String(value.sourceType))) return false;
  const content = value[String(value.sourceType)];
  if (!record(content)) return false;
  for (const key of ['arabicText', 'englishText', 'surah', 'author', 'authenticity']) {
    if (content[key] !== undefined && typeof content[key] !== 'string') return false;
  }
  for (const key of ['startAyah', 'endAyah', 'number']) {
    // The existing editor saves blank optional references as an empty string.
    if (content[key] !== undefined && content[key] !== '' &&
        (typeof content[key] !== 'number' || !Number.isFinite(content[key]))) return false;
  }
  if (value.animations !== undefined) {
    if (!record(value.animations)) return false;
    if (!Object.values(value.animations).every(config => record(config) &&
      typeof config.enabled === 'boolean' &&
      ['fade', 'slide', 'bounce', 'zoom', 'word-appear'].includes(String(config.animation)) &&
      typeof config.duration === 'number' && Number.isFinite(config.duration) && config.duration >= 0)) return false;
  }
  return true;
}
