"use client";

import React, { useState, useEffect, useRef } from "react";
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

const COLUMN_KEYS: ColumnKey[] = [
  'date', 'fajrStart', 'fajrJamaat', 'sunrise', 'dhuhrStart',
  'dhuhrJamaat', 'asrStart', 'asrJamaat', 'maghrib', 'ishaStart', 'ishaJamaat'
];

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

  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectedColumn, setSelectedColumn] = useState<ColumnKey | null>(null);
  const [focusedCell, setFocusedCell] = useState<{row: number, col: ColumnKey} | null>(null);

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
          archived: false,
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
      setSelectedRows(new Set());
    } catch (err) {
      console.error("Error loading prayer times:", err);
      setError("Failed to load prayer times");
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (index: number, field: ColumnKey, value: string) => {
    const updatedRows = [...prayerTimes];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
      isModified: true,
    };
    setPrayerTimes(updatedRows);
    setHasChanges(true);
  };

  const toggleRowSelection = (index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllRowsSelection = () => {
    const visibleRows = prayerTimes
      .map((row, idx) => (showArchived || !row.archived) ? idx : -1)
      .filter(idx => idx !== -1);

    if (selectedRows.size === visibleRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(visibleRows));
    }
  };

  const archiveSelected = () => {
    if (selectedRows.size === 0) return;

    const updatedRows = [...prayerTimes];
    selectedRows.forEach(index => {
      updatedRows[index] = {
        ...updatedRows[index],
        archived: true,
        isModified: true,
      };
    });

    setPrayerTimes(updatedRows);
    setHasChanges(true);
    setSelectedRows(new Set());
    setToast({ type: 'success', message: `Archived ${selectedRows.size} row(s)` });
  };

  const unarchiveSelected = () => {
    if (selectedRows.size === 0) return;

    const updatedRows = [...prayerTimes];
    selectedRows.forEach(index => {
      updatedRows[index] = {
        ...updatedRows[index],
        archived: false,
        isModified: true,
      };
    });

    setPrayerTimes(updatedRows);
    setHasChanges(true);
    setSelectedRows(new Set());
    setToast({ type: 'success', message: `Unarchived ${selectedRows.size} row(s)` });
  };

  const deleteSelected = () => {
    if (selectedRows.size === 0) return;

    const confirm = window.confirm(`Are you sure you want to delete ${selectedRows.size} row(s)?`);
    if (!confirm) return;

    const updatedRows = prayerTimes.filter((_, index) => !selectedRows.has(index));
    setPrayerTimes(updatedRows);
    setHasChanges(true);
    setSelectedRows(new Set());
    setToast({ type: 'success', message: `Deleted ${selectedRows.size} row(s)` });
  };

  const handleColumnSelect = (column: ColumnKey) => {
    setSelectedColumn(column === selectedColumn ? null : column);
  };

  const handleCellPaste = async (rowIndex: number, colKey: ColumnKey, e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const lines = pastedData.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length === 0) return;

    // If pasting into a column-selected area, paste to all visible rows in that column
    if (selectedColumn === colKey) {
      const updatedRows = [...prayerTimes];
      const visibleRows = updatedRows
        .map((row, idx) => (showArchived || !row.archived) ? idx : -1)
        .filter(idx => idx !== -1);

      lines.forEach((value, offset) => {
        const targetIdx = visibleRows[offset];
        if (targetIdx !== undefined && targetIdx < updatedRows.length) {
          updatedRows[targetIdx] = {
            ...updatedRows[targetIdx],
            [colKey]: value,
            isModified: true,
          };
        }
      });

      setPrayerTimes(updatedRows);
      setHasChanges(true);
      setToast({ type: 'success', message: `Pasted ${lines.length} value(s) to column` });
    } else {
      // Single cell or row paste
      const updatedRows = [...prayerTimes];

      if (lines.length === 1) {
        // Single value - paste into current cell
        updatedRows[rowIndex] = {
          ...updatedRows[rowIndex],
          [colKey]: lines[0],
          isModified: true,
        };
      } else {
        // Multiple lines - paste starting from current cell going down
        lines.forEach((value, offset) => {
          const targetIdx = rowIndex + offset;
          if (targetIdx < updatedRows.length) {
            updatedRows[targetIdx] = {
              ...updatedRows[targetIdx],
              [colKey]: value,
              isModified: true,
            };
          }
        });
      }

      setPrayerTimes(updatedRows);
      setHasChanges(true);
      setToast({ type: 'success', message: `Pasted ${lines.length} value(s)` });
    }
  };

  const addNewRow = () => {
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

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const activeRows = prayerTimes.filter(row => !row.archived);

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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

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

          {/* Selection Actions */}
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
              <span className="text-[var(--text-color)] font-medium">
                {selectedRows.size} row(s) selected
              </span>
              <button
                onClick={archiveSelected}
                className="px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                Archive Selected
              </button>
              <button
                onClick={unarchiveSelected}
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Unarchive Selected
              </button>
              <button
                onClick={deleteSelected}
                className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedRows(new Set())}
                className="ml-auto px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Clear Selection
              </button>
            </div>
          )}

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

          {/* Help Text */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-[var(--text-color)]">
              💡 <strong>Tip:</strong> Click column headers to select entire columns. Paste data directly into cells (Ctrl+V). Select multiple rows using checkboxes.
            </p>
          </div>

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
            <div className="overflow-auto max-h-[calc(100vh-350px)]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[var(--accent-color)] text-[var(--background-end)]">
                    <th className="px-4 py-3 text-center font-bold border border-[var(--secondary-color)] w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === visibleRows.length && visibleRows.length > 0}
                        onChange={toggleAllRowsSelection}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    {[
                      { key: 'date', label: 'Date', width: 'min-w-[120px]' },
                      { key: 'fajrStart', label: 'Fajr', width: 'min-w-[80px]' },
                      { key: 'fajrJamaat', label: 'Fajr-Jamaat', width: 'min-w-[100px]' },
                      { key: 'sunrise', label: 'Sunrise', width: 'min-w-[80px]' },
                      { key: 'dhuhrStart', label: 'Dhuhr', width: 'min-w-[80px]' },
                      { key: 'dhuhrJamaat', label: 'Dhuhr-Jamaat', width: 'min-w-[110px]' },
                      { key: 'asrStart', label: 'Asr', width: 'min-w-[80px]' },
                      { key: 'asrJamaat', label: 'Asr-Jamaat', width: 'min-w-[100px]' },
                      { key: 'maghrib', label: 'Maghrib', width: 'min-w-[80px]' },
                      { key: 'ishaStart', label: 'Isha', width: 'min-w-[80px]' },
                      { key: 'ishaJamaat', label: 'Isha-Jamaat', width: 'min-w-[100px]' },
                    ].map(({ key, label, width }) => (
                      <th
                        key={key}
                        onClick={() => handleColumnSelect(key as ColumnKey)}
                        className={`px-4 py-3 text-left font-bold border border-[var(--secondary-color)] ${width} cursor-pointer hover:bg-[var(--accent-color)]/80 transition-colors ${
                          selectedColumn === key ? 'bg-[var(--yellow)]' : ''
                        }`}
                        title="Click to select entire column"
                      >
                        {label}
                        {selectedColumn === key && <span className="ml-2">✓</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const actualIndex = prayerTimes.indexOf(row);
                    const isSelected = selectedRows.has(actualIndex);

                    return (
                      <tr
                        key={actualIndex}
                        className={`${
                          isSelected
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : row.archived
                            ? "bg-gray-200 dark:bg-gray-800 opacity-60"
                            : row.isModified
                            ? "bg-yellow-50 dark:bg-yellow-900/20"
                            : "bg-[var(--background-end)]"
                        } hover:bg-[var(--background-start)] transition-colors`}
                      >
                        <td className="px-4 py-2 border border-[var(--secondary-color)] text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRowSelection(actualIndex)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        {COLUMN_KEYS.map((colKey) => (
                          <td
                            key={colKey}
                            className={`px-4 py-2 border border-[var(--secondary-color)] ${
                              selectedColumn === colKey ? 'bg-[var(--yellow)]/20' : ''
                            }`}
                          >
                            <input
                              type="text"
                              value={row[colKey]}
                              onChange={(e) => handleCellChange(actualIndex, colKey, e.target.value)}
                              onPaste={(e) => handleCellPaste(actualIndex, colKey, e)}
                              onFocus={() => setFocusedCell({ row: actualIndex, col: colKey })}
                              className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent rounded"
                              placeholder={colKey === 'date' ? 'DD/MM/YYYY' : 'HH:MM'}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
