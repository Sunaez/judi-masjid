'use client';

import React, { useEffect, useMemo, useState } from 'react';

const SLIDE_DURATION_MS = 10_000;

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
      setIndex((current) => (current + 1) % images.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearInterval(interval);
  }, [images.length]);

  const currentImage = images[index] ?? null;
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
        <img
          key={currentImage}
          src={currentImage}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="h-full w-full select-none object-contain"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl text-white/70">
          {loaded ? 'No SlideShow images found' : 'Loading SlideShow...'}
        </div>
      )}

      {nextImage && (
        <img
          src={nextImage}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="hidden"
        />
      )}
    </div>
  );
}
