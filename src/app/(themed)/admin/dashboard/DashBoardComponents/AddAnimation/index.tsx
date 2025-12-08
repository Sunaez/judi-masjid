// src/app/(themed)/admin/dashboard/DashBoardComponents/AddAnimation/index.tsx
'use client';

import React, { useState, useRef } from 'react';
import gsap from 'gsap';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { MessageRecord } from '../MessageList/index';
import type { AnimationData, AnimationType } from '../AddMessage/types';
import { IoClose } from 'react-icons/io5';

export type AddAnimationWrapperProps = {
  message: MessageRecord;
  onClose: () => void;
  setClosing: (isNowClosing: boolean) => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
};

type TextEntry = {
  key: string;
  label: string;
  content: string;
};

export default function AddAnimationWrapper({
  message,
  onClose,
  setClosing,
  onSuccess,
  onError,
}: AddAnimationWrapperProps) {
  const [isClosing, setIsClosingLocal] = useState(false);

  // Build list of text entries based on sourceType
  const entries: TextEntry[] = [];
  if (message.data.sourceType === 'quran' && message.data.quran) {
    entries.push(
      {
        key: 'quranEnglish',
        label: 'Quran English Text',
        content: message.data.quran.englishText,
      },
      {
        key: 'quranArabic',
        label: 'Quran Arabic Text',
        content: message.data.quran.arabicText,
      }
    );
  } else if (message.data.sourceType === 'hadith' && message.data.hadith) {
    entries.push(
      {
        key: 'hadithEnglish',
        label: 'Hadith English Text',
        content: message.data.hadith.englishText,
      },
      {
        key: 'hadithArabic',
        label: 'Hadith Arabic Text',
        content: message.data.hadith.arabicText,
      }
    );
  } else if (message.data.sourceType === 'other' && message.data.other) {
    // Only englishText and arabicText exist on "other"
    if (message.data.other.englishText) {
      entries.push({
        key: 'otherEnglish',
        label: 'Other English Text',
        content: message.data.other.englishText,
      });
    }
    if (message.data.other.arabicText) {
      entries.push({
        key: 'otherArabic',
        label: 'Other Arabic Text',
        content: message.data.other.arabicText,
      });
    }
  }

  // State for each entry: enabled, animation type, duration
  // Initialize from existing animations if available
  const [config, setConfig] = useState<
    Record<string, { enabled: boolean; animation: AnimationType; duration: number }>
  >(
    () =>
      entries.reduce((acc, e) => {
        const existingAnim = message.data.animations?.[e.key];
        acc[e.key] = existingAnim
          ? { enabled: existingAnim.enabled, animation: existingAnim.animation, duration: existingAnim.duration }
          : { enabled: false, animation: 'fade', duration: 1 };
        return acc;
      }, {} as Record<string, { enabled: boolean; animation: AnimationType; duration: number }>),
  );

  const [saving, setSaving] = useState(false);

  // Refs for preview elements
  const previewRefs = useRef<Record<string, HTMLElement | null>>(
    entries.reduce((acc, e) => {
      acc[e.key] = null;
      return acc;
    }, {} as Record<string, HTMLElement | null>),
  );

  // Clear previous animations on entries
  const clearPreview = () => {
    entries.forEach((e) => {
      const el = previewRefs.current[e.key];
      if (el) {
        gsap.killTweensOf(el);
        el.style.opacity = '';
        el.style.transform = '';
        // If word-appear was used, unwrap chars/words
        if (config[e.key].animation === 'word-appear') {
          el.textContent = e.content;
        }
      }
    });
  };

  // Save animations to Firebase
  const handleSave = async () => {
    setSaving(true);
    try {
      // Build animation data object with only enabled animations
      const animationData: AnimationData = {};
      entries.forEach((e) => {
        const cfg = config[e.key];
        if (cfg.enabled) {
          animationData[e.key] = {
            enabled: cfg.enabled,
            animation: cfg.animation,
            duration: cfg.duration,
          };
        }
      });

      // Update the message document in Firestore
      const messageRef = doc(db, 'messages', message.id);
      await updateDoc(messageRef, {
        animations: animationData,
      });

      onSuccess();
      setClosing(true);
      setIsClosingLocal(true);
      setTimeout(onClose, 300);
    } catch (err: any) {
      console.error('Error saving animations:', err);
      onError(err.message || 'Failed to save animations');
    } finally {
      setSaving(false);
    }
  };

  // Trigger preview animations
  const handlePreview = () => {
    clearPreview();

    let timeline = gsap.timeline();

    entries.forEach((e) => {
      const cfg = config[e.key];
      if (!cfg.enabled) return;
      const el = previewRefs.current[e.key];
      if (!el) return;

      if (cfg.animation === 'word-appear') {
        // Word-appear: split into spans
        const text = e.content;
        el.textContent = '';
        const isArabic = /[\u0600-\u06FF]/.test(text);
        if (isArabic) {
          // split into words
          const words = text.trim().split(/\s+/);
          words.forEach((word, i) => {
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'char-word';
            el.appendChild(span);
            if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
          });
        } else {
          // split into chars
          const chars = text.split('');
          chars.forEach((char) => {
            if (char === ' ') {
              el.appendChild(document.createTextNode(' '));
            } else {
              const span = document.createElement('span');
              span.textContent = char;
              span.className = 'char-word';
              el.appendChild(span);
            }
          });
        }
        const targets = el.querySelectorAll<HTMLElement>('.char-word');
        timeline = timeline.fromTo(
          targets,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            ease: 'power3.out',
            duration: cfg.duration,
            stagger: 0.05,
          },
        );
      } else {
        // Standard animations on whole element
        const fromVars: any = { opacity: 0 };
        const toVars: any = { opacity: 1, duration: cfg.duration, ease: 'power3.out' };
        switch (cfg.animation) {
          case 'fade':
            break;
          case 'slide':
            fromVars.x = -50;
            toVars.x = 0;
            break;
          case 'bounce':
            fromVars.scale = 0.3;
            toVars.scale = 1;
            toVars.ease = 'bounce.out';
            break;
          case 'zoom':
            fromVars.scale = 0.5;
            toVars.scale = 1;
            break;
          default:
            break;
        }
        timeline = timeline.fromTo(el, fromVars, toVars);
      }
    });
  };

  return (
    <div
      className="p-4 space-y-6 relative"
      style={{
        opacity: isClosing ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-green-500">Configure Animation</h3>
        <button
          onClick={() => {
            setClosing(true);
            setIsClosingLocal(true);
            setTimeout(onClose, 300);
          }}
          aria-label="Close"
          className="text-[var(--text-color)] hover:text-[var(--yellow)] transition-colors duration-200"
        >
          <IoClose size={24} />
        </button>
      </div>

      {/* List of text entries */}
      <div className="space-y-4">
        {entries.map((e) => {
          const cfg = config[e.key];
          return (
            <div key={e.key} className="border border-[var(--secondary-color)] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={cfg.enabled}
                    onChange={(evt) =>
                      setConfig((prev) => ({
                        ...prev,
                        [e.key]: { ...prev[e.key], enabled: evt.target.checked },
                      }))
                    }
                    className="form-checkbox h-5 w-5 text-green-500"
                  />
                  <span className="text-[var(--text-color)] font-medium">{e.label}</span>
                </label>
              </div>
              {cfg.enabled && (
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="col-span-1">
                    <label className="block text-sm text-[var(--text-color)] mb-1">Animation</label>
                    <select
                      value={cfg.animation}
                      onChange={(evt) =>
                        setConfig((prev) => ({
                          ...prev,
                          [e.key]: {
                            ...prev[e.key],
                            animation: evt.target.value as AnimationType,
                          },
                        }))
                      }
                      className={`
                        w-full px-2 py-1
                        border rounded
                        bg-[var(--background-start)]
                        text-[var(--text-color)]
                        focus:outline-none focus:ring-2 focus:ring-green-300
                      `}
                    >
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                      <option value="bounce">Bounce</option>
                      <option value="zoom">Zoom</option>
                      <option value="word-appear">Word Appear</option>
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm text-[var(--text-color)] mb-1">Duration (s)</label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={cfg.duration}
                      onChange={(evt) =>
                        setConfig((prev) => ({
                          ...prev,
                          [e.key]: {
                            ...prev[e.key],
                            duration: parseFloat(evt.target.value),
                          },
                        }))
                      }
                      className={`
                        w-full px-2 py-1
                        border rounded
                        bg-[var(--background-start)]
                        text-[var(--text-color)]
                        focus:outline-none focus:ring-2 focus:ring-green-300
                      `}
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm text-[var(--text-color)] mb-1">Preview Text</label>
                    <div
                      ref={(el) => {
                        previewRefs.current[e.key] = el;
                      }}
                      className={`
                        p-2 border rounded
                        bg-[var(--background-start)]
                        text-[var(--text-color)]
                        min-h-[2rem]
                        break-words
                      `}
                    >
                      {e.content}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview and Done buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handlePreview}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
        >
          Preview Animation
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Animation'}
        </button>
      </div>

      <style jsx>{`
        /* Word-appear spans */
        .char-word {
          display: inline-block;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}
