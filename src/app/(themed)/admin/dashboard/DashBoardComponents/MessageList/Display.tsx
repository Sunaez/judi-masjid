// src/app/(themed)/admin/dashboard/DashBoardComponents/MessageList/Display.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { MessageSquare } from 'lucide-react';
import type { MessageRecord } from './index';
import { IoEllipsisHorizontal, IoTrash, IoStar } from 'react-icons/io5';
import type { ConditionData, AnimationType } from '../AddMessage/types';

type FilterOption = 'all' | 'normal' | 'time' | 'prayer' | 'weather' | 'day';

interface DisplayProps {
  messages: MessageRecord[];
  loading: boolean;
  error: string | null;
  onDeleteClick: (id: string) => void;
  onAddAnimation: (msg: MessageRecord) => void;
}

export default function Display({
  messages,
  loading,
  error,
  onDeleteClick,
  onAddAnimation,
}: DisplayProps) {
  // Tracks which filter tab is selected
  const [filter, setFilter] = useState<FilterOption>('all');
  // Tracks which card's "Show more" menu is open (by message ID)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // Ref to the currently open menu container (button + dropdown)
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  // Refs for animation text elements - keyed by message ID
  const textRefsMap = useRef<Map<string, { arabic: HTMLElement | null; english: HTMLElement | null }>>(new Map());

  // Compute counts for each filter
  const counts = useMemo(() => {
    const result: Record<FilterOption, number> = {
      all: messages.length,
      normal: 0,
      time: 0,
      prayer: 0,
      weather: 0,
      day: 0,
    };

    messages.forEach((msg) => {
      const seenTypes = new Set<string>();
      msg.conditionsData.forEach((c) => {
        if (!seenTypes.has(c.type)) {
          seenTypes.add(c.type);
          if (c.type in result) {
            result[c.type as FilterOption]++;
          }
        }
      });
    });

    return result;
  }, [messages]);

  // Filtered list of messages based on selected tab
  const filteredMessages = useMemo(() => {
    if (filter === 'all') {
      return messages;
    }
    return messages.filter((msg) =>
      msg.conditionsData.some((c: ConditionData) => c.type === filter)
    );
  }, [messages, filter]);

  // Animate cards in whenever 'filteredMessages' array changes
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll<HTMLElement>('.message-card');
    if (!cards.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tween = gsap.fromTo(
      cards,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.2,
        duration: 0.25,
        ease: 'ease.inOut',
      }
    );
    return () => { tween.kill(); };
  }, [filteredMessages]);

  // Animation helper - applies animation to an element
  const applyAnimation = useCallback((
    el: HTMLElement | null,
    animation: AnimationType,
    duration: number,
    content: string,
    isArabic: boolean
  ) => {
    if (!el || !content) return;

    // Kill any existing animations
    gsap.killTweensOf(el);
    gsap.killTweensOf(el.querySelectorAll('.anim-char'));

    // Reset element
    el.style.opacity = '1';
    el.style.transform = '';
    el.textContent = content;

    const durationSec = duration / 1000;

    if (animation === 'word-appear') {
      el.textContent = '';
      if (isArabic) {
        const words = content.trim().split(/\s+/);
        words.forEach((word, i) => {
          const span = document.createElement('span');
          span.textContent = word;
          span.className = 'anim-char';
          span.style.display = 'inline-block';
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
            span.className = 'anim-char';
            span.style.display = 'inline-block';
            el.appendChild(span);
          }
        });
      }

      const targets = el.querySelectorAll<HTMLElement>('.anim-char');
      const numTargets = targets.length;

      if (numTargets === 0) return;

      let elementDuration: number;
      let stagger: number;

      if (numTargets === 1) {
        elementDuration = durationSec;
        stagger = 0;
      } else {
        elementDuration = Math.max(durationSec * 0.2, 0.05);
        stagger = (durationSec - elementDuration) / (numTargets - 1);
        if (stagger <= 0) {
          stagger = durationSec / numTargets;
          elementDuration = stagger;
        }
      }

      gsap.fromTo(
        targets,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, ease: 'power3.out', duration: elementDuration, stagger }
      );
    } else {
      const fromVars: gsap.TweenVars = { opacity: 0 };
      const toVars: gsap.TweenVars = { opacity: 1, duration: durationSec, ease: 'power3.out' };

      switch (animation) {
        case 'slide':
          fromVars.x = isArabic ? 30 : -30;
          toVars.x = 0;
          break;
        case 'bounce':
          fromVars.scale = 0.5;
          toVars.scale = 1;
          toVars.ease = 'bounce.out';
          break;
        case 'zoom':
          fromVars.scale = 0.7;
          toVars.scale = 1;
          break;
        case 'fade':
        default:
          break;
      }

      gsap.fromTo(el, fromVars, toVars);
    }
  }, []);

  // Play animations for all messages that have them
  const playAllAnimations = useCallback(() => {
    filteredMessages.forEach((msg) => {
      const animations = msg.data.animations;
      if (!animations) return;

      const refs = textRefsMap.current.get(msg.id);
      if (!refs) return;

      // Determine keys based on source type
      const arabicKey = msg.data.sourceType === 'quran' ? 'quranArabic'
        : msg.data.sourceType === 'hadith' ? 'hadithArabic'
        : 'otherArabic';
      const englishKey = msg.data.sourceType === 'quran' ? 'quranEnglish'
        : msg.data.sourceType === 'hadith' ? 'hadithEnglish'
        : 'otherEnglish';

      // Get content
      const arabicContent = msg.data.sourceType === 'quran' ? msg.data.quran?.arabicText
        : msg.data.sourceType === 'hadith' ? msg.data.hadith?.arabicText
        : msg.data.other?.arabicText;
      const englishContent = msg.data.sourceType === 'quran' ? msg.data.quran?.englishText
        : msg.data.sourceType === 'hadith' ? msg.data.hadith?.englishText
        : msg.data.other?.englishText;

      // Apply animations if configured
      const arabicAnim = animations[arabicKey];
      if (arabicAnim?.enabled && arabicContent && refs.arabic) {
        applyAnimation(refs.arabic, arabicAnim.animation, arabicAnim.duration, arabicContent, true);
      }

      const englishAnim = animations[englishKey];
      if (englishAnim?.enabled && englishContent && refs.english) {
        applyAnimation(refs.english, englishAnim.animation, englishAnim.duration, englishContent, false);
      }
    });
  }, [filteredMessages, applyAnimation]);

  // Set up interval to play animations every 5 seconds
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Initial play after a short delay
    const initialTimeout = setTimeout(playAllAnimations, 500);

    // Set up interval
    const interval = setInterval(playAllAnimations, 5000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [playAllAnimations]);

  // Handle click-away to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        openMenuId &&
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    }

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      menuContainerRef.current = null;
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // Helper to set refs for a message
  const setTextRef = (msgId: string, type: 'arabic' | 'english', el: HTMLElement | null) => {
    if (!textRefsMap.current.has(msgId)) {
      textRefsMap.current.set(msgId, { arabic: null, english: null });
    }
    const refs = textRefsMap.current.get(msgId)!;
    refs[type] = el;
  };

  // Check if message has any animations
  const hasAnimations = (msg: MessageRecord): boolean => {
    const animations = msg.data.animations;
    if (!animations) return false;
    return Object.values(animations).some(a => a.enabled);
  };

  if (loading) {
    return <p className="text-[var(--text-color)]">Loading messages…</p>;
  }
  if (error) {
    return <p role="alert" className="admin-empty text-[var(--admin-danger)]">Unable to load messages: {error}</p>;
  }
  if (!messages.length) {
    return <div className="admin-empty"><MessageSquare size={32} aria-hidden="true" /><strong>No messages yet</strong><p>Add your first announcement, verse, or reminder using Add message.</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* Filter bar with counts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'normal', 'time', 'prayer', 'weather', 'day'] as FilterOption[]).map(
          (opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              aria-pressed={filter === opt}
              className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${
                  filter === opt
                    ? 'bg-[var(--accent-color)] text-[var(--x-text-color)]'
                    : 'bg-[var(--background-end)] text-[var(--text-color)] hover:bg-[var(--secondary-color)]'
                }
                transition-colors duration-200
              `}
            >
              {opt === 'all'
                ? `All (${counts.all})`
                : `${opt.charAt(0).toUpperCase() + opt.slice(1)} (${counts[opt]})`}
            </button>
          )
        )}
      </div>

      {filteredMessages.length === 0 ? (
        <p className="text-[var(--text-color)]">No messages match this filter.</p>
      ) : (
        <div ref={containerRef} className="space-y-6">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className="message-card
                grid grid-cols-1 lg:grid-cols-4
                bg-[var(--background-end)]
                border border-[var(--secondary-color)]
                rounded-2xl shadow-lg

              "
            >
              {/* Content (75%) */}
              <div className="min-w-0 lg:col-span-3 p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-[var(--accent-color)]">
                      Message #{msg.id.slice(-6)}
                    </h3>
                    {hasAnimations(msg) && (
                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                        Animated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-[var(--text-muted)]">
                      {msg.createdAt.toDate().toLocaleString()}
                    </span>

                    {/* Show-more (three dots) container */}
                    <div
                      className="relative"
                      onKeyDown={event => {
                        if (event.key === 'Escape') {
                          setOpenMenuId(null);
                          event.currentTarget.querySelector('button')?.focus();
                        }
                      }}
                      ref={(el) => {
                        if (openMenuId === msg.id) {
                          menuContainerRef.current = el;
                        }
                      }}
                    >
                      <button
                        onClick={() =>
                          setOpenMenuId((prev) => (prev === msg.id ? null : msg.id))
                        }
                        className="text-[var(--text-color)] hover:text-[var(--yellow)] transition-colors duration-200"
                        aria-label={`Actions for message ${msg.id.slice(-6)}`}
                        aria-expanded={openMenuId === msg.id}

                      >
                        <IoEllipsisHorizontal size={20} />
                      </button>

                      {/* Dropdown menu */}
                      {openMenuId === msg.id && (
                        <div
                          className="
                            absolute right-0 top-full
                            mt-2 w-44
                            bg-[var(--background-end)]
                            border border-[var(--secondary-color)]
                            rounded-lg shadow-lg z-10
                          "
                        >
                          <button
                            onClick={() => {
                              onAddAnimation(msg);
                              setOpenMenuId(null);
                            }}
                            className="
                              flex items-center
                              w-full text-left
                              px-4 py-2
                              text-[var(--text-color)]
                              hover:bg-[var(--secondary-color)]
                              transition-colors duration-150
                            "
                          >
                            <IoStar className="inline-block mr-2 align-middle" />
                            <span>
                              {hasAnimations(msg) ? 'Edit Animation' : 'Add Animation'}
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              onDeleteClick(msg.id);
                              setOpenMenuId(null);
                            }}
                            className="
                              flex items-center
                              w-full text-left
                              px-4 py-2
                              text-[var(--text-color)]
                              hover:bg-red-100
                              transition-colors duration-150
                            "
                          >
                            <IoTrash className="inline-block mr-2 align-middle text-red-600" />
                            <span>Delete Message</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className="
                    inline-block px-3 py-1
                    bg-[var(--accent-color)] text-[var(--x-text-color)]
                    rounded-full text-sm font-medium
                  "
                >
                  {msg.data.sourceType.toUpperCase()}
                </span>

                {msg.data.sourceType === 'quran' && msg.data.quran && (
                  <div className="space-y-2">
                    <p className="text-[var(--text-color)]">
                      <strong>Surah:</strong> {msg.data.quran.surah}
                    </p>
                    <p className="text-[var(--text-color)]">
                      <strong>Ayahs:</strong> {msg.data.quran.startAyah}–{msg.data.quran.endAyah}
                    </p>
                    <p
                      ref={(el) => setTextRef(msg.id, 'arabic', el)}
                      className="font-arabic text-right text-lg leading-relaxed"
                    >
                      {msg.data.quran.arabicText}
                    </p>
                    <p
                      ref={(el) => setTextRef(msg.id, 'english', el)}
                      className="text-[var(--text-color)] italic"
                    >
                      {msg.data.quran.englishText}
                    </p>
                  </div>
                )}

                {msg.data.sourceType === 'hadith' && msg.data.hadith && (
                  <div className="space-y-2">
                    <p className="text-[var(--text-color)]">
                      <strong>Author:</strong> {msg.data.hadith.author}
                    </p>
                    <p className="text-[var(--text-color)]">
                      <strong>Number:</strong> {msg.data.hadith.number}
                    </p>
                    <p className="text-[var(--text-color)]">
                      <strong>Authenticity:</strong> {msg.data.hadith.authenticity}
                    </p>
                    <p
                      ref={(el) => setTextRef(msg.id, 'arabic', el)}
                      className="font-arabic text-right text-lg leading-relaxed"
                    >
                      {msg.data.hadith.arabicText}
                    </p>
                    <p
                      ref={(el) => setTextRef(msg.id, 'english', el)}
                      className="text-[var(--text-color)] italic"
                    >
                      {msg.data.hadith.englishText}
                    </p>
                  </div>
                )}

                {msg.data.sourceType === 'other' && msg.data.other && (
                  <div className="space-y-2">
                    <p
                      ref={(el) => setTextRef(msg.id, 'english', el)}
                      className="text-[var(--text-color)] italic"
                    >
                      {msg.data.other.englishText}
                    </p>
                    {msg.data.other.arabicText && (
                      <p
                        ref={(el) => setTextRef(msg.id, 'arabic', el)}
                        className="font-arabic text-right text-lg leading-relaxed"
                      >
                        {msg.data.other.arabicText}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Conditions (25%) */}
              <div className="min-w-0 bg-[var(--surface-soft)] p-5 sm:p-6 border-t lg:border-t-0 lg:border-l border-[var(--border-color)] rounded-b-2xl lg:rounded-bl-none lg:rounded-r-2xl">
                <h4 className="text-lg font-semibold text-[var(--text-color)] mb-4">
                  Conditions ({msg.conditionsData.length})
                </h4>
                <div className="space-y-4 overflow-y-auto max-h-[300px]">
                  {msg.conditionsData.map((c, i) => (
                    <div
                      key={i}
                      className="
                        bg-[var(--background-end)]
                        border border-[var(--secondary-color)]
                        rounded-lg p-3
                      "
                    >
                      <span
                        className="
                          inline-block px-2 py-0.5
                          bg-[var(--accent-color)]
                          text-[var(--x-text-color)]
                          text-xs font-semibold rounded
                        "
                      >
                        {c.type.toUpperCase()}
                      </span>
                      <div className="mt-2 text-[var(--text-color)] text-sm space-y-1">
                        {c.type === 'normal' && <p>Always active</p>}
                        {c.type === 'time' &&
                          c.entries.map((e, j) => (
                            <p key={j}>
                              {e.from} – {e.to}
                            </p>
                          ))}
                        {c.type === 'prayer' &&
                          c.entries.map((e, j) => (
                            <p key={j}>
                              {e.when} {e.name} ({e.duration} min)
                            </p>
                          ))}
                        {c.type === 'weather' &&
                          c.entries.map((e, j) => <p key={j}>{e.weather}</p>)}
                        {c.type === 'day' &&
                          c.entries.map((d, j) => <p key={j}>{d}</p>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
