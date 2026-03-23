// src/app/(themed)/admin/dashboard/DashBoardComponents/ManageTimetables.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  uploadTimetable,
  getTimetables,
  setActiveTimetable,
  archiveTimetable,
  restoreTimetable,
  deleteTimetable,
  validateFile,
  formatFileSize,
  type TimetableFile,
} from '@/lib/firebase/timetableStorage';

interface ManageTimetablesProps {
  onClose: () => void;
  setClosing: (val: boolean) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

type Tab = 'upload' | 'active' | 'archived';

export default function ManageTimetables({
  onClose,
  setClosing,
  onSuccess,
  onError,
}: ManageTimetablesProps) {
  const [tab, setTab] = useState<Tab>('active');
  const [timetables, setTimetables] = useState<TimetableFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Preview modal
  const [previewTimetable, setPreviewTimetable] = useState<TimetableFile | null>(null);

  // ---------- Fetch timetables ----------
  const fetchTimetables = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTimetables();
      setTimetables(data);
    } catch (err) {
      console.error('Failed to fetch timetables:', err);
      onError('Failed to load timetables');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);

  // ---------- File selection ----------
  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      onError(error);
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setLabel('');
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------- Drag & drop ----------
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // ---------- Upload ----------
  const handleUpload = async () => {
    if (!selectedFile) return;
    const fileLabel = label.trim() || selectedFile.name;
    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadTimetable(selectedFile, fileLabel, setUploadProgress);
      onSuccess(`Timetable "${fileLabel}" uploaded successfully`);
      clearSelection();
      await fetchTimetables();
      setTab('active');
    } catch (err: any) {
      console.error('Upload error:', err);
      onError(err?.message || 'Failed to upload timetable');
    } finally {
      setUploading(false);
    }
  };

  // ---------- Actions ----------
  const handleSetActive = async (id: string) => {
    try {
      await setActiveTimetable(id);
      onSuccess('Timetable set as active');
      await fetchTimetables();
    } catch (err) {
      console.error(err);
      onError('Failed to set timetable as active');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveTimetable(id);
      onSuccess('Timetable archived');
      await fetchTimetables();
    } catch (err) {
      console.error(err);
      onError('Failed to archive timetable');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreTimetable(id);
      onSuccess('Timetable restored');
      await fetchTimetables();
    } catch (err) {
      console.error(err);
      onError('Failed to restore timetable');
    }
  };

  const handleDelete = async (timetable: TimetableFile) => {
    try {
      await deleteTimetable(timetable);
      onSuccess('Timetable deleted');
      setConfirmDeleteId(null);
      await fetchTimetables();
    } catch (err) {
      console.error(err);
      onError('Failed to delete timetable');
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setClosing(true);
      setTimeout(onClose, 300);
    }
  };

  // ---------- Derived data ----------
  const activeTimetables = timetables.filter((t) => !t.archived);
  const archivedTimetables = timetables.filter((t) => t.archived);

  // ---------- Render helpers ----------
  const tabClasses = (t: Tab) =>
    `px-4 py-2 rounded-lg font-semibold text-sm transition ${
      tab === t
        ? 'bg-[var(--accent-color)] text-[var(--background-end)]'
        : 'bg-[var(--background-end)] text-[var(--text-color)] border border-[var(--secondary-color)] hover:opacity-80'
    }`;

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return 'Just now';
    return timestamp.toDate().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderFileCard = (t: TimetableFile, showArchiveActions = false) => (
    <div
      key={t.id}
      className={`relative rounded-xl border overflow-hidden transition ${
        t.active
          ? 'border-[var(--status-success)] ring-2 ring-[var(--status-success)]'
          : 'border-[var(--secondary-color)]'
      } bg-[var(--background-end)]`}
    >
      {/* Active badge */}
      {t.active && (
        <div className="absolute top-2 right-2 z-10 bg-[var(--status-success)] text-white text-xs font-bold px-2 py-1 rounded-md">
          ACTIVE
        </div>
      )}

      {/* Thumbnail */}
      <button
        type="button"
        className="w-full cursor-pointer"
        onClick={() => setPreviewTimetable(t)}
      >
        <div className="h-40 bg-[var(--background-start)] flex items-center justify-center overflow-hidden">
          <img
            src={t.imageData}
            alt={t.label}
            className="w-full h-full object-contain"
          />
        </div>
      </button>

      {/* Info */}
      <div className="p-4">
        <h4 className="font-semibold text-[var(--text-color)] truncate" title={t.label}>
          {t.label}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-[var(--text-muted)]">
            {formatFileSize(t.size)}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {formatDate(t.uploadedAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {!showArchiveActions && !t.active && (
            <button
              onClick={() => handleSetActive(t.id)}
              className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-md bg-[var(--status-success)] text-white hover:opacity-90 transition"
            >
              Set Active
            </button>
          )}

          {!showArchiveActions && (
            <button
              onClick={() => handleArchive(t.id)}
              className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-md bg-[var(--status-warning)] text-white hover:opacity-90 transition"
            >
              Archive
            </button>
          )}

          {showArchiveActions && (
            <button
              onClick={() => handleRestore(t.id)}
              className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-md bg-[var(--status-info)] text-white hover:opacity-90 transition"
            >
              Restore
            </button>
          )}

          {confirmDeleteId === t.id ? (
            <div className="flex gap-1 flex-1">
              <button
                onClick={() => handleDelete(t)}
                className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-md bg-[var(--status-error)] text-white hover:opacity-90 transition"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-md bg-[var(--secondary-color)] text-[var(--text-color)] hover:opacity-90 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteId(t.id)}
              className="py-1.5 px-3 text-xs font-semibold rounded-md bg-[var(--status-error)] text-white hover:opacity-90 transition"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button className={tabClasses('active')} onClick={() => setTab('active')}>
          Current ({activeTimetables.length})
        </button>
        <button className={tabClasses('upload')} onClick={() => setTab('upload')}>
          Upload New
        </button>
        <button className={tabClasses('archived')} onClick={() => setTab('archived')}>
          Archived ({archivedTimetables.length})
        </button>
      </div>

      {/* ── Upload Tab ── */}
      {tab === 'upload' && (
        <div className="bg-[var(--background-start)] rounded-xl p-6 border border-[var(--secondary-color)]">
          <h3 className="text-xl font-semibold text-[var(--accent-color)] mb-4">
            Upload Prayer Timetable
          </h3>

          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
                dragOver
                  ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                  : 'border-[var(--secondary-color)] hover:border-[var(--accent-color)]'
              }`}
            >
              <svg
                className="mx-auto h-12 w-12 text-[var(--secondary-color)] mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-[var(--text-color)] font-medium mb-1">
                Drag and drop your timetable image here
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                or click to browse — PNG, JPG, JPEG (max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="rounded-xl border border-[var(--secondary-color)] overflow-hidden bg-[var(--background-end)]">
                <div className="max-h-80 flex items-center justify-center overflow-hidden bg-[var(--background-start)]">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-80 w-auto object-contain"
                    />
                  )}
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--text-color)]">{selectedFile.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {formatFileSize(selectedFile.size)} &middot; {selectedFile.type.split('/')[1].toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={clearSelection}
                    disabled={uploading}
                    className="text-[var(--status-error)] hover:opacity-70 transition disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-color)] mb-1">
                  Label (e.g. &quot;March 2026 Timetable&quot;)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={selectedFile.name}
                  disabled={uploading}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] disabled:opacity-50"
                />
              </div>

              {/* Progress bar */}
              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span>{uploadProgress < 60 ? 'Compressing...' : uploadProgress < 100 ? 'Saving...' : 'Done!'}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--secondary-color)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-color)] rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload / Cancel */}
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className={`flex-1 py-3 px-6 font-semibold rounded-md transition flex items-center justify-center ${
                    uploading
                      ? 'bg-[var(--button-disabled)] cursor-not-allowed'
                      : 'bg-[var(--accent-color)] text-[var(--background-end)] hover:opacity-90'
                  }`}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload Timetable'
                  )}
                </button>
                <button
                  onClick={clearSelection}
                  disabled={uploading}
                  className="py-3 px-6 font-semibold rounded-md bg-[var(--secondary-color)] text-[var(--text-color)] hover:opacity-90 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Active / Current Tab ── */}
      {tab === 'active' && (
        <div className="bg-[var(--background-start)] rounded-xl p-6 border border-[var(--secondary-color)]">
          <h3 className="text-xl font-semibold text-[var(--accent-color)] mb-4">
            Current Timetables
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : activeTimetables.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-[var(--secondary-color)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-[var(--text-color)] font-medium">No timetables uploaded yet</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Switch to the &quot;Upload New&quot; tab to add your first timetable
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTimetables.map((t) => renderFileCard(t))}
            </div>
          )}
        </div>
      )}

      {/* ── Archived Tab ── */}
      {tab === 'archived' && (
        <div className="bg-[var(--background-start)] rounded-xl p-6 border border-[var(--secondary-color)]">
          <h3 className="text-xl font-semibold text-[var(--accent-color)] mb-4">
            Archived Timetables
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : archivedTimetables.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-[var(--secondary-color)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <p className="text-[var(--text-color)] font-medium">No archived timetables</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Archived timetables will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedTimetables.map((t) => renderFileCard(t, true))}
            </div>
          )}
        </div>
      )}

      {/* ── Close button ── */}
      <div className="flex justify-end">
        <button
          onClick={handleClose}
          disabled={uploading}
          className={`py-3 px-6 font-semibold rounded-md transition ${
            uploading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-[var(--secondary-color)] text-[var(--text-color)] hover:opacity-90'
          }`}
        >
          Close
        </button>
      </div>

      {/* ── Preview Modal ── */}
      {previewTimetable && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setPreviewTimetable(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setPreviewTimetable(null)}
              className="absolute -top-10 right-0 text-white hover:opacity-70 text-2xl font-bold"
            >
              &times;
            </button>

            {/* Label */}
            <div className="bg-[var(--background-end)] rounded-t-xl px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-color)] truncate">
                {previewTimetable.label}
              </h3>
              <a
                href={previewTimetable.imageData}
                download={previewTimetable.originalName}
                className="flex items-center gap-1 text-sm font-semibold text-[var(--accent-color)] hover:opacity-70 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
            </div>

            {/* Image */}
            <div className="bg-[var(--background-start)] rounded-b-xl overflow-auto max-h-[75vh]">
              <img
                src={previewTimetable.imageData}
                alt={previewTimetable.label}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
