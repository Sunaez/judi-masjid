'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

const TRANSITION_DURATION_MS = 600;
const RESET_COUNTDOWN_SECONDS = 5;

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [resetCountdown, setResetCountdown] = useState<number | null>(null);

  const leftDownRef = useRef(false);
  const rightDownRef = useRef(false);
  const wasComboRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadImages() {
      try {
        const response = await fetch('/api/slideshow-images', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load slideshow images (${response.status})`);
        }

        const data = (await response.json()) as SlideshowImagesResponse;
        setImages(normalizeImages(data));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('[SlideshowOverlay] Failed to load images:', error);
          setImages([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoaded(true);
        }
      }
    }

    loadImages();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [images.length]);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current !== null) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, []);

  const cancelCountdown = () => {
    if (countdownTimerRef.current !== null) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setResetCountdown(null);
  };

  const startCountdown = () => {
    cancelCountdown();

    const tick = (value: number) => {
      if (value === 0) {
        setIndex(0);
        setResetCountdown(null);
        countdownTimerRef.current = null;
        wasComboRef.current = false;
        leftDownRef.current = false;
        rightDownRef.current = false;
        return;
      }
      setResetCountdown(value);
      countdownTimerRef.current = setTimeout(() => tick(value - 1), 1000);
    };

    tick(RESET_COUNTDOWN_SECONDS);
  };

  const advanceSlide = () => {
    if (images.length <= 1 || isTransitioningRef.current) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setIndex((current) => (current + 1) % images.length);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, TRANSITION_DURATION_MS / 2);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) leftDownRef.current = true;
    if (e.button === 2) rightDownRef.current = true;

    if (leftDownRef.current && rightDownRef.current && countdownTimerRef.current === null) {
      wasComboRef.current = true;
      startCountdown();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 0) {
      if (!wasComboRef.current) {
        advanceSlide();
      }
      leftDownRef.current = false;
    }
    if (e.button === 2) {
      rightDownRef.current = false;
    }

    if (wasComboRef.current && countdownTimerRef.current !== null) {
      cancelCountdown();
    }

    if (!leftDownRef.current && !rightDownRef.current) {
      wasComboRef.current = false;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleMouseLeave = () => {
    cancelCountdown();
    leftDownRef.current = false;
    rightDownRef.current = false;
    wasComboRef.current = false;
  };

  const currentImage = images[index] ?? null;

  const prevImage = useMemo(() => {
    if (images.length <= 1) return null;
    return images[(index - 1 + images.length) % images.length] ?? null;
  }, [images, index]);

  const nextImage = useMemo(() => {
    if (images.length <= 1) return null;
    return images[(index + 1) % images.length] ?? null;
  }, [images, index]);

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
        <div className="relative h-full w-full overflow-hidden">
          {/* Previous Slide Preview - Left Side (Fixed Position) */}
          <div
            className="absolute left-4 top-1/2 z-10 w-[12vw] -translate-y-1/2 transition-all duration-700 ease-in-out"
            style={{
              opacity: isTransitioning ? 0.3 : 0.5,
              transform: `translateY(-50%) translateX(${isTransitioning ? '-30px' : '0px'}) scale(${isTransitioning ? 0.9 : 1})`,
            }}
          >
            {prevImage && (
              <div className="aspect-video w-full overflow-hidden rounded-lg shadow-2xl">
                <img
                  src={prevImage}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="h-full w-full select-none object-contain"
                />
              </div>
            )}
          </div>

          {/* Main Current Slide - Center (Maximized) */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out"
            style={{
              opacity: isTransitioning ? 0 : 1,
            }}
          >
            <div className="relative h-full w-full px-[15vw] py-8">
              <div className="flex h-full w-full items-center justify-center">
                <img
                  key={currentImage}
                  src={currentImage}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="max-h-full max-w-full select-none object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Next Slide Preview - Right Side (Fixed Position) */}
          <div
            className="absolute right-4 top-1/2 z-10 w-[12vw] -translate-y-1/2 transition-all duration-700 ease-in-out"
            style={{
              opacity: isTransitioning ? 0.8 : 0.5,
              transform: `translateY(-50%) translateX(${isTransitioning ? '30px' : '0px'}) scale(${isTransitioning ? 1.1 : 1})`,
            }}
          >
            {nextImage && (
              <div className="aspect-video w-full overflow-hidden rounded-lg shadow-2xl">
                <img
                  src={nextImage}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="h-full w-full select-none object-contain"
                />
              </div>
            )}
          </div>

          {/* Preload next-next image */}
          {images.length > 2 && (
            <img
              src={images[(index + 2) % images.length]}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="hidden"
            />
          )}

          {/* Reset countdown overlay */}
          {resetCountdown !== null && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <div className="text-[20vw] font-bold leading-none text-white drop-shadow-2xl">
                  {resetCountdown}
                </div>
                <div className="mt-4 text-2xl text-white/70">Returning to slide 1&hellip;</div>
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
