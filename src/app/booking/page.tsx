import { Suspense } from 'react';
import { Spinner } from '@/components/ui';
import BookingPageClient from '@/components/booking/BookingPageClient';

export const dynamic = 'force-dynamic';

export default function BookingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Suspense
        fallback={
          <main className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </main>
        }
      >
        <BookingPageClient />
      </Suspense>
    </div>
  );
}
