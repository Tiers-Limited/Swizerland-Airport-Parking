'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Spinner, Modal } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import { Icon } from '@/components/ui/Icons';

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
  description?: string;
  phone_number?: string;
  airport_code?: string;
  distance_to_airport_min?: number;
  cancellation_policy?: string;
  check_in_instructions?: string;
  amenities?: Record<string, boolean>;
  pricing_tiers?: Array<{ label?: string; start_date?: string; end_date?: string; total_price?: number }>;
}

export default function HostListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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
    const res = await apiCall('DELETE', `/listings/${id}`);
    if (res.success) {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
    setDeleteTarget(null);
  }

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(Number(val || 0));

  const amenityLabels: Record<string, string> = {
    covered: 'Überdacht', evCharging: 'E-Ladestation', security247: '24/7 Sicherheit',
    cctv: 'Videoüberwachung', fenced: 'Eingezäunt', lit: 'Beleuchtet',
    accessible: 'Barrierefrei', carWash: 'Autowaschanlage', valetParking: 'Valet Parking',
  };

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
            <Button leftIcon={<Icon name="Plus" className="h-4 w-4 mr-1.5" />}>
              Neuer Parkplatz
            </Button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <Card className="p-12 text-center">
            <Icon name="Building" className="h-16 w-16 text-gray-200 mx-auto mb-4" />
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
                          <Icon name="Image" className="h-8 w-8" />
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
                          <Icon name="MapPin" className="h-4 w-4" />
                          {listing.capacity_available}/{listing.capacity_total} Plätze
                        </span>
                        <span className="font-medium text-gray-900">
                          CHF {Number(listing.base_price_per_day || 0).toFixed(2)}/Tag
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => setSelectedListing(listing)}>
                        Anzeigen
                      </Button>
                      <Link href={`/host/listings/${listing.id}`}>
                        <Button variant="secondary" size="sm">Bearbeiten</Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(listing.id)}
                        className="text-error-600 hover:bg-error-50"
                      >
                        <Icon name="Trash2" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Listing Detail Modal */}
        <Modal isOpen={!!selectedListing} onClose={() => setSelectedListing(null)} title={selectedListing?.name || 'Parkplatz Details'} size="full">
          {selectedListing && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Images */}
              {selectedListing.images && selectedListing.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedListing.images.map((img, i) => (
                    <img key={i} src={img} alt={`${selectedListing.name} ${i + 1}`} className="h-32 w-48 object-cover rounded-lg flex-shrink-0" />
                  ))}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500" >Adresse</p>
                  <p className="font-medium text-gray-900">{selectedListing.address}, {selectedListing.city}</p>
                </div>
                <div>
                  <p className="text-gray-500" >Status</p>
                  <Badge variant={statusConfig[selectedListing.status]?.variant || 'gray'}>
                    {statusConfig[selectedListing.status]?.label || selectedListing.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500" >Flughafen</p>
                  <p className="font-medium text-gray-900">{selectedListing.airport_code || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500" >Entfernung zum Flughafen</p>
                  <p className="font-medium text-gray-900">{selectedListing.distance_to_airport_min ? `${selectedListing.distance_to_airport_min} Min.` : '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500" >Kapazität</p>
                  <p className="font-medium text-gray-900">{selectedListing.capacity_available}/{selectedListing.capacity_total} Stellplätze</p>
                </div>
                <div>
                  <p className="text-gray-500" >Basispreis / Tag</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedListing.base_price_per_day)}</p>
                </div>
                <div>
                  <p className="text-gray-500" >Stornierungsrichtlinie</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedListing.cancellation_policy || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500" >Telefon</p>
                  <p className="font-medium text-gray-900">{selectedListing.phone_number || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500" >Erstellt am</p>
                  <p className="font-medium text-gray-900">{new Date(selectedListing.created_at).toLocaleDateString('de-CH')}</p>
                </div>
              </div>

              {/* Description */}
              {selectedListing.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1" >Beschreibung</p>
                  <p className="text-sm text-gray-700">{selectedListing.description}</p>
                </div>
              )}

              {/* Check-in Instructions */}
              {selectedListing.check_in_instructions && (
                <div>
                  <p className="text-sm text-gray-500 mb-1" >Check-in Anweisungen</p>
                  <p className="text-sm text-gray-700">{selectedListing.check_in_instructions}</p>
                </div>
              )}

              {/* Amenities */}
              {selectedListing.amenities && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2" >Ausstattung</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedListing.amenities).map(([key, value]) => (
                      <span
                        key={key}
                        
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          value ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400 line-through'
                        }`}
                      >
                        {value ? '✓' : '✗'} {amenityLabels[key] || key}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Tiers */}
              {selectedListing.pricing_tiers && selectedListing.pricing_tiers.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2" >Preiszeiträume</p>
                  <div className="space-y-2">
                    {selectedListing.pricing_tiers.map((tier, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg text-sm">
                        <span className="font-medium text-gray-900">{tier.label || `Zeitraum ${i + 1}`}</span>
                        <span className="text-gray-600">
                          {tier.start_date && tier.end_date && `${new Date(tier.start_date).toLocaleDateString('de-CH')} – ${new Date(tier.end_date).toLocaleDateString('de-CH')}`}
                          {tier.total_price ? ` · ${formatCurrency(tier.total_price)}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setSelectedListing(null)}>Schliessen</Button>
                <Link href={`/host/listings/${selectedListing.id}`}>
                  <Button>Bearbeiten</Button>
                </Link>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Parkplatz löschen" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Sind Sie sicher, dass Sie diesen Parkplatz löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Abbrechen</Button>
              <Button variant="danger" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Löschen</Button>
            </div>
          </div>
        </Modal>
      </div>
    </FadeIn>
  );
}
