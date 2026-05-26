'use client';

import { useEffect, useRef } from 'react';

const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

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
    const checkForNewVersion = async () => {
      if (isReloadingRef.current) return;

      try {
        const response = await fetch(
          `/api/deployment-version?t=${Date.now()}`,
          { cache: 'no-store' }
        );

        if (!response.ok) return;

        const data = (await response.json()) as VersionResponse;

        if (data.version && data.version !== currentVersion) {
          isReloadingRef.current = true;
          window.location.reload();
        }
      } catch (error) {
        console.error('[Display] Failed to check deployment version:', error);
      }
    };

    const intervalId = window.setInterval(
      checkForNewVersion,
      VERSION_CHECK_INTERVAL_MS
    );

    void checkForNewVersion();

    return () => window.clearInterval(intervalId);
  }, [currentVersion]);

  return null;
}
