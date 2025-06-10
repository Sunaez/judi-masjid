// src/app/display/Components/Rotator/Footer.tsx
'use client';

import React from 'react';
import type { MessageWithConditions } from './Messages';

interface FooterProps {
  message: MessageWithConditions;
}

export default function Footer({ message }: FooterProps) {
  const { sourceType, quran, hadith, other } = message;

  return (
    <div
      className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm"
      style={{ color: 'var(--text-color)' }}
    >
      {sourceType === 'quran' && quran && (
        <>Sūrah {quran.surah}, Ayāh {quran.startAyah}
          {quran.endAyah > quran.startAyah ? `-${quran.endAyah}` : ''}
        </>
      )}

      {sourceType === 'hadith' && hadith && (
        <>{hadith.author} #{hadith.number} ({hadith.authenticity})</>
      )}

      {sourceType === 'other' && other && (
        <>Other message</>
      )}
    </div>
  );
}
