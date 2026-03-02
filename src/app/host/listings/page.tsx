'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Spinner } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface Listing {
  id: string;
  name: string;
  address: string;
  city: string;
  status: 'active' | 'inactive' | 'pending_review' | 'rejected';
  capacity_total: number;
  capacity_available: number;
  base_price_per_day: number;
  created_at: string;
  images?: string[];
}

export default function HostListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadListings = useCallback(async () => {
    setLoading(true);
    const res = await apiCall<{ listings: Listing[] }>('GET', '/listings/my');
    if (res.success && res.data) {
      setListings(res.data.listings || (res.data as unknown as Listing[]));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  async function handleDelete(id: string) {
    if (!confirm('Sind Sie sicher, dass Sie diesen Parkplatz löschen möchten?')) return;
    const res = await apiCall('DELETE', `/listings/${id}`);
    if (res.success) {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
  }

  const statusConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'gray' | 'primary'; label: string }> = {
    active: { variant: 'success', label: 'Aktiv' },
    inactive: { variant: 'gray', label: 'Inaktiv' },
    pending_review: { variant: 'warning', label: 'Ausstehend' },
    rejected: { variant: 'error', label: 'Abgelehnt' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Meine Parkplätze</h1>
          <Link href="/host/listings/create">
            <Button 
            leftIcon={
               <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            >
              Neuer Parkplatz
            </Button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <Card className="p-12 text-center">
            <svg className="h-16 w-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Parkplätze</h3>
            <p className="text-gray-500 mb-6">Erstellen Sie Ihren ersten Parkplatz, um Buchungen zu erhalten.</p>
            <Link href="/host/listings/create" className="cursor-pointer">
              <Button>Ersten Parkplatz erstellen</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {listings.map((listing) => {
              const statusCfg = statusConfig[listing.status] || { variant: 'gray' as const, label: listing.status };
              return (
                <Card key={listing.id} className="p-5 hover:shadow-medium transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Image */}
                    <div className="w-full sm:w-24 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                      {listing.images?.[0] ? (
                        <img src={listing.images[0]} alt={listing.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">{listing.name}</h3>
                          <p className="text-sm text-gray-500 truncate">{listing.address}, {listing.city}</p>
                        </div>
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {listing.capacity_available}/{listing.capacity_total} Plätze
                        </span>
                        <span className="font-medium text-gray-900">
                          CHF {Number(listing.base_price_per_day || 0).toFixed(2)}/Tag
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <Link href={`/host/listings/${listing.id}`}>
                        <Button variant="secondary" size="sm">Bearbeiten</Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(listing.id)}
                        className="text-error-600 hover:bg-error-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
