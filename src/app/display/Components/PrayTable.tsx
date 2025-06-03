'use client';

import React, { useEffect, useState } from 'react';
import { fetchPrayerTimes, RawPrayerTimes } from '../../FetchPrayerTimes';

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
  const [times, setTimes] = useState<RawPrayerTimes | null>(null);

  // fetch today’s times
  useEffect(() => {
    fetchPrayerTimes()
      .then(setTimes)
      .catch(console.error);
  }, []);

  if (!times) return null;

  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const adhan  = [
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

  return (
    <div id="pray-table" className="overflow-x-auto">
      <table className="table-fixed w-full border-collapse">
        <thead>
          <tr className={`h-[${ROW_HEIGHT_VW}vw]`}>
            <th className={`${colBg[0]} w-1/6 border border-[var(--secondary-color)]`} />
            {prayers.map((prayer, i) => {
              const bg       = colBg[i + 1];
              const isAccent = (i + 1) % 3 === 2;
              return (
                <th
                  key={prayer}
                  className={
                    `${bg} border border-[var(--secondary-color)] text-center text-[${HEADER_TEXT_VW}vw] h-[${ROW_HEIGHT_VW}vw] ` +
                    (isAccent ? 'text-[var(--background-end)]' : 'text-[var(--text-color)]')
                  }
                >
                  {prayer}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr className={`h-[${ROW_HEIGHT_VW}vw]`}>
            <td className={`${colBg[0]} border border-[var(--secondary-color)] flex items-center justify-center text-[${BODY_TEXT_VW}vw]`}>
              Adhan
            </td>
            {adhan.map((t, i) => {
              const bg       = colBg[i + 1];
              const isAccent = (i + 1) % 3 === 2;
              return (
                <td
                  key={i}
                  className={
                    `${bg} border border-[var(--secondary-color)] text-center text-[${BODY_TEXT_VW}vw] ` +
                    (isAccent ? 'text-[var(--background-end)]' : 'text-[var(--text-color)]')
                  }
                >
                  {t}
                </td>
              );
            })}
          </tr>
          <tr className={`h-[${ROW_HEIGHT_VW}vw]`}>
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
                  className={
                    `${bg} border border-[var(--secondary-color)] text-center text-[${BODY_TEXT_VW}vw] ` +
                    (isAccent ? 'text-[var(--background-end)]' : 'text-[var(--text-color)]')
                  }
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
 