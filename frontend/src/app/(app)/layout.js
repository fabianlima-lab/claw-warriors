'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import { AppNav } from '@/components/Nav';

function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    const token = localStorage.getItem('cw_token');
    if (!token) {
      router.push('/login');
    } else {
      setChecked(true);
    }
  }, [loading, router]);

  if (loading || !checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-guardian border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AppNav userEmail={user?.email} />
      <div className="pt-16">{children}</div>
    </>
  );
}

export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
