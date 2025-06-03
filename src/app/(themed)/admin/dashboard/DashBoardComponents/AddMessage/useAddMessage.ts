// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/useAddMessage.ts
import { useState, useEffect } from 'react';
import {
  ConditionType,
  SourceType,
  TimeEntry,
  PrayerEntry,
  SurahInfo,
  VerseRecord,
  weatherGroups,
} from './types';
import { saveMessageWithConditions } from './firebaseService';

export function useAddMessage(
  allVerses: VerseRecord[],
  surahList: SurahInfo[],
) {
  // ── Source & text fields ─────────────────────────────────────────────
  const [sourceType, setSourceType] = useState<SourceType>('quran');
  const [surah, setSurah] = useState<string>('');
  const [startAyah, setStartAyah] = useState<number | ''>('');
  const [endAyah, setEndAyah] = useState<number | ''>('');
  const [arabicText, setArabicText] = useState<string>('');
  const [englishText, setEnglishText] = useState<string>('');
  const [hadithAuthor, setHadithAuthor] = useState<string>('');
  const [hadithNumber, setHadithNumber] = useState<number | ''>('');
  const [hadithAuth, setHadithAuth] = useState<string>('');

  // ── Condition state arrays ────────────────────────────────────────────
  const [conditions, setConditions] = useState<ConditionType[]>(['normal']);

  const [timeEntries, setTimeEntries]           = useState<TimeEntry[][]>([[]]);
  const [newTimeFroms, setNewTimeFroms]         = useState<string[]>(['']);
  const [newTimeTos, setNewTimeTos]             = useState<string[]>(['']);

  const [prayerEntries, setPrayerEntries]       = useState<PrayerEntry[][]>([[]]);
  const [newPrayerWhens, setNewPrayerWhens]     = useState<('before'|'after'|'both')[]>(['after']);
  const [newPrayerNames, setNewPrayerNames]     = useState<string[]>(['Fajr']);
  const [newPrayerDurations, setNewPrayerDurations] = useState<number[]>([10]);

  const [weatherEntries, setWeatherEntries]     = useState<string[][]>([[]]);
  const [newWeathers, setNewWeathers]           = useState<string[]>([weatherGroups[0]]);

  const [dateEntries, setDateEntries]           = useState<string[][]>([[]]);

  // ── Condition handlers ────────────────────────────────────────────────
  function addCondition() {
    setConditions(c => [...c, 'normal']);
    setTimeEntries(te => [...te, []]);
    setNewTimeFroms(tf => [...tf, '']);
    setNewTimeTos(tt => [...tt, '']);
    setPrayerEntries(pe => [...pe, []]);
    setNewPrayerWhens(npw => [...npw, 'after']);
    setNewPrayerNames(npn => [...npn, 'Fajr']);
    setNewPrayerDurations(npd => [...npd, 10]);
    setWeatherEntries(we => [...we, []]);
    setNewWeathers(nw => [...nw, weatherGroups[0]]);
    setDateEntries(de => [...de, []]);
  }

  function removeCondition(idx: number) {
    setConditions(c => c.filter((_, i) => i !== idx));
    setTimeEntries(te => te.filter((_, i) => i !== idx));
    setNewTimeFroms(tf => tf.filter((_, i) => i !== idx));
    setNewTimeTos(tt => tt.filter((_, i) => i !== idx));
    setPrayerEntries(pe => pe.filter((_, i) => i !== idx));
    setNewPrayerWhens(npw => npw.filter((_, i) => i !== idx));
    setNewPrayerNames(npn => npn.filter((_, i) => i !== idx));
    setNewPrayerDurations(npd => npd.filter((_, i) => i !== idx));
    setWeatherEntries(we => we.filter((_, i) => i !== idx));
    setNewWeathers(nw => nw.filter((_, i) => i !== idx));
    setDateEntries(de => de.filter((_, i) => i !== idx));
  }

  function updateCondition(idx: number, newType: ConditionType) {
    setConditions(c => c.map((v, i) => (i === idx ? newType : v)));
  }

  // ── Time condition ────────────────────────────────────────────────────
  function addTime(idx: number) {
    const from = newTimeFroms[idx], to = newTimeTos[idx];
    if (!from || !to) return;
    const [fH, fM] = from.split(':').map(Number);
    const [tH, tM] = to.split(':').map(Number);
    const fMin = fH * 60 + fM, tMin = tH * 60 + tM;
    if (tMin <= fMin) return;
    setTimeEntries(te => te.map((arr, i) => i === idx ? [...arr, { from, to }] : arr));
    setNewTimeFroms(tf => tf.map((v, i) => i === idx ? '' : v));
    setNewTimeTos(tt => tt.map((v, i) => i === idx ? '' : v));
  }
  function removeTime(idx: number, i: number) {
    setTimeEntries(te => te.map((arr, j) => j === idx ? arr.filter((_, k) => k !== i) : arr));
  }

  // ── Prayer condition ──────────────────────────────────────────────────
  function addPrayer(idx: number) {
    const entry: PrayerEntry = {
      when: newPrayerWhens[idx],
      name: newPrayerNames[idx],
      duration: newPrayerDurations[idx],
    };
    setPrayerEntries(pe => pe.map((arr, i) => i === idx ? [...arr, entry] : arr));
  }
  function removePrayer(idx: number, i: number) {
    setPrayerEntries(pe => pe.map((arr, j) => j === idx ? arr.filter((_, k) => k !== i) : arr));
  }

  // ── Weather condition ─────────────────────────────────────────────────
  function addWeather(idx: number) {
    const w = newWeathers[idx];
    setWeatherEntries(weArr => {
      const updated = weArr.map((arr, i) =>
        i === idx && !arr.includes(w) ? [...arr, w] : arr
      );
      const used = updated[idx];
      const remaining = weatherGroups.filter(g => !used.includes(g));
      setNewWeathers(nw => nw.map((v, i) => i === idx ? (remaining[0] || '') : v));
      return updated;
    });
  }
  function removeWeather(idx: number, i: number) {
    setWeatherEntries(weArr => weArr.map((arr, j) => j === idx ? arr.filter((_, k) => k !== i) : arr));
  }

  // ── Day condition ─────────────────────────────────────────────────────
  function toggleDate(idx: number, day: string) {
    setDateEntries(de => de.map((arr, i) =>
      i === idx
        ? (arr.includes(day) ? arr.filter(d => d !== day) : [...arr, day])
        : arr
    ));
  }

  // ── Auto-fill verse text when ayah range changes ───────────────────────
  useEffect(() => {
    if (!surah || typeof startAyah !== 'number' || typeof endAyah !== 'number') return;
    const from = startAyah, to = endAyah >= from ? endAyah : from;
    const slice = allVerses
      .filter(v => v.surah_no === surah)
      .filter(v => {
        const ay = Number(v.ayah_no_surah);
        return ay >= from && ay <= to;
      });
    setArabicText(slice.map(v => v.ayah_ar).join(' '));
    setEnglishText(slice.map(v => v.ayah_en).join(' '));
  }, [surah, startAyah, endAyah, allVerses]);

  // ── Build the typed ConditionData array ───────────────────────────────
  function buildConditions() {
    return conditions.map((cond, i) => {
      switch (cond) {
        case 'normal':
          return { type: 'normal' } as const;
        case 'time':
          return { type: 'time', entries: timeEntries[i] } as const;
        case 'prayer':
          return { type: 'prayer', entries: prayerEntries[i] } as const;
        case 'weather':
          return { type: 'weather', entries: weatherEntries[i].map(w => ({ weather: w })) } as const;
        case 'day':
          return { type: 'day', entries: dateEntries[i] } as const;
      }
    });
  }

  // ── Save to Firestore ─────────────────────────────────────────────────
  async function handleSave() {
    const base: any = { sourceType };
    if (sourceType === 'quran') {
      base.quran = { surah, startAyah, endAyah, arabicText, englishText };
    } else if (sourceType === 'hadith') {
      base.hadith = {
        author: hadithAuthor,
        number: hadithNumber,
        authenticity: hadithAuth,
        arabicText,
        englishText,
      };
    } else {
      base.other = { arabicText, englishText };
    }
    const conditionDocs = buildConditions();
    await saveMessageWithConditions(base, conditionDocs);
  }

  return {
    sourceType, setSourceType,
    surah, setSurah,
    startAyah, setStartAyah,
    endAyah, setEndAyah,
    arabicText, setArabicText,
    englishText, setEnglishText,
    hadithAuthor, setHadithAuthor,
    hadithNumber, setHadithNumber,
    hadithAuth, setHadithAuth,
    conditions, addCondition, removeCondition, updateCondition,
    timeEntries, newTimeFroms, setNewTimeFroms, newTimeTos, setNewTimeTos, addTime, removeTime,
    prayerEntries, newPrayerWhens, setNewPrayerWhens, newPrayerNames, setNewPrayerNames,
    newPrayerDurations, setNewPrayerDurations, addPrayer, removePrayer,
    weatherEntries, newWeathers, setNewWeathers, addWeather, removeWeather,
    dateEntries, toggleDate,
    handleSave,
    allVerses, surahList,
  };
}
