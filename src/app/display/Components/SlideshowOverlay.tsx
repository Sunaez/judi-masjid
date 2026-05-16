'use client';

import React, { useEffect, useMemo, useState } from 'react';

const SLIDE_DURATION_MS = 10_000;
const TRANSITION_DURATION_MS = 600;

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
    if (images.length <= 1) return;

    const interval = window.setInterval(() => {
      setIsTransitioning(true);
      // Wait for transition animation to complete before changing slide
      setTimeout(() => {
        setIndex((current) => (current + 1) % images.length);
        // Reset transition state after image changes
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, TRANSITION_DURATION_MS / 2);
    }, SLIDE_DURATION_MS);

    return () => window.clearInterval(interval);
  }, [images.length]);

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
      className="fixed inset-0 z-[2147483647] h-screen w-screen overflow-hidden bg-black"
      role="presentation"
      aria-live="off"
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
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl text-white/70">
          {loaded ? 'No SlideShow images found' : 'Loading SlideShow...'}
        </div>
      )}
    </div>
  );
}
