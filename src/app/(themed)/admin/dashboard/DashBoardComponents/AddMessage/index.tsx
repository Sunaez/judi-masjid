// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import SourceSelector from './SourceSelector';
import QuranField from './QuranField';
import HadithFields from './HadithFields';
import OtherFields from './OtherFields';
import TimeCondition from './conditions/TimeCondition';
import PrayerCondition from './conditions/PrayerCondition';
import WeatherCondition from './conditions/WeatherCondition';
import DayCondition from './conditions/DayCondition';
import { useAddMessage } from './useAddMessage';
import { ConditionType, VerseRecord, SurahInfo } from './types';

export default function AddMessageWrapper() {
  const {
    // source/text
    sourceType, setSourceType,
    surah, setSurah,
    startAyah, setStartAyah,
    endAyah, setEndAyah,
    arabicText, setArabicText,
    englishText, setEnglishText,
    hadithAuthor, setHadithAuthor,
    hadithNumber, setHadithNumber,
    hadithAuth, setHadithAuth,

    // conditions
    conditions, addCondition, removeCondition, updateCondition,

    // time
    timeEntries, newTimeFroms, setNewTimeFroms,
    newTimeTos, setNewTimeTos, addTime, removeTime,

    // prayer
    prayerEntries, newPrayerWhens, setNewPrayerWhens,
    newPrayerNames, setNewPrayerNames,
    newPrayerDurations, setNewPrayerDurations,
    addPrayer, removePrayer,

    // weather
    weatherEntries, newWeathers, setNewWeathers,
    addWeather, removeWeather,

    // day
    dateEntries, toggleDate,

    // save
    handleSave,
  } = useAddMessage([] as VerseRecord[], [] as SurahInfo[]);

  // toast
  const [toast, setToast] = useState<{ type: 'success'|'error'; message: string }|null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!toast) return;
    setCountdown(3);
    const iv = setInterval(() => setCountdown(c => c - 1), 1000);
    const to = setTimeout(() => {
      setToast(null);
      clearInterval(iv);
    }, 3000);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
    };
  }, [toast]);

  const onSave = async () => {
    try {
      await handleSave();
      setToast({ type: 'success', message: 'Message added successfully' });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to save message' });
    }
  };

  return (
    <div className="p-4 space-y-6 relative">
      <SourceSelector sourceType={sourceType} setSourceType={setSourceType} />

      {sourceType === 'quran' && (
        <QuranField
          surah={surah} setSurah={setSurah}
          startAyah={startAyah} setStartAyah={setStartAyah}
          arabicText={arabicText} setArabicText={setArabicText}
          englishText={englishText} setEnglishText={setEnglishText}
        />
      )}

      {sourceType === 'hadith' && (
        <HadithFields
          hadithAuthor={hadithAuthor} setHadithAuthor={setHadithAuthor}
          hadithNumber={hadithNumber} setHadithNumber={setHadithNumber}
          hadithAuth={hadithAuth} setHadithAuth={setHadithAuth}
          arabicText={arabicText} setArabicText={setArabicText}
          englishText={englishText} setEnglishText={setEnglishText}
        />
      )}

      {sourceType === 'other' && (
        <OtherFields
          arabicText={arabicText} setArabicText={setArabicText}
          englishText={englishText} setEnglishText={setEnglishText}
        />
      )}

      <section>
        <h3 className="text-xl font-semibold text-[var(--text-color)] mb-2">
          Conditions
        </h3>

        {conditions.map((cond, idx) => (
          <div key={idx} className="border rounded-lg p-4 mb-4 relative">
            <div className="flex justify-between items-center mb-4">
              <select
                value={cond}
                onChange={e => updateCondition(idx, e.target.value as ConditionType)}
                className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
              >
                {(['normal','time','prayer','weather','day'] as ConditionType[])
                  .filter(c0 => !(conditions.length>1 && c0==='normal'))
                  .map(c0 => (
                    <option key={c0} value={c0}>{c0}</option>
                  ))}
              </select>

              {idx > 0 && (
                <button
                  onClick={() => removeCondition(idx)}
                  className="text-red-600 text-2xl"
                  aria-label="Remove condition"
                >×</button>
              )}
            </div>

            {cond === 'time' && (
              <TimeCondition
                idx={idx}
                entries={timeEntries[idx]}
                newFrom={newTimeFroms[idx]}
                newTo={newTimeTos[idx]}
                onFromChange={v =>
                  setNewTimeFroms(arr => arr.map((x,i) => i===idx ? v : x))
                }
                onToChange={v =>
                  setNewTimeTos(arr => arr.map((x,i) => i===idx ? v : x))
                }
                addTime={() => addTime(idx)}
                removeTime={i => removeTime(idx,i)}
              />
            )}

            {cond === 'prayer' && (
              <PrayerCondition
                idx={idx}
                entries={prayerEntries[idx]}
                newWhen={newPrayerWhens[idx]}
                newName={newPrayerNames[idx]}
                newDuration={newPrayerDurations[idx]}
                onWhenChange={v =>
                  setNewPrayerWhens(arr => arr.map((x,i) => i===idx ? v : x))
                }
                onNameChange={v =>
                  setNewPrayerNames(arr => arr.map((x,i) => i===idx ? v : x))
                }
                onDurationChange={v =>
                  setNewPrayerDurations(arr => arr.map((x,i) => i===idx ? v : x))
                }
                addPrayer={() => addPrayer(idx)}
                removePrayer={i => removePrayer(idx,i)}
              />
            )}

            {cond === 'weather' && (
              <WeatherCondition
                idx={idx}
                entries={weatherEntries[idx]}
                newWeather={newWeathers[idx]}
                onWeatherChange={v =>
                  setNewWeathers(arr => arr.map((x,i) => i===idx ? v : x))
                }
                addWeather={() => addWeather(idx)}
                removeWeather={i => removeWeather(idx,i)}
              />
            )}

            {cond === 'day' && (
              <DayCondition
                idx={idx}
                entries={dateEntries[idx]}
                toggleDate={d => toggleDate(idx,d)}
              />
            )}
          </div>
        ))}

        <button
          onClick={addCondition}
          disabled={conditions.length===1 && conditions[0]==='normal'}
          className="text-[var(--accent-color)] disabled:opacity-50"
        >
          + Add another condition
        </button>
      </section>

      <button
        onClick={onSave}
        className="mt-4 bg-[var(--accent-color)] text-[var(--x-text-color)] px-6 py-3 rounded font-semibold hover:opacity-90"
      >
        Save Message
      </button>

      {toast && (
        <div className={`
          fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-2 rounded-lg
          ${toast.type==='success' ? 'bg-green-600' : 'bg-red-600'} text-white shadow-lg
        `}>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" fill="none"
            />
            <circle
              className="opacity-75"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
              strokeDasharray="62.8"
              strokeDashoffset={(62.8/3)*(3-countdown)}
              fill="none"
            />
          </svg>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
