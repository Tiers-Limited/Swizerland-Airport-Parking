import { Suspense } from 'react';
import { Spinner } from '@/components/ui';
import ResetPasswordClient from '@/components/auth/ResetPasswordClient';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Suspense
        fallback={
          <main className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </main>
        }
      >
        <ResetPasswordClient />
      </Suspense>
    </div>
  );
}
