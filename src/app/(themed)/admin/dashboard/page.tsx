// src/app/(themed)/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import ClientDashboard from './ClientDashboard';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (!user) {
        router.replace('/admin');
      } else {
        setLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Checking authentication…</p>
      </div>
    );
  }

  return <ClientDashboard />;
}
