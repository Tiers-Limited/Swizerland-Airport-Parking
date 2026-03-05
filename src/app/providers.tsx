'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { applyGoogleTranslatePatch } from '@/lib/google-translate-patch';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyGoogleTranslatePatch();
  }, []);

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
