# Display recovery changes

Implemented following the 9 September 2026 continuous-operation audit. The original audit remains a record of the pre-fix findings.

| Audit finding | Result |
| --- | --- |
| Refresh errors replacing cached content | Current-date prayer times remain visible; a small retry status replaces the blocking error screen when usable data exists. |
| Slideshow settings blocking startup | Initial subscription waits are bounded to 20 seconds. Normal display becomes available while recovery continues. |
| Terminal slideshow subscription failures | One listener is reattached with 5-second exponential backoff capped at one minute. Late callbacks are ignored and timers/listeners are cleaned up. |
| Malformed notice data crashing rendering | Messages and conditions are validated. Invalid notices are isolated; valid notices remain eligible. Blank optional references produced by the existing editor remain supported. A recoverable panel boundary contains unexpected rendering errors. |
| Weather notices bypassing restrictions | Both notice slots use complete eligibility rules, including day, time and prayer restrictions. Unknown weather no longer counts as matching weather. |
| Individual failed slide images | Failed images are skipped for five minutes and then retried. An all-failed set shows a recovery message instead of cycling through broken images. |
| Remote slide changes racing the local timer | An accepted remote index restarts the local interval, giving that selection a full 40 seconds. Existing mouse controls remain available. |
| Missing daily transition animations | Both screens mount before animation begins. Temporary GSAP styles are reverted before React commits final visibility, avoiding a hidden incoming screen after cleanup. |
| Obsolete weather appearing current | Observations older than 30 minutes are no longer exposed as current. Missing temperature is shown as unavailable, never a fabricated zero. |
| Unbounded weather lock wait | Lock work has a deadline and an abort signal. A failed acquisition returns to the bounded retry path. |

Additional protections:

- Timetable snapshots are validated, labelled with their date, and persisted with a four-date limit and seven-day retention. A separate bounded prefetch prepares tomorrow's timetable and retries missing data. Yesterday's timetable is never relabelled as today's.
- The last successful slideshow manifest survives reloads. A production service worker scoped to `/display` caches the public display document and its static assets, with separate bounded image storage. API responses and admin pages are not cached. Offline startup requires a previous successful online visit and browser storage permission.
- Scheduling, prayer instants and clock/date presentation use `Europe/London`, including 23/25-hour midnight boundaries. Tests cover explicit UTC instants and both daylight-saving changes.
- Key **0** restores automatic mode. Key **1** toggles from the effective current mode and expires after 30 minutes. Ramadan preview expires after five minutes. Old preview signals are not replayed after remounting.
- The donation slide waits for verified settings instead of displaying default fundraising amounts. It retains the last verified totals across rotations and retries failed subscriptions. Admin defaults and editing behavior are preserved.
- The post-prayer table now has five minutes after the three-minute in-progress overlay finishes. Taraweh retains its existing window because there is no preceding in-progress overlay for it.
- Distant Eid timers were replaced with bounded periodic eligibility checks. Confirmed Eid dates can be supplied through deployment configuration; no future lunar dates are guessed.
- Deployment checks remain mounted during timetable errors. Reloads wait while prayer/post-prayer overlays or the slideshow are active, and repeated reload attempts for the same version are throttled.
- Message animation cleanup owns already-started tweens. Long text falls back to a whole-text animation rather than generating an excessive number of animated characters; animation duration is bounded by the display slot.
- Supported browsers request a screen wake lock and retry after release/visibility changes. The page exposes `data-display-heartbeat` and `data-display-last-error` on `<html>` for local health checks. These attributes do not send telemetry anywhere.

## Validation

The final verification includes the complete Jest suite, a production build/type check, and a real headless Edge browser run. Browser results are retained in [display-browser-results.json](audits/2026-09-09/display-browser-results.json), with a [1920×1080 screenshot](audits/2026-09-09/display-recovery-browser.png).

Results: **298 tests passed across 43 suites**, including 34 additional checks compared with the pre-fix 264-test baseline. The production build and TypeScript checks passed. The build continues to report existing lint warnings, including image optimization suggestions and unrelated admin-code warnings.

The browser ran with a UTC device time zone, seeded date-labelled timetables, and injected Firebase/weather network failures. It checked visible normal/off-peak transitions, the London clock, return to automatic mode, preview cleanup, a simulated midnight and next-day opening, and a production reload with the browser offline. No uncaught page errors occurred. This is accelerated lifecycle testing, not a physical multi-day soak test.

Reproduce the browser check against a local production server on port 3100:

```powershell
npm run build
npm run start -- --port 3100
# In a separate terminal; uses the installed Edge browser:
npm exec --yes --package=playwright -- node scripts/display-browser-check.cjs
```

The script uses an isolated browser context and blocks Firebase requests; it does not edit live database documents. Playwright is used from the npm execution cache, without adding a project dependency.

## Deployment and device responsibilities

Provide confirmed event timestamps with explicit offsets through these variables before deploying future Eid announcements:

```text
NEXT_PUBLIC_EID_NOTICE_START
NEXT_PUBLIC_EID_NOTICE_END
NEXT_PUBLIC_EID_GREETING_START
NEXT_PUBLIC_EID_GREETING_END
```

Absent configuration, the existing May 2026 dates remain the defaults, which are inactive after their end dates. Invalid configured dates also remain inactive. The event venue and prayer-time wording still need to match the mosque's confirmed arrangements.

The device still needs an accurate OS clock, kiosk auto-start/power settings, and a supported browser. Wake locks cannot override every OS policy or recover a crashed browser process, and application code cannot prevent panel burn-in. Offline caching is bounded and depends on the browser retaining storage; it cannot supply future timetables that have never been downloaded.

No fleet-wide load test, physical memory/GPU soak, or hosting/quota inspection was performed. The audit's speculative scale risks—large message collections, cache sharing across server instances, and the Firebase SDK's internal transport behavior—are not represented as proven memory leaks or as eliminated infrastructure risks. The existing request timeouts bound application waits; they do not add cancellation support to the Firebase SDK's `getDoc/getDocs` methods.

These changes have not been deployed from this workspace.
