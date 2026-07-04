'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/ToastProvider';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
