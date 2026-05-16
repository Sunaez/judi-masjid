import { readdir } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IMAGE_DIRECTORIES = ['slideshow', 'SlideShow'] as const;
const IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.webp',
]);
const filenameSorter = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

async function readSlideshowDirectory() {
  const publicPath = path.join(process.cwd(), 'public');
  const publicEntries = await readdir(publicPath, { withFileTypes: true });

  const exactDirectory = IMAGE_DIRECTORIES
    .map((directoryName) =>
      publicEntries.find(
        (entry) => entry.isDirectory() && entry.name === directoryName
      )
    )
    .find((entry) => entry !== undefined);

  const fallbackDirectory = publicEntries.find(
    (entry) => entry.isDirectory() && entry.name.toLowerCase() === 'slideshow'
  );

  const directoryName = exactDirectory?.name ?? fallbackDirectory?.name;

  if (!directoryName) {
    return null;
  }

  const directoryPath = path.join(publicPath, directoryName);

  const entries = await readdir(directoryPath, { withFileTypes: true });
  return { directoryName, entries };
}

export async function GET() {
  try {
    const directory = await readSlideshowDirectory();

    if (!directory) {
      return NextResponse.json(
        { images: [] },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const images = directory.entries
      .filter((entry) => {
        if (!entry.isFile()) return false;
        return IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase());
      })
      .map((entry) => entry.name)
      .sort(filenameSorter.compare)
      .map(
        (filename) =>
          `/${directory.directoryName}/${encodeURIComponent(filename)}`
      );

    return NextResponse.json(
      { images },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[slideshow-images] Failed to load images:', error);
    console.error('[slideshow-images] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cwd: process.cwd(),
    });
    return NextResponse.json(
      { images: [] },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
