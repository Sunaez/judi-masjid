"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPrayerTimesByMonth, batchSavePrayerTimes } from "@/lib/firebase/prayerTimes";
import type { RawPrayerTimes } from "@/app/FetchPrayerTimes";
import NavBar from "../../AdminComponents/NavBar";

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

export default function PrayerTimesEditorPage() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setSuccessMessage(null);
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
      setSuccessMessage("Prayer times saved successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reload to confirm save
      await loadPrayerTimesForYear();
    } catch (err) {
      console.error("Error saving prayer times:", err);
      setError("Failed to save prayer times");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      const confirm = window.confirm("You have unsaved changes. Are you sure you want to go back?");
      if (!confirm) return;
    }
    router.push("/admin/dashboard");
  };

  // Generate year options (current year ± 2 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[var(--background-start)] to-[var(--background-end)]">
      <NavBar />

      <div className="flex-grow p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)] text-[var(--background-end)] rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-[var(--text-color)]">
                Local Prayer Times Editor
              </h1>
            </div>

            <div className="flex items-center gap-4">
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

          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          {hasChanges && !successMessage && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
              ● You have unsaved changes
            </div>
          )}
        </div>

        {/* Table Container */}
        <div className="bg-[var(--background-end)] border border-[var(--secondary-color)] rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-[var(--text-color)] text-lg">Loading prayer times...</div>
            </div>
          ) : prayerTimes.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-[var(--text-color)] text-lg">No prayer times found. Click "Add Row" to create entries.</div>
            </div>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-250px)]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-[var(--accent-color)] text-[var(--background-end)]">
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[120px]">Date</th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[80px]">Fajr</th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[100px]">Fajr-Jamaat</th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[80px]">Sunrise</th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[80px]">Dhuhr</th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[110px]">Dhuhr-Jamaat</th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[80px]">Asr</th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[100px]">Asr-Jamaat</th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[80px]">Maghrib</th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[80px]">Isha</th>
                    <th className="px-4 py-3 text-left font-bold border border-[var(--secondary-color)] min-w-[100px]">Isha-Jamaat</th>
                    <th className="px-4 py-3 text-center font-bold border border-[var(--secondary-color)] min-w-[80px]">Actions</th>
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
                      <td className="px-4 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.date}
                          onChange={(e) => handleCellChange(index, "date", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] focus:ring-2 focus:ring-[var(--accent-color)] rounded"
                          placeholder="DD/MM/YYYY"
                        />
                      </td>
                      <td className="px-4 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.fajrStart}
                          onChange={(e) => handleCellChange(index, "fajrStart", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] focus:ring-2 focus:ring-[var(--accent-color)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-4 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.fajrJamaat}
                          onChange={(e) => handleCellChange(index, "fajrJamaat", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] focus:ring-2 focus:ring-[var(--accent-color)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-4 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.sunrise}
                          onChange={(e) => handleCellChange(index, "sunrise", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] focus:ring-2 focus:ring-[var(--accent-color)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-4 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.dhuhrStart}
                          onChange={(e) => handleCellChange(index, "dhuhrStart", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] focus:ring-2 focus:ring-[var(--accent-color)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-4 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.dhuhrJamaat}
                          onChange={(e) => handleCellChange(index, "dhuhrJamaat", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] focus:ring-2 focus:ring-[var(--accent-color)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-4 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.asrStart}
                          onChange={(e) => handleCellChange(index, "asrStart", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] focus:ring-2 focus:ring-[var(--accent-color)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-4 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.asrJamaat}
                          onChange={(e) => handleCellChange(index, "asrJamaat", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] focus:ring-2 focus:ring-[var(--accent-color)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-4 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.maghrib}
                          onChange={(e) => handleCellChange(index, "maghrib", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] focus:ring-2 focus:ring-[var(--accent-color)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-4 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.ishaStart}
                          onChange={(e) => handleCellChange(index, "ishaStart", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] focus:ring-2 focus:ring-[var(--accent-color)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-4 py-2 border border-[var(--secondary-color)]">
                        <input
                          type="text"
                          value={row.ishaJamaat}
                          onChange={(e) => handleCellChange(index, "ishaJamaat", e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-[var(--text-color)] focus:outline-none focus:bg-[var(--background-start)] focus:ring-2 focus:ring-[var(--accent-color)] rounded"
                          placeholder="HH:MM"
                        />
                      </td>
                      <td className="px-4 py-2 border border-[var(--secondary-color)] text-center">
                        <button
                          onClick={() => deleteRow(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete row"
                        >
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>
    </div>
  );
}
