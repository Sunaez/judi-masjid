'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, MonitorPlay, Power, Save } from 'lucide-react';
import {
  clearSlideshowSettings,
  dailyTimeToMinutes,
  DEFAULT_SLIDESHOW_SETTINGS,
  isSlideshowWindowActive,
  normalizeDailyTimeValue,
  saveSlideshowSettings,
  subscribeSlideshowSettings,
  type SlideshowSettings,
} from '@/lib/firebase/slideshowSettings';

interface ControlSlideshowProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function formatScheduleTime(value: string | null): string {
  const normalized = normalizeDailyTimeValue(value);
  return normalized || 'Not set';
}

function getScheduleStatus(settings: SlideshowSettings, now: Date) {
  if (!settings.active) {
    return {
      label: 'Inactive',
      detail: 'No slideshow schedule is enabled.',
      className: 'bg-[var(--secondary-color)] text-[var(--text-color)]',
    };
  }

  if (!settings.startTime || !settings.endTime) {
    return {
      label: 'Incomplete',
      detail: 'Set both a start time and an end time.',
      className: 'bg-[var(--status-warning)] text-white',
    };
  }

  const start = dailyTimeToMinutes(settings.startTime);
  const end = dailyTimeToMinutes(settings.endTime);

  if (start === null || end === null || start === end) {
    return {
      label: 'Invalid',
      detail: 'Choose two different daily times.',
      className: 'bg-[var(--status-error)] text-white',
    };
  }

  if (isSlideshowWindowActive(settings, now)) {
    return {
      label: 'Live now',
      detail: `Runs daily until ${formatScheduleTime(settings.endTime)}`,
      className: 'bg-[var(--status-success)] text-white',
    };
  }

  const current = now.getHours() * 60 + now.getMinutes();
  const startsLaterToday =
    start < end ? current < start : current < start && current >= end;

  if (startsLaterToday) {
    return {
      label: 'Scheduled today',
      detail: `Runs daily from ${formatScheduleTime(settings.startTime)} to ${formatScheduleTime(settings.endTime)}`,
      className: 'bg-[var(--status-info)] text-white',
    };
  }

  return {
    label: 'Waiting',
    detail: `Next run starts tomorrow at ${formatScheduleTime(settings.startTime)}`,
    className: 'bg-[var(--secondary-color)] text-[var(--text-color)]',
  };
}

export default function ControlSlideshow({
  onSuccess,
  onError,
}: ControlSlideshowProps) {
  const [settings, setSettings] = useState<SlideshowSettings>(
    DEFAULT_SLIDESHOW_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formActive, setFormActive] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const unsubscribe = subscribeSlideshowSettings(
      (nextSettings) => {
        setSettings(nextSettings);
        setFormStart(normalizeDailyTimeValue(nextSettings.startTime));
        setFormEnd(normalizeDailyTimeValue(nextSettings.endTime));
        setFormActive(nextSettings.active);
        setLoading(false);
      },
      (error) => {
        console.error('[ControlSlideshow] Failed to load settings:', error);
        onError('Failed to load slideshow settings');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [onError]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const status = useMemo(
    () => getScheduleStatus(settings, now),
    [settings, now]
  );

  const handleSave = async () => {
    if (!formStart || !formEnd) {
      onError('Set both a start time and an end time');
      return;
    }

    const startTime = normalizeDailyTimeValue(formStart);
    const endTime = normalizeDailyTimeValue(formEnd);

    if (!startTime || !endTime) {
      onError('Set valid slideshow times');
      return;
    }

    if (startTime === endTime) {
      onError('The slideshow start and end times must be different');
      return;
    }

    setSaving(true);
    try {
      await saveSlideshowSettings({
        active: formActive,
        startTime,
        endTime,
      });
      onSuccess(
        formActive
          ? 'SlideShow schedule saved'
          : 'SlideShow schedule saved as inactive'
      );
    } catch (error) {
      console.error('[ControlSlideshow] Failed to save settings:', error);
      onError('Failed to save slideshow settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await clearSlideshowSettings();
      onSuccess('SlideShow disabled');
    } catch (error) {
      console.error('[ControlSlideshow] Failed to disable slideshow:', error);
      onError('Failed to disable slideshow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="aero-panel admin-settings-card">
      <div className="admin-settings-heading">
        <div className="admin-settings-title">
          <span className="rounded-lg bg-[var(--accent-color)] p-3 text-[var(--background-end)]">
            <MonitorPlay size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--accent-color)]">
              Display slideshow
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Choose when the slideshow appears on the masjid display.
            </p>
          </div>
        </div>

        <div className="admin-settings-status">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}
          >
            {status.label}
          </span>
          <span className="text-sm text-[var(--text-muted)]">
            {status.detail}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8" role="status"><span className="sr-only">Loading settings...</span>
          <svg
            className="h-7 w-7 animate-spin text-[var(--accent-color)]"
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium text-[var(--text-color)]">
              <CalendarClock size={16} aria-hidden="true" />
              Start time
            </span>
            <input
              type="time"
              value={formStart}
              onChange={(event) => setFormStart(event.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] px-4 py-2.5 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] disabled:opacity-50"
            />
          </label>

          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium text-[var(--text-color)]">
              <CalendarClock size={16} aria-hidden="true" />
              End time
            </span>
            <input
              type="time"
              value={formEnd}
              onChange={(event) => setFormEnd(event.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] px-4 py-2.5 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] disabled:opacity-50"
            />
          </label>

          <label className="flex min-h-[46px] items-center gap-3 rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] px-4 py-2.5 text-[var(--text-color)]">
            <input
              type="checkbox"
              checked={formActive}
              onChange={(event) => setFormActive(event.target.checked)}
              disabled={saving}
              className="h-5 w-5 accent-[var(--accent-color)]"
            />
            <span className="text-sm font-medium">Enabled</span>
          </label>
        </div>
      )}

      <div className="admin-settings-actions">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving}
          className="aero-button"
        >
          <Save size={18} aria-hidden="true" />
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={loading || saving}
          className="aero-button aero-button-secondary"
        >
          <Power size={18} aria-hidden="true" />
          Disable
        </button>
      </div>
    </section>
  );
}
