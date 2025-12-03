// src/app/(themed)/admin/dashboard/DashBoardComponents/SyncPrayerTimes.tsx
'use client';

import React, { useState } from 'react';
import { syncFromCSV, getTodayDateString } from '@/lib/firebase/prayerTimes';

interface SyncPrayerTimesProps {
  onClose: () => void;
  setClosing: (val: boolean) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQfoFEcprp-CYQjw40GrjdNWToUSvv10TjQzpw30vPkpLdwLz5NSeKKhNlsseeAkWR5wBAZLnzNpDcq/pub?output=csv';

export default function SyncPrayerTimes({
  onClose,
  setClosing,
  onSuccess,
  onError,
}: SyncPrayerTimesProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Fetching data from Google Sheets...');

    try {
      const result = await syncFromCSV(CSV_URL);

      setSyncStatus(
        `✅ Sync completed! ${result.success} prayer times saved${
          result.failed > 0 ? `, ${result.failed} failed` : ''
        }`
      );

      const now = new Date();
      setLastSyncTime(now.toLocaleString());

      onSuccess(
        `Successfully synced ${result.success} prayer times to Firebase`
      );

      setTimeout(() => {
        setClosing(true);
        setTimeout(onClose, 300);
      }, 2000);
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setSyncStatus(`❌ Sync failed: ${errorMessage}`);
      onError(`Failed to sync: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClose = () => {
    if (!isSyncing) {
      setClosing(true);
      setTimeout(onClose, 300);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[var(--background-start)] rounded-xl p-6 border border-[var(--secondary-color)]">
        <h3 className="text-xl font-semibold text-[var(--accent-color)] mb-4">
          📊 Sync Prayer Times from Google Sheets
        </h3>

        <div className="space-y-4">
          <p className="text-[var(--text-color)]">
            This will fetch all prayer times from your Google Sheets and save
            them to Firebase Firestore.
          </p>

          <div className="bg-[var(--background-end)] rounded-lg p-4 border border-[var(--secondary-color)]">
            <p className="text-sm text-[var(--text-color)] mb-2">
              <strong>Current Date:</strong> {getTodayDateString()}
            </p>
            {lastSyncTime && (
              <p className="text-sm text-[var(--text-color)]">
                <strong>Last Sync:</strong> {lastSyncTime}
              </p>
            )}
          </div>

          {syncStatus && (
            <div
              className={`rounded-lg p-4 ${
                syncStatus.startsWith('✅')
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : syncStatus.startsWith('❌')
                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
              }`}
            >
              <p className="font-medium">{syncStatus}</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex-1 py-3 px-6 font-semibold rounded-md transition flex items-center justify-center ${
                isSyncing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[var(--accent-color)] text-[var(--background-end)] hover:opacity-90'
              }`}
            >
              {isSyncing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                '🔄 Start Sync'
              )}
            </button>

            <button
              onClick={handleClose}
              disabled={isSyncing}
              className={`py-3 px-6 font-semibold rounded-md transition ${
                isSyncing
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[var(--secondary-color)] text-[var(--text-color)] hover:opacity-90'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[var(--background-start)] rounded-xl p-6 border border-[var(--secondary-color)]">
        <h4 className="text-lg font-semibold text-[var(--accent-color)] mb-3">
          📝 How Auto-Sync Works
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-[var(--text-color)]">
          <li>Edit your Google Sheets as usual</li>
          <li>Apps Script automatically detects changes</li>
          <li>Data is pushed to Firebase in real-time</li>
          <li>Use this manual sync if auto-sync fails</li>
        </ol>

        <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ <strong>Note:</strong> Set up Apps Script in your Google Sheet
            for automatic syncing. Manual sync is a backup option.
          </p>
        </div>
      </div>
    </div>
  );
}
