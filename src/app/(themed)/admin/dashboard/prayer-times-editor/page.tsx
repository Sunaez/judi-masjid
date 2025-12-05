"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPrayerTimesByMonth, batchSavePrayerTimes } from "@/lib/firebase/prayerTimes";
import type { RawPrayerTimes } from "@/app/FetchPrayerTimes";
import NavBar from "../../AdminComponents/NavBar";
import Notification from "../DashBoardComponents/Notification";

interface PrayerTimeRow {
  date: string; // DD/MM/YYYY format
  fajrStart: string;
  fajrJamaat: string;
  sunrise: string;
  dhuhrStart: string;
  dhuhrJamaat: string;
  asrStart: string;
  asrJamaat: string;
  maghrib: string;
  ishaStart: string;
  ishaJamaat: string;
  isModified?: boolean;
  archived?: boolean;
}

type ColumnKey = keyof Omit<PrayerTimeRow, 'isModified' | 'archived'>;

export default function PrayerTimesEditorPage() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [columnPasteModal, setColumnPasteModal] = useState<{ column: ColumnKey; visible: boolean }>({ column: 'date', visible: false });
  const [pasteText, setPasteText] = useState("");

  // Initialize with current year
  useEffect(() => {
    const now = new Date();
    const year = String(now.getFullYear());
    setSelectedYear(year);
  }, []);

  // Load prayer times when year changes
  useEffect(() => {
    if (selectedYear) {
      loadPrayerTimesForYear();
    }
  }, [selectedYear]);

  const loadPrayerTimesForYear = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all 12 months for the selected year
      const allData: PrayerTimeRow[] = [];

      for (let month = 1; month <= 12; month++) {
        const monthStr = String(month).padStart(2, "0");
        const data = await getPrayerTimesByMonth(selectedYear, monthStr);

        const rows: PrayerTimeRow[] = data.map((doc) => ({
          date: doc.date,
          fajrStart: doc.fajrStart,
          fajrJamaat: doc.fajrJamaat,
          sunrise: doc.sunrise,
          dhuhrStart: doc.dhuhrStart,
          dhuhrJamaat: doc.dhuhrJamaat,
          asrStart: doc.asrStart,
          asrJamaat: doc.asrJamaat,
          maghrib: doc.maghrib,
          ishaStart: doc.ishaStart,
          ishaJamaat: doc.ishaJamaat,
          isModified: false,
          archived: false, // Default to not archived
        }));

        allData.push(...rows);
      }

      // Sort by date
      allData.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split("/").map(Number);
        const [dayB, monthB, yearB] = b.date.split("/").map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      });

      setPrayerTimes(allData);
      setHasChanges(false);
    } catch (err) {
      console.error("Error loading prayer times:", err);
      setError("Failed to load prayer times");
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (index: number, field: keyof PrayerTimeRow, value: string) => {
    const updatedRows = [...prayerTimes];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
      isModified: true,
    };
    setPrayerTimes(updatedRows);
    setHasChanges(true);
  };

  const toggleArchive = (index: number) => {
    const updatedRows = [...prayerTimes];
    updatedRows[index] = {
      ...updatedRows[index],
      archived: !updatedRows[index].archived,
      isModified: true,
    };
    setPrayerTimes(updatedRows);
    setHasChanges(true);
  };

  const addNewRow = () => {
    // Get the next date in the sequence
    const lastRow = prayerTimes[prayerTimes.length - 1];
    let newDate = "";

    if (lastRow) {
      const [day, month, year] = lastRow.date.split("/").map(Number);
      const nextDate = new Date(year, month - 1, day + 1);
      const newDay = String(nextDate.getDate()).padStart(2, "0");
      const newMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
      const newYear = String(nextDate.getFullYear());
      newDate = `${newDay}/${newMonth}/${newYear}`;
    } else {
      // If no rows, create first day of selected year
      newDate = `01/01/${selectedYear}`;
    }

    const newRow: PrayerTimeRow = {
      date: newDate,
      fajrStart: "",
      fajrJamaat: "",
      sunrise: "",
      dhuhrStart: "",
      dhuhrJamaat: "",
      asrStart: "",
      asrJamaat: "",
      maghrib: "",
      ishaStart: "",
      ishaJamaat: "",
      isModified: true,
      archived: false,
    };

    setPrayerTimes([...prayerTimes, newRow]);
    setHasChanges(true);
  };

  const deleteRow = (index: number) => {
    const updatedRows = prayerTimes.filter((_, i) => i !== index);
    setPrayerTimes(updatedRows);
    setHasChanges(true);
  };

  const handleColumnPaste = () => {
    const lines = pasteText.split('\n').map(line => line.trim()).filter(line => line !== '');

    if (lines.length === 0) {
      setToast({ type: 'error', message: 'No data to paste' });
      return;
    }

    const updatedRows = [...prayerTimes];
    const visibleRows = updatedRows.filter(row => showArchived || !row.archived);

    // Apply pasted values to visible rows
    lines.forEach((value, index) => {
      if (index < visibleRows.length) {
        const rowIndex = updatedRows.indexOf(visibleRows[index]);
        if (rowIndex !== -1) {
          updatedRows[rowIndex] = {
            ...updatedRows[rowIndex],
            [columnPasteModal.column]: value,
            isModified: true,
          };
        }
      }
    });

    setPrayerTimes(updatedRows);
    setHasChanges(true);
    setColumnPasteModal({ ...columnPasteModal, visible: false });
    setPasteText("");
    setToast({ type: 'success', message: `Pasted ${lines.length} values to ${columnPasteModal.column}` });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Filter out archived rows - don't save them to Firebase
      const activeRows = prayerTimes.filter(row => !row.archived);

      // Prepare data for batch save
      const dataToSave = activeRows.map((row) => ({
        date: row.date,
        times: {
          fajrStart: row.fajrStart,
          fajrJamaat: row.fajrJamaat,
          sunrise: row.sunrise,
          dhuhrStart: row.dhuhrStart,
          dhuhrJamaat: row.dhuhrJamaat,
          asrStart: row.asrStart,
          asrJamaat: row.asrJamaat,
          maghrib: row.maghrib,
          ishaStart: row.ishaStart,
          ishaJamaat: row.ishaJamaat,
        } as RawPrayerTimes,
      }));

      await batchSavePrayerTimes(dataToSave);
      setHasChanges(false);
      setToast({ type: 'success', message: 'Changes saved successfully!' });

      // Reload to confirm save
      await loadPrayerTimesForYear();
    } catch (err) {
      console.error("Error saving prayer times:", err);
      setToast({ type: 'error', message: 'Failed to save prayer times' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    await handleSave();
    router.push("/admin/dashboard");
  };

  const handleExit = () => {
    if (hasChanges) {
      const confirm = window.confirm("You have unsaved changes. Exit without saving?");
      if (!confirm) return;
    }
    router.push("/admin/dashboard");
  };

  const handleDiscardAndExit = () => {
    const confirm = window.confirm("Are you sure you want to discard all changes and exit?");
    if (confirm) {
      router.push("/admin/dashboard");
    }
  };

  // Generate year options (current year ± 2 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Filter rows based on archive visibility
  const visibleRows = prayerTimes.filter(row => showArchived || !row.archived);
  const archivedCount = prayerTimes.filter(row => row.archived).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[var(--background-start)] to-[var(--background-end)]">
      <NavBar />

      <div className="flex-grow p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-[var(--text-color)]">
                Local Prayer Times Editor
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Archive Toggle */}
              <label className="flex items-center gap-2 text-[var(--text-color)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Show Archived ({archivedCount})</span>
              </label>

              <div className="flex gap-2 items-center">
                <label className="text-[var(--text-color)] font-medium">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 bg-[var(--background-end)] text-[var(--text-color)] border border-[var(--secondary-color)] rounded-lg focus:outline-none focus:border-[var(--accent-color)]"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={addNewRow}
                className="px-4 py-2 bg-[var(--accent-color)] text-[var(--background-end)] rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                + Add Row
              </button>

              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-6 py-2 bg-[var(--accent-color)] text-[var(--background-end)] rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Exit Buttons */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleSaveAndExit}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save & Exit
            </button>

            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Exit
            </button>

            <button
              onClick={handleDiscardAndExit}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Discard Changes & Exit
            </button>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Table Container */}
        <div className="bg-[var(--background-end)] border border-[var(--secondary-color)] rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-[var(--text-color)] text-lg">Loading prayer times...</div>
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-[var(--text-color)] text-lg">
                {archivedCount > 0 && !showArchived
                  ? "All entries are archived. Enable 'Show Archived' to see them."
                  : "No prayer times found. Click 'Add Row' to create entries."}
              </div>
            </div>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-300px)]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-[var(--accent-color)] text-[var(--background-end)]">
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[120px]">
                      <div className="flex flex-col gap-1">
                        <span>Date</span>
                        <button
                          onClick={() => setColumnPasteModal({ column: 'date', visible: true })}
                          className="text-xs bg-[var(--background-end)] text-[var(--accent-color)] px-2 py-1 rounded hover:opacity-90"
                        >
                          Paste Column
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[80px]">
                      <div className="flex flex-col gap-1">
                        <span>Fajr</span>
                        <button
                          onClick={() => setColumnPasteModal({ column: 'fajrStart', visible: true })}
                          className="text-xs bg-[var(--background-end)] text-[var(--accent-color)] px-2 py-1 rounded hover:opacity-90"
                        >
                          Paste
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[100px]">
                      <div className="flex flex-col gap-1">
                        <span>Fajr-Jamaat</span>
                        <button
                          onClick={() => setColumnPasteModal({ column: 'fajrJamaat', visible: true })}
                          className="text-xs bg-[var(--background-end)] text-[var(--accent-color)] px-2 py-1 rounded hover:opacity-90"
                        >
                          Paste
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[80px]">
                      <div className="flex flex-col gap-1">
                        <span>Sunrise</span>
                        <button
                          onClick={() => setColumnPasteModal({ column: 'sunrise', visible: true })}
                          className="text-xs bg-[var(--background-end)] text-[var(--accent-color)] px-2 py-1 rounded hover:opacity-90"
                        >
                          Paste
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[80px]">
                      <div className="flex flex-col gap-1">
                        <span>Dhuhr</span>
                        <button
                          onClick={() => setColumnPasteModal({ column: 'dhuhrStart', visible: true })}
                          className="text-xs bg-[var(--background-end)] text-[var(--accent-color)] px-2 py-1 rounded hover:opacity-90"
                        >
                          Paste
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[110px]">
                      <div className="flex flex-col gap-1">
                        <span>Dhuhr-Jamaat</span>
                        <button
                          onClick={() => setColumnPasteModal({ column: 'dhuhrJamaat', visible: true })}
                          className="text-xs bg-[var(--background-end)] text-[var(--accent-color)] px-2 py-1 rounded hover:opacity-90"
                        >
                          Paste
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[80px]">
                      <div className="flex flex-col gap-1">
                        <span>Asr</span>
                        <button
                          onClick={() => setColumnPasteModal({ column: 'asrStart', visible: true })}
                          className="text-xs bg-[var(--background-end)] text-[var(--accent-color)] px-2 py-1 rounded hover:opacity-90"
                        >
                          Paste
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[100px]">
                      <div className="flex flex-col gap-1">
                        <span>Asr-Jamaat</span>
                        <button
                          onClick={() => setColumnPasteModal({ column: 'asrJamaat', visible: true })}
                          className="text-xs bg-[var(--background-end)] text-[var(--accent-color)] px-2 py-1 rounded hover:opacity-90"
                        >
                          Paste
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[80px]">
                      <div className="flex flex-col gap-1">
                        <span>Maghrib</span>
                        <button
                          onClick={() => setColumnPasteModal({ column: 'maghrib', visible: true })}
                          className="text-xs bg-[var(--background-end)] text-[var(--accent-color)] px-2 py-1 rounded hover:opacity-90"
                        >
                          Paste
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[80px]">
                      <div className="flex flex-col gap-1">
                        <span>Isha</span>
                        <button
                          onClick={() => setColumnPasteModal({ column: 'ishaStart', visible: true })}
                          className="text-xs bg-[var(--background-end)] text-[var(--accent-color)] px-2 py-1 rounded hover:opacity-90"
                        >
                          Paste
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[100px]">
                      <div className="flex flex-col gap-1">
                        <span>Isha-Jamaat</span>
                        <button
                          onClick={() => setColumnPasteModal({ column: 'ishaJamaat', visible: true })}
                          className="text-xs bg-[var(--background-end)] text-[var(--accent-color)] px-2 py-1 rounded hover:opacity-90"
                        >
                          Paste
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center font-bold border border-[var(--secondary-color)] min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, displayIndex) => {
                    const actualIndex = prayerTimes.indexOf(row);
                    return (
                      <tr
                        key={actualIndex}
                        className={`${
                          row.archived
                            ? "bg-gray-200 dark:bg-gray-800 opacity-60"
                            : row.isModified
                            ? "bg-yellow-50 dark:bg-yellow-900/20"
                            : "bg-[var(--background-end)]"
                        } hover:bg-[var(--background-start)] transition-colors`}
                      >
                        <td className="px-4 py-2 border border-[var(--secondary-color)]">
                          <input
                            type="text"
                            value={row.date}
                            onChange={(e) => handleCellChange(actualIndex, "date", e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent rounded"
                            placeholder="DD/MM/YYYY"
                          />
                        </td>
                        <td className="px-4 py-2 border border-[var(--secondary-color)]">
                          <input
                            type="text"
                            value={row.fajrStart}
                            onChange={(e) => handleCellChange(actualIndex, "fajrStart", e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent rounded"
                            placeholder="HH:MM"
                          />
                        </td>
                        <td className="px-4 py-2 border border-[var(--secondary-color)]">
                          <input
                            type="text"
                            value={row.fajrJamaat}
                            onChange={(e) => handleCellChange(actualIndex, "fajrJamaat", e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent rounded"
                            placeholder="HH:MM"
                          />
                        </td>
                        <td className="px-4 py-2 border border-[var(--secondary-color)]">
                          <input
                            type="text"
                            value={row.sunrise}
                            onChange={(e) => handleCellChange(actualIndex, "sunrise", e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent rounded"
                            placeholder="HH:MM"
                          />
                        </td>
                        <td className="px-4 py-2 border border-[var(--secondary-color)]">
                          <input
                            type="text"
                            value={row.dhuhrStart}
                            onChange={(e) => handleCellChange(actualIndex, "dhuhrStart", e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent rounded"
                            placeholder="HH:MM"
                          />
                        </td>
                        <td className="px-4 py-2 border border-[var(--secondary-color)]">
                          <input
                            type="text"
                            value={row.dhuhrJamaat}
                            onChange={(e) => handleCellChange(actualIndex, "dhuhrJamaat", e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent rounded"
                            placeholder="HH:MM"
                          />
                        </td>
                        <td className="px-4 py-2 border border-[var(--secondary-color)]">
                          <input
                            type="text"
                            value={row.asrStart}
                            onChange={(e) => handleCellChange(actualIndex, "asrStart", e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent rounded"
                            placeholder="HH:MM"
                          />
                        </td>
                        <td className="px-4 py-2 border border-[var(--secondary-color)]">
                          <input
                            type="text"
                            value={row.asrJamaat}
                            onChange={(e) => handleCellChange(actualIndex, "asrJamaat", e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent rounded"
                            placeholder="HH:MM"
                          />
                        </td>
                        <td className="px-4 py-2 border border-[var(--secondary-color)]">
                          <input
                            type="text"
                            value={row.maghrib}
                            onChange={(e) => handleCellChange(actualIndex, "maghrib", e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent rounded"
                            placeholder="HH:MM"
                          />
                        </td>
                        <td className="px-4 py-2 border border-[var(--secondary-color)]">
                          <input
                            type="text"
                            value={row.ishaStart}
                            onChange={(e) => handleCellChange(actualIndex, "ishaStart", e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent rounded"
                            placeholder="HH:MM"
                          />
                        </td>
                        <td className="px-4 py-2 border border-[var(--secondary-color)]">
                          <input
                            type="text"
                            value={row.ishaJamaat}
                            onChange={(e) => handleCellChange(actualIndex, "ishaJamaat", e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent rounded"
                            placeholder="HH:MM"
                          />
                        </td>
                        <td className="px-4 py-2 border border-[var(--secondary-color)] text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => toggleArchive(actualIndex)}
                              className={`${
                                row.archived
                                  ? "text-green-600 hover:text-green-800"
                                  : "text-amber-600 hover:text-amber-800"
                              } transition-colors`}
                              title={row.archived ? "Unarchive row" : "Archive row"}
                            >
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {row.archived ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4v4m4-4v4" />
                                )}
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteRow(actualIndex)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete row"
                            >
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Column Paste Modal */}
      {columnPasteModal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--background-end)] border border-[var(--secondary-color)] rounded-lg shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[var(--text-color)] mb-4">
              Paste Column Data: {columnPasteModal.column}
            </h3>
            <p className="text-[var(--text-color)] mb-4 text-sm">
              Paste values (one per line) to fill the column for visible rows:
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full h-64 px-3 py-2 bg-[var(--background-start)] text-[var(--text-color)] border border-[var(--secondary-color)] rounded-lg focus:outline-none focus:border-[var(--accent-color)] font-mono text-sm"
              placeholder="00:00&#10;00:00&#10;00:00"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleColumnPaste}
                className="flex-1 px-4 py-2 bg-[var(--accent-color)] text-[var(--background-end)] rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setColumnPasteModal({ ...columnPasteModal, visible: false });
                  setPasteText("");
                }}
                className="flex-1 px-4 py-2 bg-[var(--background-start)] text-[var(--text-color)] border border-[var(--secondary-color)] rounded-lg hover:bg-[var(--secondary-color)] transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Notification
          type={toast.type}
          message={toast.message}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
