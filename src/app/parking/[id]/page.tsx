import { Suspense } from 'react';
import { Spinner } from '@/components/ui';
import ParkingDetailClient from '@/components/parking/ParkingDetailClient';

export const dynamic = 'force-dynamic';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function ParkingDetailPage({ params }: Readonly<PageParams>) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Suspense
        fallback={
          <main className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </main>
        }
      >
        <ParkingDetailClient params={params} />
      </Suspense>
    </div>
  );
}
