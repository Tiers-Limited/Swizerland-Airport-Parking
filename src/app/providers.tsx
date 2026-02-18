'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </I18nProvider>
  );
}
