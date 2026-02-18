'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useI18n } from '@/i18n';
import { apiCall } from '@/lib/api';
import { Card, Button, Input, Select, Alert, Spinner } from '@/components/ui';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { FadeIn } from '@/components/animations';

const amenityKeys = [
  'covered', 'evCharging', 'security247', 'cctv', 'fenced', 'lit', 'accessible', 'carWash', 'valetParking',
] as const;

const shuttleModes = ['scheduled', 'on_demand', 'hybrid'] as const;

export default function EditListingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'CH',
    airportCode: 'ZRH',
    latitude: 0,
    longitude: 0,
    capacityTotal: '',
    basePricePerDay: '',
    shuttleMode: 'scheduled' as typeof shuttleModes[number],
    description: '',
    distanceToAirportMin: '',
    checkInInstructions: '',
    cancellationPolicy: 'moderate',
    amenities: Object.fromEntries(amenityKeys.map((k) => [k, false])) as Record<string, boolean>,
    shuttleHours: { start: '04:00', end: '23:00' },
    status: 'active',
    images: [] as string[],
  });

  useEffect(() => {
    loadListing();
  }, [listingId]);

  async function loadListing() {
    setLoading(true);
    const res = await apiCall<Record<string, unknown>>('GET', `/listings/my/${listingId}`);
    if (res.success && res.data) {
      const d = res.data;
      setForm({
        name: (d.name as string) || '',
        address: (d.address as string) || '',
        city: (d.city as string) || '',
        postalCode: (d.postal_code as string) || '',
        country: (d.country as string) || 'CH',
        airportCode: (d.airport_code as string) || 'ZRH',
        latitude: (d.latitude as number) || 0,
        longitude: (d.longitude as number) || 0,
        capacityTotal: String(d.capacity_total || ''),
        basePricePerDay: String(d.base_price_per_day || ''),
        shuttleMode: (d.shuttle_mode as typeof shuttleModes[number]) || 'scheduled',
        description: (d.description as string) || '',
        distanceToAirportMin: String(d.distance_to_airport_min || ''),
        checkInInstructions: (d.check_in_instructions as string) || '',
        cancellationPolicy: (d.cancellation_policy as string) || 'moderate',
        amenities: (d.amenities as Record<string, boolean>) || Object.fromEntries(amenityKeys.map((k) => [k, false])),
        shuttleHours: (d.shuttle_hours as { start: string; end: string }) || { start: '04:00', end: '23:00' },
        status: (d.status as string) || 'active',
        images: Array.isArray(d.images) ? d.images as string[] : (typeof d.images === 'string' ? JSON.parse(d.images || '[]') : []),
      });
    }
    setLoading(false);
  }

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (key: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [key]: !prev.amenities[key] },
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      name: form.name,
      address: form.address,
      city: form.city,
      postalCode: form.postalCode,
      country: form.country,
      latitude: form.latitude,
      longitude: form.longitude,
      capacityTotal: parseInt(form.capacityTotal) || 0,
      basePricePerDay: parseFloat(form.basePricePerDay) || 0,
      shuttleMode: form.shuttleMode,
      description: form.description,
      distanceToAirportMin: parseInt(form.distanceToAirportMin) || 0,
      checkInInstructions: form.checkInInstructions,
      cancellationPolicy: form.cancellationPolicy,
      amenities: form.amenities,
      shuttleHours: form.shuttleHours,
      images: form.images,
    };

    const res = await apiCall('PATCH', `/listings/${listingId}`, payload);
    if (res.success) {
      setSuccess(t('host.listingSaved'));
    } else {
      setError(res.error?.message || t('common.error'));
    }
    setSaving(false);
  }

  const amenityLabels: Record<string, string> = {
    covered: t('listing.amenity.covered'),
    evCharging: t('listing.amenity.evCharging'),
    security247: t('listing.amenity.security'),
    cctv: t('listing.amenity.cctv'),
    fenced: t('listing.amenity.fenced'),
    lit: t('listing.amenity.lit'),
    accessible: t('listing.amenity.accessible'),
    carWash: t('listing.amenity.carWash'),
    valetParking: t('listing.amenity.valetParking'),
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('host.editListing')}</h1>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
            form.status === 'active' ? 'bg-success-50 text-success-700' :
            form.status === 'pending_review' ? 'bg-warning-50 text-warning-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {form.status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('host.basicInfo')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label={t('host.listingName')}
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label={t('host.address')}
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                required
              />
            </div>
            <Input
              label={t('host.city')}
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              required
            />
            <Input
              label={t('host.postalCode')}
              value={form.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
              required
            />
            <Input
              label={t('host.latitude')}
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => updateField('latitude', parseFloat(e.target.value))}
            />
            <Input
              label={t('host.longitude')}
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => updateField('longitude', parseFloat(e.target.value))}
            />
          </div>
        </Card>

        {/* Capacity & Pricing */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('host.capacityPricing')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('host.totalCapacity')}
              type="number"
              value={form.capacityTotal}
              onChange={(e) => updateField('capacityTotal', e.target.value)}
              required
            />
            <Input
              label={t('host.pricePerDay')}
              type="number"
              step="0.01"
              value={form.basePricePerDay}
              onChange={(e) => updateField('basePricePerDay', e.target.value)}
              required
            />
            <Input
              label={t('host.distanceToAirport')}
              type="number"
              value={form.distanceToAirportMin}
              onChange={(e) => updateField('distanceToAirportMin', e.target.value)}
            />
            <Select
              label={t('host.cancellationPolicy')}
              value={form.cancellationPolicy}
              onChange={(val) => updateField('cancellationPolicy', val)}
              options={[
                { value: 'flexible', label: t('host.policyFlexible') },
                { value: 'moderate', label: t('host.policyModerate') },
                { value: 'strict', label: t('host.policyStrict') },
              ]}
            />
          </div>
        </Card>

        {/* Shuttle Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('host.shuttleSettings')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label={t('host.shuttleMode')}
              value={form.shuttleMode}
              onChange={(val) => updateField('shuttleMode', val)}
              options={shuttleModes.map((m) => ({ value: m, label: t(`host.shuttle.${m}`) }))}
            />
            <Input
              label={t('host.shuttleStart')}
              type="time"
              value={form.shuttleHours.start}
              onChange={(e) => setForm((prev) => ({ ...prev, shuttleHours: { ...prev.shuttleHours, start: e.target.value } }))}
            />
            <Input
              label={t('host.shuttleEnd')}
              type="time"
              value={form.shuttleHours.end}
              onChange={(e) => setForm((prev) => ({ ...prev, shuttleHours: { ...prev.shuttleHours, end: e.target.value } }))}
            />
          </div>
        </Card>

        {/* Amenities */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('host.amenities')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {amenityKeys.map((key) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  form.amenities[key]
                    ? 'border-baby-blue-300 bg-baby-blue-50 text-baby-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.amenities[key]}
                  onChange={() => toggleAmenity(key)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  form.amenities[key]
                    ? 'bg-baby-blue-500 border-baby-blue-500'
                    : 'border-gray-300'
                }`}>
                  {form.amenities[key] && (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{amenityLabels[key]}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Description */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('host.descriptionSection')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('host.description')}</label>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-baby-blue-500 focus:border-transparent resize-none"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('host.checkInInstructions')}</label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-baby-blue-500 focus:border-transparent resize-none"
                value={form.checkInInstructions}
                onChange={(e) => updateField('checkInInstructions', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Images */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('host.images')}</h2>
          <ImageUpload
            images={form.images}
            onChange={(images) => setForm((prev) => ({ ...prev, images }))}
            maxImages={8}
            label={t('host.uploadImages')}
          />
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.push('/host/listings')}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saving}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </FadeIn>
  );
}
