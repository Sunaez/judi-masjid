"use client";

import React, { useState, useEffect } from "react";
import { getPrayerTimesByMonth, batchSavePrayerTimes } from "@/lib/firebase/prayerTimes";
import type { RawPrayerTimes } from "@/app/FetchPrayerTimes";

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
}

interface PrayerTimesEditorProps {
  onClose: () => void;
}

export default function PrayerTimesEditor({ onClose }: PrayerTimesEditorProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize with current month and year
  useEffect(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear());
    setSelectedMonth(month);
    setSelectedYear(year);
  }, []);

  // Load prayer times when month/year changes
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      loadPrayerTimes();
    }
  }, [selectedMonth, selectedYear]);

  const loadPrayerTimes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPrayerTimesByMonth(selectedYear, selectedMonth);

      // Convert to editable rows
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
      }));

      // Sort by date
      rows.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split("/").map(Number);
        const [dayB, monthB, yearB] = b.date.split("/").map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      });

      setPrayerTimes(rows);
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
      // If no rows, create first day of selected month
      newDate = `01/${selectedMonth}/${selectedYear}`;
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
    };

    setPrayerTimes([...prayerTimes, newRow]);
    setHasChanges(true);
  };

  const deleteRow = (index: number) => {
    const updatedRows = prayerTimes.filter((_, i) => i !== index);
    setPrayerTimes(updatedRows);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Prepare data for batch save
      const dataToSave = prayerTimes.map((row) => ({
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

      // Reload to confirm save
      await loadPrayerTimes();
    } catch (err) {
      console.error("Error saving prayer times:", err);
      setError("Failed to save prayer times");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirm = window.confirm("You have unsaved changes. Are you sure you want to close?");
      if (!confirm) return;
    }
    onClose();
  };

  // Generate month options
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Generate year options (current year ± 2 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-7xl max-h-[90vh] bg-[var(--background-end)] border border-[var(--secondary-color)] rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--secondary-color)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[var(--text-color)]">
              Local Prayer Times Editor
            </h2>
            <button
              onClick={handleCancel}
              className="text-[var(--text-color)] hover:text-[var(--accent-color)] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Month/Year Selector */}
          <div className="flex gap-4 items-center">
            <div className="flex gap-2 items-center">
              <label className="text-[var(--text-color)] font-medium">Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 bg-[var(--background-start)] text-[var(--text-color)] border border-[var(--secondary-color)] rounded-lg focus:outline-none focus:border-[var(--accent-color)]"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 items-center">
              <label className="text-[var(--text-color)] font-medium">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 bg-[var(--background-start)] text-[var(--text-color)] border border-[var(--secondary-color)] rounded-lg focus:outline-none focus:border-[var(--accent-color)]"
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
              className="ml-auto px-4 py-2 bg-[var(--accent-color)] text-[var(--background-end)] rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              + Add Row
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[var(--text-color)] text-lg">Loading prayer times...</div>
            </div>
          ) : prayerTimes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[var(--text-color)] text-lg">No prayer times found. Click "Add Row" to create entries.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--accent-color)] text-[var(--background-end)]">
                    <th className="px-3 py-3 text-left font-bold border border-[var(--secondary-color)] sticky top-0">Date</th>
                    <th className="px-3 py-3 text-left font-bold border border-[var(--secondary-color)] sticky top-0">Fajr</th>
                    <th className="px-3 py-3 text-left font-bold border border-[var(--secondary-color)] sticky top-0">Fajr-Jamaat</th>
                    <th className="px-3 py-3 text-left font-bold border border-[var(--secondary-color)] sticky top-0">Sunrise</th>
                    <th className="px-3 py-3 text-left font-bold border border-[var(--secondary-color)] sticky top-0">Dhuhr</th>
                    <th className="px-3 py-3 text-left font-bold border border-[var(--secondary-color)] sticky top-0">Dhuhr-Jamaat</th>
                    <th className="px-3 py-3 text-left font-bold border border-[var(--secondary-color)] sticky top-0">Asr</th>
                    <th className="px-3 py-3 text-left font-bold border border-[var(--secondary-color)] sticky top-0">Asr-Jamaat</th>
                    <th className="px-3 py-3 text-left font-bold border border-[var(--secondary-color)] sticky top-0">Maghrib</th>
                    <th className="px-3 py-3 text-left font-bold border border-[var(--secondary-color)] sticky top-0">Isha</th>
                    <th className="px-3 py-3 text-left font-bold border border-[var(--secondary-color)] sticky top-0">Isha-Jamaat</th>
                    <th className="px-3 py-3 text-center font-bold border border-[var(--secondary-color)] sticky top-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prayerTimes.map((row, index) => (
                    <tr
                      key={index}
                      className={`${
                        row.isModified
                          ? "bg-yellow-50 dark:bg-yellow-900/20"
                          : "bg-[var(--background-end)]"
                      } hover:bg-[var(--background-start)] transition-colors`}
                    >
                      <td className="px-3 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.date}
                          onChange={(e) => handleCellChange(index, "date", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] rounded"
                          placeholder="DD/MM/YYYY"
                        />
                      </td>
                      <td className="px-3 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.fajrStart}
                          onChange={(e) => handleCellChange(index, "fajrStart", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-3 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.fajrJamaat}
                          onChange={(e) => handleCellChange(index, "fajrJamaat", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-3 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.sunrise}
                          onChange={(e) => handleCellChange(index, "sunrise", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-3 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.dhuhrStart}
                          onChange={(e) => handleCellChange(index, "dhuhrStart", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-3 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.dhuhrJamaat}
                          onChange={(e) => handleCellChange(index, "dhuhrJamaat", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-3 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.asrStart}
                          onChange={(e) => handleCellChange(index, "asrStart", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-3 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.asrJamaat}
                          onChange={(e) => handleCellChange(index, "asrJamaat", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-3 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.maghrib}
                          onChange={(e) => handleCellChange(index, "maghrib", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-3 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.ishaStart}
                          onChange={(e) => handleCellChange(index, "ishaStart", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-3 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.ishaJamaat}
                          onChange={(e) => handleCellChange(index, "ishaJamaat", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-3 py-2 border border-[var(--secondary-color)] text-center">
                        <button
                          onClick={() => deleteRow(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete row"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--secondary-color)] flex justify-between items-center">
          <div className="text-[var(--text-color)]">
            {hasChanges && (
              <span className="text-[var(--yellow)] font-medium">● Unsaved changes</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-[var(--background-start)] text-[var(--text-color)] border border-[var(--secondary-color)] rounded-lg hover:bg-[var(--secondary-color)] transition-colors font-medium"
            >
              Cancel
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
      </div>
    </div>
  );
}
