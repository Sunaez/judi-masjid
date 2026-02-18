'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePrayerTimesContext } from '../context/PrayerTimesContext';
import { getRotatorSlotOrder } from '../Components/Rotator/slotConfig';
import { addMinutesToTime, findActivePostPrayerEvent, getJamaatRows } from '@/lib/prayerTimeUtils';

export default function DisplayEventsTestPage() {
  const {
    prayerTimes,
    isLoading,
    isRamadan,
    isRamadanPeriod,
    isFirstTenRamadanDays,
    isLastTenRamadanDays,
    isDowntime,
  } = usePrayerTimesContext();

  const [simulateTime, setSimulateTime] = useState('');
  const [useSimulation, setUseSimulation] = useState(false);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const effectiveNow = useMemo(() => {
    if (!useSimulation || !simulateTime) return now;

    const [hours, minutes] = simulateTime.split(':').map(Number);
    const simulated = new Date(now);
    simulated.setHours(hours, minutes, 0, 0);
    return simulated;
  }, [now, simulateTime, useSimulation]);

  const slotOrder = useMemo(() => getRotatorSlotOrder(isRamadan), [isRamadan]);

  const jamaatRows = useMemo(() => {
    if (!prayerTimes) return [];
    return getJamaatRows(prayerTimes, isRamadan);
  }, [prayerTimes, isRamadan]);

  const activePostPrayer = useMemo(
    () => findActivePostPrayerEvent(prayerTimes, effectiveNow, isRamadan, 5),
    [prayerTimes, effectiveNow, isRamadan]
  );

  if (isLoading || !prayerTimes) {
    return (
      <div className="min-h-screen flex items-center justify-center text-3xl">
        Loading display event test page...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-8"
      style={{
        backgroundImage: 'linear-gradient(var(--background-start), var(--background-end))',
        color: 'var(--text-color)',
      }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-5xl font-bold">Display Events Manual Test</h1>

        <div className="rounded-2xl p-6 border border-[var(--secondary-color)] bg-[var(--secondary-color)]/20">
          <h2 className="text-3xl font-semibold mb-4">Quick Status</h2>
          <div className="grid grid-cols-2 gap-4 text-xl">
            <div>Ramadan: <strong>{String(isRamadan)}</strong></div>
            <div>Ramadan Period: <strong>{String(isRamadanPeriod)}</strong></div>
            <div>First 10 Days: <strong>{String(isFirstTenRamadanDays)}</strong></div>
            <div>Last 10 Days: <strong>{String(isLastTenRamadanDays)}</strong></div>
            <div>Downtime Mode: <strong>{String(isDowntime)}</strong></div>
            <div>Taraweh Time: <strong>{addMinutesToTime(prayerTimes.ishaJamaat, 20)}</strong></div>
            <div>
              Active Post-Prayer Window:{' '}
              <strong>{activePostPrayer ? activePostPrayer.name : 'None'}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 border border-[var(--secondary-color)] bg-[var(--background-end)]">
          <h2 className="text-3xl font-semibold mb-4">Simulation Controls</h2>
          <div className="flex items-center gap-4 text-xl">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useSimulation}
                onChange={e => setUseSimulation(e.target.checked)}
              />
              Enable time simulation
            </label>
            <input
              type="time"
              value={simulateTime}
              onChange={e => setSimulateTime(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--secondary-color)]"
            />
            <span>
              Effective time:{' '}
              <strong>{effectiveNow.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</strong>
            </span>
          </div>
          <p className="mt-3 text-sm opacity-80">
            Tip: set simulated time to 1-4 minutes after a jamaat time to verify the 5-minute post-prayer table trigger.
          </p>
        </div>

        <div className="rounded-2xl p-6 border border-[var(--secondary-color)] bg-[var(--background-end)]">
          <h2 className="text-3xl font-semibold mb-4">Rotator Order</h2>
          <p className="text-lg">
            {slotOrder.join(' -> ')}
          </p>
        </div>

        <div className="rounded-2xl p-6 border border-[var(--secondary-color)] bg-[var(--background-end)]">
          <h2 className="text-3xl font-semibold mb-4">Jamaat Table Data</h2>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="p-3 border border-[var(--secondary-color)]">Prayer</th>
                <th className="p-3 border border-[var(--secondary-color)]">Start Time</th>
                <th className="p-3 border border-[var(--secondary-color)]">Jamaat Time</th>
                <th className="p-3 border border-[var(--secondary-color)]">5-Min Window</th>
              </tr>
            </thead>
            <tbody>
              {jamaatRows.map(row => (
                <tr key={row.name}>
                  <td className="p-3 border border-[var(--secondary-color)]">{row.name}</td>
                  <td className="p-3 border border-[var(--secondary-color)]">{row.startTime}</td>
                  <td className="p-3 border border-[var(--secondary-color)]">{row.jamaatTime}</td>
                  <td className="p-3 border border-[var(--secondary-color)]">
                    {row.jamaatTime} - {addMinutesToTime(row.jamaatTime, 5)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
