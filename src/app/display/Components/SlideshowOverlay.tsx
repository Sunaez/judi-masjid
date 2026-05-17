'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { saveSlideIndex, subscribeSlideIndex } from '@/lib/firebase/slideshowSettings';

const AUTO_ADVANCE_MS = 40_000;
const DEACTIVATE_HOLD_MS = 5_000;
const DEACTIVATE_DISPLAY_DELAY_MS = 1_000;
const DEACTIVATE_TICK_MS = 1_000;

interface SlideshowImagesResponse {
  images?: unknown;
}

function normalizeImages(data: SlideshowImagesResponse): string[] {
  if (!Array.isArray(data.images)) return [];
  return data.images.filter((image): image is string => typeof image === 'string');
}

export default function SlideshowOverlay() {
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [holdCountdown, setHoldCountdown] = useState<number | null>(null);

  const imagesRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const isManualRef = useRef(false);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const leftDownRef = useRef(false);
  const deactivatedByHoldRef = useRef(false);

  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { isManualRef.current = isManual; }, [isManual]);

  // Load images
  useEffect(() => {
    const controller = new AbortController();

    async function loadImages() {
      try {
        const response = await fetch('/api/slideshow-images', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Failed to load slideshow images (${response.status})`);
        const data = (await response.json()) as SlideshowImagesResponse;
        setImages(normalizeImages(data));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('[SlideshowOverlay] Failed to load images:', error);
          setImages([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoaded(true);
      }
    }

    loadImages();
    return () => controller.abort();
  }, []);

  const goToSlide = useCallback((newIndex: number) => {
    setIndex(newIndex);
    indexRef.current = newIndex;
    saveSlideIndex(newIndex).catch((err) =>
      console.error('[SlideshowOverlay] Failed to save slide index:', err)
    );
  }, []);

  const advanceSlide = useCallback(() => {
    const imgs = imagesRef.current;
    if (imgs.length <= 1) return;
    goToSlide((indexRef.current + 1) % imgs.length);
  }, [goToSlide]);

  const goBackSlide = useCallback(() => {
    const imgs = imagesRef.current;
    if (imgs.length <= 1) return;
    goToSlide((indexRef.current - 1 + imgs.length) % imgs.length);
  }, [goToSlide]);

  // Auto-advance timer
  const stopAutoTimer = useCallback(() => {
    if (autoTimerRef.current !== null) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const startAutoTimer = useCallback(() => {
    stopAutoTimer();
    autoTimerRef.current = setInterval(() => {
      if (!isManualRef.current) advanceSlide();
    }, AUTO_ADVANCE_MS);
  }, [advanceSlide, stopAutoTimer]);

  useEffect(() => {
    startAutoTimer();
    return stopAutoTimer;
  }, [startAutoTimer, stopAutoTimer]);

  // Firebase slide index subscription — apply remote changes when they differ from local
  useEffect(() => {
    const unsub = subscribeSlideIndex(
      (remoteIndex) => {
        if (remoteIndex !== indexRef.current) {
          setIndex(remoteIndex);
          indexRef.current = remoteIndex;
        }
      },
      (err) => console.error('[SlideshowOverlay] Firebase slide index error:', err)
    );
    return unsub;
  }, []);

  // Hold-countdown cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdDelayRef.current !== null) clearTimeout(holdDelayRef.current);
      if (holdTimerRef.current !== null) clearTimeout(holdTimerRef.current);
      if (holdIntervalRef.current !== null) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const cancelHold = useCallback(() => {
    if (holdDelayRef.current !== null) { clearTimeout(holdDelayRef.current); holdDelayRef.current = null; }
    if (holdTimerRef.current !== null) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    if (holdIntervalRef.current !== null) { clearInterval(holdIntervalRef.current); holdIntervalRef.current = null; }
    setHoldCountdown(null);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle click → reset to slide 1
      if (e.button === 1) {
        e.preventDefault();
        goToSlide(0);
        return;
      }

      if (e.button === 0) {
        leftDownRef.current = true;

        if (isManualRef.current) {
          // Wait 1s before showing countdown so quick clicks don't flash it
          const countdownSteps = Math.round((DEACTIVATE_HOLD_MS - DEACTIVATE_DISPLAY_DELAY_MS) / DEACTIVATE_TICK_MS);

          holdDelayRef.current = setTimeout(() => {
            holdDelayRef.current = null;
            let remaining = countdownSteps;
            setHoldCountdown(remaining);

            holdIntervalRef.current = setInterval(() => {
              remaining -= 1;
              setHoldCountdown(remaining);
            }, DEACTIVATE_TICK_MS);
          }, DEACTIVATE_DISPLAY_DELAY_MS);

          holdTimerRef.current = setTimeout(() => {
            cancelHold();
            deactivatedByHoldRef.current = true;
            setIsManual(false);
            isManualRef.current = false;
            startAutoTimer();
          }, DEACTIVATE_HOLD_MS);
        }
      }
    },
    [cancelHold, goToSlide, startAutoTimer]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 2) {
        goBackSlide();
        return;
      }

      if (e.button === 0) {
        leftDownRef.current = false;

        // Hold completed — the timeout already switched to auto; ignore this mouseup
        if (deactivatedByHoldRef.current) {
          deactivatedByHoldRef.current = false;
          return;
        }

        if (!isManualRef.current) {
          // Auto mode: click activates manual mode
          setIsManual(true);
          isManualRef.current = true;
          stopAutoTimer();
        } else {
          // Manual mode: released before 5s → cancel hold and advance
          if (holdTimerRef.current !== null || holdDelayRef.current !== null) {
            cancelHold();
            advanceSlide();
          }
        }
      }
    },
    [advanceSlide, cancelHold, goBackSlide, stopAutoTimer]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (leftDownRef.current) {
      cancelHold();
      leftDownRef.current = false;
    }
  }, [cancelHold]);

  const safeIndex = images.length > 0 ? index % images.length : 0;
  const currentImage = images[safeIndex] ?? null;
  const nextImage = images.length > 1 ? (images[(safeIndex + 1) % images.length] ?? null) : null;

  return (
    <div
      className="fixed inset-0 z-[2147483647] h-screen w-screen cursor-pointer overflow-hidden bg-black"
      role="presentation"
      aria-live="off"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onMouseLeave={handleMouseLeave}
    >
      {currentImage ? (
        <div className="relative flex h-full w-full items-center justify-center">
          {/* Main slide — offset left slightly to leave room for preview */}
          <div className="flex h-full w-[82%] items-center justify-center">
            <img
              key={currentImage}
              src={currentImage}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="max-h-full max-w-full select-none object-contain"
            />
          </div>

          {/* Next slide preview — right strip */}
          {nextImage && (
            <div className="absolute right-3 top-1/2 w-[15%] -translate-y-1/2">
              <div className="overflow-hidden rounded-lg opacity-50 shadow-2xl">
                <img
                  src={nextImage}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="h-full w-full select-none object-contain"
                />
              </div>
            </div>
          )}

          {isManual && holdCountdown === null && (
            <div className="absolute right-4 top-4 rounded bg-black/60 px-3 py-1 text-sm text-white/70">
              Manual
            </div>
          )}

          {holdCountdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <div className="text-[20vw] font-bold leading-none text-white">
                  {holdCountdown}
                </div>
                <div className="mt-4 text-2xl text-white/70">Returning to auto mode&hellip;</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl text-white/70">
          {loaded ? 'No SlideShow images found' : 'Loading SlideShow...'}
        </div>
      )}
    </div>
  );
}
