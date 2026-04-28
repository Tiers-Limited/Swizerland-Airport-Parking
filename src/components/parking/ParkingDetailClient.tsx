'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Header, Footer } from '@/components/layout';
import { Card, Button, Spinner } from '@/components/ui';
import Link from 'next/link';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function ParkingDetailClient({ params }: PageParams) {
  const searchParams = useSearchParams();
  const [parkingId, setParkingId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setParkingId(resolvedParams.id);
      setLoading(false);
    };
    getParams();
  }, [params]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card padding="md" className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Parkplatz Details
            </h1>
            <p className="text-gray-500 mb-4">
              Parkplatz ID: {parkingId}
            </p>
            <p className="text-gray-500 mb-4">
              Diese Seite wird noch entwickelt.
            </p>
            <Link href="/zurich">
              <Button>Alle Parkplätze durchsuchen</Button>
            </Link>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}