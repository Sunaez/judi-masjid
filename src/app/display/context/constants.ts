// src/app/display/context/constants.ts
// Debug/testing simulation of connection-error UI states.
//
// These drive the "simulate connection error" feature: while active, the
// PrayerTimesProvider overrides the real hook output with a simulated outage so
// the persistent error box + flashing indicator light can be demonstrated (and
// unit-tested) without waiting for real polling failures or network errors.

/** Error text shown in the persistent error box while simulating an outage. */
export const SIMULATED_ERROR_MESSAGE = 'Connection error — unable to reach prayer times service.';

/** Auto-clear the simulated outage after this many milliseconds once triggered. */
export const SIMULATED_ERROR_CLEAR_MS = 8000;

/** Increment the attempt counter (and flash the indicator light) every ~5s while simulating. */
export const SIMULATED_ERROR_INTERVAL_MS = 5000;
