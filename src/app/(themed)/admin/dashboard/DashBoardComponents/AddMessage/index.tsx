// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/index.tsx
'use client';

import React, { useState } from 'react';
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

export type AddMessageWrapperProps = {
  onClose: () => void;
  setClosing: (isNowClosing: boolean) => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
};

type OtherLine = {
  id: string;
  text: string;
  fontSize: 'heading1' | 'heading2' | 'heading3' | 'body';
  colorVar: string;
  language: 'english' | 'arabic';
};

export default function AddMessageWrapper({
  onClose,
  setClosing,
  onSuccess,
  onError,
}: AddMessageWrapperProps) {
  const {
    sourceType,
    setSourceType,
    surah,
    setSurah,
    startAyah,
    setStartAyah,
    endAyah,
    setEndAyah,
    arabicText,
    setArabicText,
    englishText,
    setEnglishText,
    hadithAuthor,
    setHadithAuthor,
    hadithNumber,
    setHadithNumber,
    hadithAuth,
    setHadithAuth,
    conditions,
    addCondition,
    removeCondition,
    updateCondition,
    timeEntries,
    newTimeFroms,
    setNewTimeFroms,
    newTimeTos,
    setNewTimeTos,
    addTime,
    removeTime,
    prayerEntries,
    newPrayerWhens,
    setNewPrayerWhens,
    newPrayerNames,
    setNewPrayerNames,
    newPrayerDurations,
    setNewPrayerDurations,
    addPrayer,
    removePrayer,
    weatherEntries,
    newWeathers,
    setNewWeathers,
    addWeather,
    removeWeather,
    dateEntries,
    toggleDate,
    handleSave,
  } = useAddMessage([] as VerseRecord[], [] as SurahInfo[]);

  const [otherLines, setOtherLines] = useState<OtherLine[]>([
    {
      id: crypto.randomUUID(),
      text: '',
      fontSize: 'body',
      colorVar: '--text-color',
      language: 'english',
    },
  ]);

  const [isClosing, setIsClosingLocal] = useState(false);

  const onSave = async () => {
    try {
      await handleSave();
      onSuccess();
      setClosing(true);
      setIsClosingLocal(true);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      onError(err.message || 'Failed to save message');
    }
  };

  return (
    <div
      className="p-4 space-y-6 relative"
      style={{
        opacity: isClosing ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      <SourceSelector sourceType={sourceType} setSourceType={setSourceType} />

      {sourceType === 'quran' && (
        <QuranField
          surah={surah}
          setSurah={setSurah}
          startAyah={startAyah}
          setStartAyah={setStartAyah}
          arabicText={arabicText}
          setArabicText={setArabicText}
          englishText={englishText}
          setEnglishText={setEnglishText}
        />
      )}

      {sourceType === 'hadith' && (
        <HadithFields
          hadithAuthor={hadithAuthor}
          setHadithAuthor={setHadithAuthor}
          hadithNumber={hadithNumber}
          setHadithNumber={setHadithNumber}
          hadithAuth={hadithAuth}
          setHadithAuth={setHadithAuth}
          arabicText={arabicText}
          setArabicText={setArabicText}
          englishText={englishText}
          setEnglishText={setEnglishText}
        />
      )}

      {sourceType === 'other' && (
        <OtherFields lines={otherLines} setLines={setOtherLines} />
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
                onChange={(e) =>
                  updateCondition(idx, e.target.value as ConditionType)
                }
                className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
              >
                {(
                  ['normal', 'time', 'prayer', 'weather', 'day'] as ConditionType[]
                )
                  .filter((c0) => !(conditions.length > 1 && c0 === 'normal'))
                  .map((c0) => (
                    <option key={c0} value={c0}>
                      {c0}
                    </option>
                  ))}
              </select>

              {idx > 0 && (
                <button
                  onClick={() => removeCondition(idx)}
                  className="text-red-600 text-2xl"
                  aria-label="Remove condition"
                >
                  ×
                </button>
              )}
            </div>

            {cond === 'time' && (
              <TimeCondition
                idx={idx}
                entries={timeEntries[idx]}
                newFrom={newTimeFroms[idx]}
                newTo={newTimeTos[idx]}
                onFromChange={(v) =>
                  setNewTimeFroms((arr) =>
                    arr.map((x, i) => (i === idx ? v : x))
                  )
                }
                onToChange={(v) =>
                  setNewTimeTos((arr) =>
                    arr.map((x, i) => (i === idx ? v : x))
                  )
                }
                addTime={() => addTime(idx)}
                removeTime={(i) => removeTime(idx, i)}
              />
            )}

            {cond === 'prayer' && (
              <PrayerCondition
                idx={idx}
                entries={prayerEntries[idx]}
                newWhen={newPrayerWhens[idx]}
                newName={newPrayerNames[idx]}
                newDuration={newPrayerDurations[idx]}
                onWhenChange={(v) =>
                  setNewPrayerWhens((arr) =>
                    arr.map((x, i) => (i === idx ? v : x))
                  )
                }
                onNameChange={(v) =>
                  setNewPrayerNames((arr) =>
                    arr.map((x, i) => (i === idx ? v : x))
                  )
                }
                onDurationChange={(v) =>
                  setNewPrayerDurations((arr) =>
                    arr.map((x, i) => (i === idx ? v : x))
                  )
                }
                addPrayer={() => addPrayer(idx)}
                removePrayer={(i) => removePrayer(idx, i)}
              />
            )}

            {cond === 'weather' && (
              <WeatherCondition
                idx={idx}
                entries={weatherEntries[idx]}
                newWeather={newWeathers[idx]}
                onWeatherChange={(v) =>
                  setNewWeathers((arr) =>
                    arr.map((x, i) => (i === idx ? v : x))
                  )
                }
                addWeather={() => addWeather(idx)}
                removeWeather={(i) => removeWeather(idx, i)}
              />
            )}

            {cond === 'day' && (
              <DayCondition
                idx={idx}
                entries={dateEntries[idx]}
                toggleDate={(d) => toggleDate(idx, d)}
              />
            )}
          </div>
        ))}

        <button
          onClick={addCondition}
          disabled={conditions.length === 1 && conditions[0] === 'normal'}
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
    </div>
  );
}
