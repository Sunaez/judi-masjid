'use client';
import React from 'react';

export default function Hadith() {
  return (
    <div className="rotating-content hadith">
      <div className="verse-container">
        <div className="verse">
          مَنْ يَهْدِهِ اللَّهُ فَلاَ مُضِلَّ لَهُ وَمَنْ يُضْلِلْهُ فَلاَ هَادِيَ لَهُ إِنَّ أَصْدَقَ
        </div>
        <div className="translation-container">
          <div className="translation">
            Whoever Allah guides, there is no one to lead him astray, and whoever He leads astray, there is no one to guide him.
          </div>
        </div>
      </div>
      <div className="wrapper">
        <div className="jummah">Sunan an-Nasa'i 1578</div>
      </div>
    </div>
  );
}
