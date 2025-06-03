// src/app/(themed)/admin/AdminComponents/LogIn.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import NavBar from './NavBar';

export default function LogIn() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-grow bg-gradient-to-b from-[var(--background-start)] to-[var(--background-end)] flex items-center justify-center px-6">
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--background-end)] border border-[var(--accent-color)] rounded-lg shadow-lg p-8 max-w-md w-full"
        >
          <h2 className="text-3xl font-semibold text-center mb-6 text-[var(--accent-color)]">
            Admin Login
          </h2>

          {error && (
            <p className="text-red-600 text-lg mb-4">{error}</p>
          )}

          <label htmlFor="email" className="block text-lg font-medium mb-2 text-[var(--text-color)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full text-lg border border-[var(--secondary-color)] rounded-md px-4 py-3 mb-4 bg-transparent placeholder-[var(--secondary-color)] focus:outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-opacity-30"
          />

          <label htmlFor="password" className="block text-lg font-medium mb-2 text-[var(--text-color)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full text-lg border border-[var(--secondary-color)] rounded-md px-4 py-3 mb-6 bg-transparent placeholder-[var(--secondary-color)] focus:outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-opacity-30"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full text-lg font-semibold py-3 rounded-md bg-[var(--accent-color)] text-[var(--background-end)] hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}