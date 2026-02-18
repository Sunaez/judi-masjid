# Ramadan Feature Changelog

Date: 2026-02-18

## Scope
- Updated files: 12
- New files: 17
- Total files touched: 29

## Main Website Changes
- Added Ramadan-aware timetable naming (`R-YYYY.jpg`) on the homepage timetable section.
- Added Ramadan Mubarak message banner using the existing theme color variables.
- Added direct Ramadan timetable download link and full-view timetable image/link during Ramadan.

## Display Rotator Changes
- Added Ramadan-only `Taraweh` special slide.
- Taraweh time is calculated as `Isha Jamaat + 20 minutes`.
- Rotator slot order is now dynamic and inserts/removes Taraweh based on Ramadan status.
- Updated Welcome special to show `Ramadan Mubarak` during the first 10 days of Ramadan.
- Added debug Ramadan preview mode (key `6`) so Ramadan visuals can be tested quickly without date changes.

## Display Post-Prayer Event Changes
- Added a new 5-minute post-prayer overlay table for display mode.
- Overlay appears after prayer windows and shows:
  - Gregorian and Hijri dates
  - Larger prayer table layout
  - Start and Jamaat columns for Fajr, Dhuhr, Asr, Maghrib, Isha
  - Taraweh row during Ramadan
- Wired into the display page overlay stack.
- Added a short manual preview trigger for this overlay via key `5`.

## Display Timeline Changes
- Display prayer timeline now extends during Ramadan with a `Taraweh` event.
- Added `white-taraweh.webp` icon support in the timeline.
- Taraweh timeline point appears only during Ramadan (or when Ramadan preview keybind is enabled).
- Added minimum visual spacing between `Isha` and `Taraweh` markers for clearer readability.

## Shared Logic and Context Changes
- Added shared Islamic date utility helpers:
  - `isRamadanDate`
  - `isRamadanPeriod`
  - `isFirstTenDaysOfRamadan`
  - `isLastTenDaysOfRamadan`
- Added shared prayer time helpers:
  - `addMinutesToTime`
  - jamaat row builders
  - active post-prayer window detection
- Updated `PrayerTimesContext` to expose:
  - `isRamadan`
  - `isRamadanPeriod`
  - `isFirstTenRamadanDays`
  - `isLastTenRamadanDays`
- Downtime logic now uses Ramadan-period helper for 3-hour post-Isha behavior.

## Testing Changes
- Added new test coverage for:
  - Ramadan homepage timetable behavior
  - Ramadan/Islamic date helpers
  - Prayer time math and post-prayer windows
  - Rotator slot composition (with/without Taraweh)
  - Display Welcome Ramadan greeting behavior
  - Post-prayer overlay behavior
  - Isha/Taraweh timeline spacing
  - Debug keybind shortcuts (`5` short table preview, `6` Ramadan preview toggle)
  - Ramadan flags in prayer context
- Updated legacy Vitest-based suites to Jest so they run with the current project test runner.
- Full Jest suite now passes (`18` suites, `128` tests).

## Manual Verification Support
- Added a manual display events page at:
  - `/display/test-events`
- Page includes live/simulated event checks for:
  - Ramadan flags
  - Taraweh time
  - Rotator order
  - Active post-prayer window
  - Jamaat table data and windows
