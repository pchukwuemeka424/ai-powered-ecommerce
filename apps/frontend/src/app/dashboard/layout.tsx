'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useAuthStore } from '@/stores/auth';
import { Spinner } from '@/components/ui';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading, loadUser } = useAuthStore();
  const router = useRouter();
  const [persistReady, setPersistReady] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setPersistReady(true));
    if (useAuthStore.persist.hasHydrated()) setPersistReady(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!persistReady) return;
    const cookieToken = Cookies.get('auth_token');
    if (cookieToken && !useAuthStore.getState().token) {
      useAuthStore.setState({ token: cookieToken });
    }
    const sessionToken = useAuthStore.getState().token || Cookies.get('auth_token');
    if (!sessionToken) {
      router.replace('/auth/login');
      return;
    }
    if (!user) {
      void loadUser();
    }
  }, [persistReady, token, user, router, loadUser]);

  if (!persistReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  const sessionToken = token || Cookies.get('auth_token');
  if (!sessionToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar />
      <main className="ml-[220px] min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
