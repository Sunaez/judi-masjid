'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { IoSunny, IoMoon } from 'react-icons/io5';

export default function NavBar() {
  // Always call hooks in the same order
  const { theme, systemTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  const current = theme === 'system' ? systemTheme : theme;
  const toggleTheme = () => setTheme(current === 'dark' ? 'light' : 'dark');

  return (
    <nav className="bg-[var(--background-start)] px-6 py-4 border-b border-[var(--accent-color)] flex justify-between items-center">
      {/* Navigation links */}
      <div className="space-x-4">
        <Link
          href="/"
          className="px-4 py-2 rounded bg-[var(--accent-color)] text-[var(--background-end)] hover:opacity-90"
        >
          Home
        </Link>
      </div>
      {/* Theme toggle button */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full"
        aria-label="Toggle theme"
      >
        {current === 'dark' ? (
          <IoSunny size={28} className="text-[var(--yellow)]" />
        ) : (
          <IoMoon size={28} className="text-[var(--accent-color)]" />
        )}
      </button>
    </nav>
  );
}
