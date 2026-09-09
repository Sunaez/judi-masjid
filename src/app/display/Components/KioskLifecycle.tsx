'use client';

import { useEffect } from 'react';

export default function KioskLifecycle() {
  useEffect(() => {
    let disposed = false;
    let requesting = false;
    let lock: WakeLockSentinel | undefined;
    const keepAwake = async () => {
      if (disposed || requesting || document.hidden || (lock && !lock.released) || !navigator.wakeLock) return;
      requesting = true;
      try {
        const acquired = await navigator.wakeLock.request('screen');
        if (disposed) await acquired.release();
        else lock = acquired;
      } catch { /* OS policies can deny a wake lock; retry on the next heartbeat. */ }
      finally { requesting = false; }
    };
    const heartbeat = () => {
      document.documentElement.dataset.displayHeartbeat = String(Date.now());
      void keepAwake();
    };
    const recordError = () => {
      document.documentElement.dataset.displayLastError = String(Date.now());
    };
    heartbeat();
    const timer = setInterval(heartbeat, 60_000);
    document.addEventListener('visibilitychange', heartbeat);
    window.addEventListener('error', recordError);
    window.addEventListener('unhandledrejection', recordError);
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/display-sw.js', { scope: '/display', updateViaCache: 'none' })
        .then(() => navigator.serviceWorker.ready)
        .then(registration => {
          if (!disposed) registration.active?.postMessage({ type: 'CACHE_DISPLAY', assets:
            performance.getEntriesByType('resource').map(entry => entry.name).filter(name =>
              name.startsWith(`${location.origin}/_next/static/`)).slice(-100),
          });
        })
        .catch(() => { /* Storage or browser policy may disallow offline caching. */ });
    }
    return () => {
      disposed = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', heartbeat);
      window.removeEventListener('error', recordError);
      window.removeEventListener('unhandledrejection', recordError);
      void lock?.release().catch(() => {});
      delete document.documentElement.dataset.displayHeartbeat;
      delete document.documentElement.dataset.displayLastError;
    };
  }, []);
  return null;
}
