'use client';

import { useEffect, useRef } from 'react';
import { withTimeout } from '@/lib/withTimeout';

const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const VERSION_REQUEST_TIMEOUT_MS = 20_000;

type VersionResponse = {
  version?: string;
};

export default function AutoReloadOnNewVersion({
  currentVersion,
}: {
  currentVersion: string;
}) {
  const isReloadingRef = useRef(false);

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    const checkForNewVersion = async () => {
      if (disposed || isReloadingRef.current) return;
      const request = new AbortController();
      controller = request;

      try {
        const data = await withTimeout((async () => {
          const response = await fetch(
            `/api/deployment-version?t=${Date.now()}`,
            { cache: 'no-store', signal: request.signal }
          );
          if (!response.ok) throw new Error(`Version check failed (${response.status})`);
          return (await response.json()) as VersionResponse;
        })(), VERSION_REQUEST_TIMEOUT_MS, request.signal);

        if (!disposed && data.version && data.version !== currentVersion &&
            navigator.onLine !== false && !document.querySelector('[data-display-busy]')) {
          // Avoid a reload loop if an offline document or rolling deployment is served.
          try {
            const previous = JSON.parse(sessionStorage.getItem('judi.display.reload') ?? 'null');
            if (previous?.version === data.version && Date.now() - previous.at < 30 * 60_000) return;
            sessionStorage.setItem('judi.display.reload', JSON.stringify({ version: data.version, at: Date.now() }));
          } catch { /* Reload still works when browser storage is disabled. */ }
          isReloadingRef.current = true;
          window.location.reload();
        }
      } catch (error) {
        if (!disposed) console.error('[Display] Failed to check deployment version:', error);
      } finally {
        request.abort();
        if (!disposed && !isReloadingRef.current) {
          timer = setTimeout(checkForNewVersion, VERSION_CHECK_INTERVAL_MS);
        }
      }
    };

    void checkForNewVersion();

    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
    };
  }, [currentVersion]);

  return null;
}
