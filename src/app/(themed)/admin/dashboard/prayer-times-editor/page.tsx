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
  const [exitModalOpen, setExitModalOpen] = useState(false);

  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [lastSelectedRow, setLastSelectedRow] = useState<number | null>(null);

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
      const allData: PrayerTimeRow[] = [];

      // Load all 12 months of selected year only
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

      // Add 31 empty rows after the most recent date
      if (allData.length > 0) {
        const lastRow = allData[allData.length - 1];
        const [day, month, year] = lastRow.date.split("/").map(Number);
        let currentDate = new Date(year, month - 1, day);

        for (let i = 0; i < 31; i++) {
          currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
          const newDay = String(currentDate.getDate()).padStart(2, "0");
          const newMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
          const newYear = String(currentDate.getFullYear());
          const newDate = `${newDay}/${newMonth}/${newYear}`;

          allData.push({
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
            isModified: false,
            archived: false,
          });
        }
      }

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

  const toggleRowSelection = (index: number, e: React.MouseEvent | React.ChangeEvent) => {
    const row = prayerTimes[index];

    // Prevent selection of current or future dates
    if (isCurrentOrFutureDate(row.date)) {
      return;
    }

    const isCheckbox = (e.target as HTMLElement).type === 'checkbox';
    const ctrlKey = (e as React.MouseEvent).ctrlKey || (e as React.MouseEvent).metaKey;
    const shiftKey = (e as React.MouseEvent).shiftKey;

    // Prevent text selection when using Ctrl or Shift
    if ((ctrlKey || shiftKey) && !isCheckbox) {
      (e as React.MouseEvent).preventDefault();
    }

    let newSelection = new Set(selectedRows);

    if (shiftKey && lastSelectedRow !== null && !isCheckbox) {
      // Shift+Click: Select range from last selected to current (only past dates)
      const start = Math.min(lastSelectedRow, index);
      const end = Math.max(lastSelectedRow, index);
      for (let i = start; i <= end; i++) {
        if (!isCurrentOrFutureDate(prayerTimes[i].date)) {
          newSelection.add(i);
        }
      }
    } else if (ctrlKey && !isCheckbox) {
      // Ctrl+Click: Toggle single selection
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        newSelection.add(index);
      }
      setLastSelectedRow(index);
    } else {
      // Regular click or checkbox: Toggle single
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        newSelection.add(index);
      }
      setLastSelectedRow(index);
    }

    setSelectedRows(newSelection);
  };

  const toggleAllRowsSelection = () => {
    // Only select visible rows that are past dates (not current or future)
    const selectableRows = prayerTimes
      .map((row, idx) => {
        const isVisible = showArchived || !row.archived;
        const isPast = !isCurrentOrFutureDate(row.date);
        return (isVisible && isPast) ? idx : -1;
      })
      .filter(idx => idx !== -1);

    if (selectedRows.size === selectableRows.length && selectableRows.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(selectableRows));
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

  const handleCellPaste = async (rowIndex: number, colKey: ColumnKey, e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const lines = pastedData.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length === 0) return;

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
      setExitModalOpen(true);
    } else {
      router.push("/admin/dashboard");
    }
  };

  const handleExitWithoutSaving = () => {
    setExitModalOpen(false);
    router.push("/admin/dashboard");
  };

  const handleSaveAndExitFromModal = async () => {
    setExitModalOpen(false);
    await handleSaveAndExit();
  };

  const handleDiscardAndExit = () => {
    setExitModalOpen(true);
  };

  const isFriday = (dateStr: string): boolean => {
    try {
      const [day, month, year] = dateStr.split("/").map(Number);
      const date = new Date(year, month - 1, day);
      return date.getDay() === 5; // Friday is 5
    } catch {
      return false;
    }
  };

  const isFirstOfMonth = (dateStr: string): boolean => {
    try {
      const [day] = dateStr.split("/");
      return day === "01";
    } catch {
      return false;
    }
  };

  const isCurrentOrFutureDate = (dateStr: string): boolean => {
    try {
      const [day, month, year] = dateStr.split("/").map(Number);
      const rowDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      return rowDate >= today;
    } catch {
      return false;
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
            <h1 className="text-3xl font-bold text-[var(--text-color)]">
              Local Prayer Times Editor
            </h1>

            <div className="flex items-center gap-3">
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
                  className="px-3 py-2 bg-[var(--background-end)] text-[var(--text-color)] border border-[var(--secondary-color)] focus:outline-none focus:border-[var(--accent-color)]"
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
                className="px-4 py-2 bg-[var(--accent-color)] text-[var(--background-end)] hover:opacity-90 transition-opacity font-medium"
              >
                + Add Row
              </button>

              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-5 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "💾 Save"}
              </button>

              <button
                onClick={handleExit}
                className="px-5 py-2 bg-[var(--accent-color)] text-[var(--background-end)] hover:opacity-90 transition-opacity font-medium"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Selection Actions */}
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700">
              <span className="text-[var(--text-color)] font-medium">
                {selectedRows.size} row(s) selected
              </span>
              <button
                onClick={archiveSelected}
                className="px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                Archive Selected
              </button>
              <button
                onClick={unarchiveSelected}
                className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Unarchive Selected
              </button>
              <button
                onClick={deleteSelected}
                className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedRows(new Set())}
                className="ml-auto px-3 py-1.5 bg-gray-500 text-white hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Clear Selection
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Table Container */}
        <div className="bg-[var(--background-end)] border border-[var(--secondary-color)] shadow-lg overflow-hidden">
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
            <div className="overflow-auto max-h-[calc(100vh-320px)] custom-scrollbar">
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
                        className={`px-4 py-3 text-left font-bold border border-[var(--secondary-color)] ${width}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const actualIndex = prayerTimes.indexOf(row);
                    const isSelected = selectedRows.has(actualIndex);
                    const isFri = isFriday(row.date);
                    const isFirst = isFirstOfMonth(row.date);
                    const isFutureDate = isCurrentOrFutureDate(row.date);

                    return (
                      <tr
                        key={actualIndex}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).tagName !== 'INPUT') {
                            toggleRowSelection(actualIndex, e);
                          }
                        }}
                        className={`${isFutureDate ? 'cursor-default' : 'cursor-pointer'} select-none ${
                          isSelected
                            ? "bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500"
                            : isFri
                            ? "bg-green-100 dark:bg-green-900/20"
                            : isFirst
                            ? "bg-yellow-100 dark:bg-yellow-900/20"
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
                            onChange={(e) => toggleRowSelection(actualIndex, e)}
                            disabled={isFutureDate}
                            className="w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                        </td>
                        {COLUMN_KEYS.map((colKey) => (
                          <td
                            key={colKey}
                            className="px-4 py-2 border border-[var(--secondary-color)]"
                          >
                            <input
                              type="text"
                              value={row[colKey]}
                              onChange={(e) => handleCellChange(actualIndex, colKey, e.target.value)}
                              onPaste={(e) => handleCellPaste(actualIndex, colKey, e)}
                              className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:border-2 focus:border-[var(--accent-color)] border border-transparent"
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

      {/* Exit Warning Modal */}
      {exitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--background-end)] border-2 border-[var(--secondary-color)] shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-[var(--text-color)] mb-4">
              Unsaved Changes
            </h3>
            <p className="text-[var(--text-color)] mb-6">
              You have unsaved changes. What would you like to do?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSaveAndExitFromModal}
                disabled={saving}
                className="w-full px-6 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                💾 Save Changes & Exit
              </button>
              <button
                onClick={handleExitWithoutSaving}
                className="w-full px-6 py-3 bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
              >
                🗑️ Discard Changes & Exit
              </button>
              <button
                onClick={() => setExitModalOpen(false)}
                className="w-full px-6 py-3 bg-gray-500 text-white hover:bg-gray-600 transition-colors font-medium"
              >
                ← Cancel (Continue Editing)
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

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--background-start);
          border-left: 1px solid var(--secondary-color);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--accent-color);
          border: 2px solid var(--background-start);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-color);
        }

        .custom-scrollbar::-webkit-scrollbar-corner {
          background: var(--background-start);
        }

        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--accent-color) var(--background-start);
        }
      `}</style>
    </div>
  );
}
