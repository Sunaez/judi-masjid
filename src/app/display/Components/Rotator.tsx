// src/app/display/Components/Rotator.tsx
'use client';

import React, { useEffect, useState, ReactElement } from 'react';

declare const require: any;

// 1) Grab every .tsx file in /Rotating
const context = require.context(
  '../Rotating',     // relative path from this file
  false,             // don't recurse into sub-folders
  /\.tsx$/           // only files ending in .tsx
);

// 2) Import them all and pull out the default export
const components: ReactElement[] = context
  .keys()
  .map((key: string) => {
    const Module = context(key).default;
    return <Module key={key} />;
  });

// 3) Rotator
export default function Rotator() {
  const DISPLAY_MS = 45_000; // 45 secs
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx(i => (i + 1) % components.length);
    }, DISPLAY_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex-1 flex items-center justify-center"
      style={{
        backgroundImage: 'linear-gradient(var(--background-start), var(--background-end))',
      }}
    >
      {components[idx]}
    </div>
  );
}
