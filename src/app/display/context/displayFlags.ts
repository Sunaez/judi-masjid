// Small, safe helpers for reading/writing the display-mode flags stored in
// localStorage (e.g. the "press 7 to simulate a connection error" flag).
// All access is wrapped so that any quota / access errors degrade gracefully
// instead of crashing the app.

const FLAG_KEY = 'judi.display.simulatedConnectionError'

export function readDisplayFlag(key: string): string {
  try {
    if (typeof localStorage === 'undefined') return ''
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

export function writeDisplayFlag(key: string, value: string | null): void {
  try {
    if (typeof localStorage === 'undefined') return
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  } catch {
    // ignore quota / access errors — the flag simply won't persist
  }
}

export function isSimulatedConnectionError(): boolean {
  return readDisplayFlag(FLAG_KEY).toLowerCase() === 'true'
}
