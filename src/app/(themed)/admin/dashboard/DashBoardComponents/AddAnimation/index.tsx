// src/app/(themed)/admin/dashboard/DashBoardComponents/AddAnimation/index.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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

// Duration options in ms (50ms increments from 100ms to 2000ms)
const DURATION_OPTIONS = Array.from({ length: 39 }, (_, i) => 100 + i * 50);
const DEFAULT_DURATION_MS = 300;

export default function AddAnimationWrapper({
  message,
  onClose,
  setClosing,
  onSuccess,
  onError,
}: AddAnimationWrapperProps) {
  const [isClosing, setIsClosingLocal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get text content based on source type
  const sourceType = message.data.sourceType;
  const englishText = sourceType === 'quran'
    ? message.data.quran?.englishText
    : sourceType === 'hadith'
    ? message.data.hadith?.englishText
    : message.data.other?.englishText;
  const arabicText = sourceType === 'quran'
    ? message.data.quran?.arabicText
    : sourceType === 'hadith'
    ? message.data.hadith?.arabicText
    : message.data.other?.arabicText;

  // Keys for animation config
  const englishKey = sourceType === 'quran' ? 'quranEnglish'
    : sourceType === 'hadith' ? 'hadithEnglish'
    : 'otherEnglish';
  const arabicKey = sourceType === 'quran' ? 'quranArabic'
    : sourceType === 'hadith' ? 'hadithArabic'
    : 'otherArabic';

  // Initialize config from existing animations or defaults
  const getInitialConfig = (key: string) => {
    const existing = message.data.animations?.[key];
    if (existing) {
      return {
        enabled: existing.enabled,
        animation: existing.animation,
        duration: existing.duration,
      };
    }
    return { enabled: false, animation: 'fade' as AnimationType, duration: DEFAULT_DURATION_MS };
  };

  const [englishConfig, setEnglishConfig] = useState(getInitialConfig(englishKey));
  const [arabicConfig, setArabicConfig] = useState(getInitialConfig(arabicKey));

  // Refs for preview elements
  const englishPreviewRef = useRef<HTMLDivElement>(null);
  const arabicPreviewRef = useRef<HTMLDivElement>(null);

  // Clear preview animations
  const clearPreview = useCallback(() => {
    [
      { ref: englishPreviewRef, config: englishConfig, content: englishText },
      { ref: arabicPreviewRef, config: arabicConfig, content: arabicText },
    ].forEach(({ ref, config, content }) => {
      const el = ref.current;
      if (el) {
        gsap.killTweensOf(el);
        gsap.killTweensOf(el.querySelectorAll('.char-word'));
        el.style.opacity = '1';
        el.style.transform = '';
        // Reset content if word-appear was used
        if (config.animation === 'word-appear' && content) {
          el.textContent = content;
        }
      }
    });
  }, [englishConfig, arabicConfig, englishText, arabicText]);

  // Apply animation to a single element
  const animateElement = useCallback((
    el: HTMLElement | null,
    config: { enabled: boolean; animation: AnimationType; duration: number },
    content: string | undefined,
    isArabic: boolean,
    delay: number = 0
  ) => {
    if (!el || !config.enabled || !content) return;

    // Duration in seconds for GSAP
    const durationSec = config.duration / 1000;

    if (config.animation === 'word-appear') {
      el.textContent = '';
      if (isArabic) {
        const words = content.trim().split(/\s+/);
        words.forEach((word, i) => {
          const span = document.createElement('span');
          span.textContent = word;
          span.className = 'char-word';
          el.appendChild(span);
          if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
        });
      } else {
        const chars = content.split('');
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
      const numTargets = targets.length;

      // Calculate stagger so total animation completes within durationSec
      // Total time = elementDuration + stagger * (N - 1)
      // We use 30% of total time for each element's animation
      const elementDuration = Math.min(durationSec * 0.3, durationSec);
      const stagger = numTargets > 1 ? (durationSec - elementDuration) / (numTargets - 1) : 0;

      gsap.fromTo(
        targets,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, ease: 'power3.out', duration: elementDuration, stagger: Math.max(stagger, 0.01), delay }
      );
    } else {
      const fromVars: gsap.TweenVars = { opacity: 0 };
      const toVars: gsap.TweenVars = { opacity: 1, duration: durationSec, ease: 'power3.out', delay };

      switch (config.animation) {
        case 'slide':
          fromVars.x = isArabic ? 50 : -50;
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
        case 'fade':
        default:
          break;
      }

      gsap.fromTo(el, fromVars, toVars);
    }
  }, []);

  // Run preview animation
  const runPreview = useCallback(() => {
    clearPreview();

    // Small delay to let clear take effect
    setTimeout(() => {
      animateElement(englishPreviewRef.current, englishConfig, englishText, false, 0);
      animateElement(arabicPreviewRef.current, arabicConfig, arabicText, true, 0.1);
    }, 50);
  }, [clearPreview, animateElement, englishConfig, arabicConfig, englishText, arabicText]);

  // Auto-play preview every 2 seconds
  useEffect(() => {
    // Initial preview
    const initialTimeout = setTimeout(runPreview, 100);

    // Set up interval
    const interval = setInterval(runPreview, 2000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [runPreview]);

  // Save animations to Firebase
  const handleSave = async () => {
    setSaving(true);
    try {
      const animationData: AnimationData = {};

      if (englishConfig.enabled) {
        animationData[englishKey] = {
          enabled: englishConfig.enabled,
          animation: englishConfig.animation,
          duration: englishConfig.duration,
        };
      }
      if (arabicConfig.enabled) {
        animationData[arabicKey] = {
          enabled: arabicConfig.enabled,
          animation: arabicConfig.animation,
          duration: arabicConfig.duration,
        };
      }

      const messageRef = doc(db, 'messages', message.id);
      await updateDoc(messageRef, { animations: animationData });

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

  // Render animation config column
  const renderConfigColumn = (
    label: string,
    config: { enabled: boolean; animation: AnimationType; duration: number },
    setConfig: React.Dispatch<React.SetStateAction<{ enabled: boolean; animation: AnimationType; duration: number }>>,
    hasContent: boolean
  ) => (
    <div className="flex-1 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-[var(--text-color)]">{label}</h4>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.enabled}
            disabled={!hasContent}
            onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
            className="form-checkbox h-5 w-5 text-green-500"
          />
          <span className="text-sm text-[var(--text-color)]">Enable</span>
        </label>
      </div>

      {!hasContent ? (
        <p className="text-sm text-[var(--secondary-color)] italic">No content available</p>
      ) : (
        <div className={`space-y-3 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <label className="block text-sm text-[var(--text-color)] mb-1">Animation Type</label>
            <select
              value={config.animation}
              onChange={(e) => setConfig((prev) => ({ ...prev, animation: e.target.value as AnimationType }))}
              className="w-full px-3 py-2 border rounded bg-[var(--background-start)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
              <option value="bounce">Bounce</option>
              <option value="zoom">Zoom</option>
              <option value="word-appear">Word Appear</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-color)] mb-1">
              Duration: <span className="font-semibold">{config.duration}ms</span>
            </label>
            <select
              value={config.duration}
              onChange={(e) => setConfig((prev) => ({ ...prev, duration: parseInt(e.target.value, 10) }))}
              className="w-full px-3 py-2 border rounded bg-[var(--background-start)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {DURATION_OPTIONS.map((ms) => (
                <option key={ms} value={ms}>
                  {ms}ms {ms === DEFAULT_DURATION_MS ? '(default)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="p-4 space-y-6 relative"
      style={{ opacity: isClosing ? 0 : 1, transition: 'opacity 0.5s ease' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
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

      {/* Two-column configuration */}
      <div className="grid grid-cols-2 gap-8">
        {/* English (Left) */}
        {renderConfigColumn('English Text', englishConfig, setEnglishConfig, !!englishText)}

        {/* Arabic (Right) */}
        {renderConfigColumn('Arabic Text', arabicConfig, setArabicConfig, !!arabicText)}
      </div>

      {/* Preview Section - Always Visible */}
      <div className="border border-[var(--secondary-color)] rounded-lg p-4 bg-[var(--background-start)]">
        <h4 className="text-lg font-medium text-[var(--text-color)] mb-3">
          Live Preview <span className="text-sm font-normal text-[var(--secondary-color)]">(plays every 2s)</span>
        </h4>
        <div className="grid grid-cols-2 gap-8">
          {/* English Preview */}
          <div className="min-h-[100px] p-3 border rounded bg-[var(--background-end)] overflow-hidden">
            <div
              ref={englishPreviewRef}
              className="text-[var(--text-color)] text-base leading-relaxed"
            >
              {englishText || <span className="italic text-[var(--secondary-color)]">No English text</span>}
            </div>
          </div>

          {/* Arabic Preview */}
          <div className="min-h-[100px] p-3 border rounded bg-[var(--background-end)] overflow-hidden">
            <div
              ref={arabicPreviewRef}
              className="text-[var(--text-color)] text-base leading-relaxed text-right font-arabic"
              dir="rtl"
            >
              {arabicText || <span className="italic text-[var(--secondary-color)]">No Arabic text</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => {
            setClosing(true);
            setIsClosingLocal(true);
            setTimeout(onClose, 300);
          }}
          className="px-4 py-2 border border-[var(--secondary-color)] text-[var(--text-color)] rounded hover:bg-[var(--secondary-color)] transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Animation'}
        </button>
      </div>

      <style jsx>{`
        .char-word {
          display: inline-block;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}
