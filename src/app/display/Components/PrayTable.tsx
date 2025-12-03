'use client';

import React, { useMemo } from 'react';
import { usePrayerTimesContext } from '../context/PrayerTimesContext';

// VW‐based sizing constants
const HEADER_TEXT_VW = 4;   // prayer‐name & header font
const BODY_TEXT_VW   = 4;   // time cells
const ROW_HEIGHT_VW  = 5;   // each row
const ICON_SIZE_VW   = 5;   // mosque icon

// cycle: secondary → background‐end → accent → …
const colBg = [
  'bg-[var(--secondary-color)]',
  'bg-[var(--background-end)]',
  'bg-[var(--accent-color)]',
  'bg-[var(--secondary-color)]',
  'bg-[var(--background-end)]',
  'bg-[var(--accent-color)]',
];

export default function PrayTable() {
  const { prayerTimes: times, isLoading } = usePrayerTimesContext();

  // Memoize prayer data arrays
  const prayerData = useMemo(() => {
    if (!times) return null;

    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const adhan = [
      times.fajrStart,
      times.dhuhrStart,
      times.asrStart,
      times.maghrib,
      times.ishaStart,
    ];
    const jamaat = [
      times.fajrJamaat,
      times.dhuhrJamaat,
      times.asrJamaat,
      times.maghrib,
      times.ishaJamaat,
    ];

    return { prayers, adhan, jamaat };
  }, [times]);

  if (isLoading || !prayerData) return null;

  const { prayers, adhan, jamaat } = prayerData;

  return (
    <div id="pray-table" className="overflow-x-auto">
      <table className="table-fixed w-full border-collapse">
        <thead>
          <tr style={{ height: `${ROW_HEIGHT_VW}vw` }}>
            <th className={`${colBg[0]} w-1/6 border border-[var(--secondary-color)]`} />
            {prayers.map((prayer, i) => {
              const bg       = colBg[i + 1];
              const isAccent = (i + 1) % 3 === 2;
              return (
                <th
                  key={prayer}
                  className={`${bg} border border-[var(--secondary-color)] text-center`}
                  style={{
                    fontSize: `${HEADER_TEXT_VW}vw`,
                    height: `${ROW_HEIGHT_VW}vw`,
                    color: isAccent ? 'var(--background-end)' : 'var(--text-color)',
                  }}
                >
                  {prayer}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: `${ROW_HEIGHT_VW}vw` }}>
            <td
              className={`${colBg[0]} border border-[var(--secondary-color)] flex items-center justify-center`}
              style={{ fontSize: `${BODY_TEXT_VW}vw` }}
            >
              Adhan
            </td>
            {adhan.map((t, i) => {
              const bg       = colBg[i + 1];
              const isAccent = (i + 1) % 3 === 2;
              return (
                <td
                  key={i}
                  className={`${bg} border border-[var(--secondary-color)] text-center`}
                  style={{
                    fontSize: `${BODY_TEXT_VW}vw`,
                    color: isAccent ? 'var(--background-end)' : 'var(--text-color)',
                  }}
                >
                  {t}
                </td>
              );
            })}
          </tr>
          <tr style={{ height: `${ROW_HEIGHT_VW}vw` }}>
            <td className={`${colBg[0]} border border-[var(--secondary-color)] flex items-center justify-center`}>
              <img
                id="mosque-icon"
                src="/Icons/icon-masjid.svg"
                alt="Mosque icon"
                className="m-auto"
                style={{
                  width:  `${ICON_SIZE_VW}vw`,
                  height: `${ICON_SIZE_VW}vw`,
                }}
              />
            </td>
            {jamaat.map((t, i) => {
              const bg       = colBg[i + 1];
              const isAccent = (i + 1) % 3 === 2;
              return (
                <td
                  key={i}
                  className={`${bg} border border-[var(--secondary-color)] text-center`}
                  style={{
                    fontSize: `${BODY_TEXT_VW}vw`,
                    color: isAccent ? 'var(--background-end)' : 'var(--text-color)',
                  }}
                >
                  {t}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
