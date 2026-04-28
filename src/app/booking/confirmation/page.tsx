import { Suspense } from 'react';
import { Spinner } from '@/components/ui';
import { Header, Footer } from '@/components/layout';
import BookingConfirmationContent from '../../../components/booking/BookingConfirmationContent';

export const dynamic = 'force-dynamic';

export default function BookingConfirmationPage () {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <Suspense
        fallback={
          <main className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </main>
        }
      >
        <BookingConfirmationContent />
      </Suspense>
      <Footer />
    </div>
  );
}
