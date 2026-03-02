'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { Card, Button, Input, Select, Alert } from '@/components/ui';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { FadeIn } from '@/components/animations';
import type { PricingTier } from '@/types';

const amenityKeys = [
  'covered', 'evCharging', 'security247', 'cctv', 'fenced', 'lit', 'accessible', 'carWash', 'valetParking',
] as const;

export default function CreateListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    city: 'Zürich',
    postalCode: '',
    country: 'CH',
    airportCode: 'ZRH',
    latitude: 47.4647,
    longitude: 8.5492,
    capacityTotal: '',
    basePricePerDay: '',
    description: '',
    distanceToAirportMin: '',
    checkInInstructions: '',
    cancellationPolicy: 'moderate',
    amenities: Object.fromEntries(amenityKeys.map((k) => [k, false])) as Record<string, boolean>,
    images: [] as string[],
    pricingTiers: [] as PricingTier[],
  });

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
    setLoading(true);
    setError('');

    const payload = {
      name: form.name,
      address: form.address,
      phoneNumber: form.phoneNumber || undefined,
      city: form.city,
      postalCode: form.postalCode,
      country: form.country,
      airportCode: form.airportCode,
      latitude: form.latitude,
      longitude: form.longitude,
      capacityTotal: parseInt(form.capacityTotal) || 0,
      basePricePerDay: parseFloat(form.basePricePerDay) || 0,
      description: form.description,
      distanceToAirportMin: parseInt(form.distanceToAirportMin) || 0,
      checkInInstructions: form.checkInInstructions,
      cancellationPolicy: form.cancellationPolicy,
      amenities: form.amenities,
      pricingTiers: form.pricingTiers.length > 0 ? form.pricingTiers : undefined,
      images: form.images,
    };

    const res = await apiCall('POST', '/listings', payload);
    if (res.success) {
      router.push('/host/listings');
    } else {
      setError(res.error?.message || 'Fehler');
    }
    setLoading(false);
  }

  const amenityLabels: Record<string, string> = {
    covered: 'Überdacht',
    evCharging: 'E-Ladestation',
    security247: '24/7 Sicherheit',
    cctv: 'Videoüberwachung',
    fenced: 'Eingezäunt',
    lit: 'Beleuchtet',
    accessible: 'Barrierefrei',
    carWash: 'Autowaschanlage',
    valetParking: 'Valet Parking',
  };

  return (
    <FadeIn>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Parkplatz erstellen</h1>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grundinformationen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Name des Parkplatzes"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="z.B. Sicheres Parken Zürich"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Adresse"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Musterstrasse 123"
                required
              />
            </div>
            <Input
              label="Stadt"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              required
            />
            <Input
              label="Postleitzahl"
              value={form.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
              placeholder="8000"
              required
            />
            <Input
              label="Breitengrad"
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => updateField('latitude', parseFloat(e.target.value))}
            />
            <Input
              label="Längengrad"
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => updateField('longitude', parseFloat(e.target.value))}
            />
            <div className="md:col-span-2">
              <Input
                label="Telefonnummer (für Kunden nach Buchung sichtbar)"
                value={form.phoneNumber}
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                placeholder="+41 44 123 45 67"
              />
            </div>
          </div>
        </Card>

        {/* Capacity & Pricing */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kapazität & Preisgestaltung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Gesamtkapazität"
              type="number"
              value={form.capacityTotal}
              onChange={(e) => updateField('capacityTotal', e.target.value)}
              placeholder="50"
              required
            />
            <Input
              label="Preis pro Tag"
              type="number"
              step="0.01"
              value={form.basePricePerDay}
              onChange={(e) => updateField('basePricePerDay', e.target.value)}
              placeholder="15.00"
              required
            />
            <Input
              label="Entfernung zum Flughafen (Min.)"
              type="number"
              value={form.distanceToAirportMin}
              onChange={(e) => updateField('distanceToAirportMin', e.target.value)}
              placeholder="5"
            />
            <Select
              label="Stornierungsrichtlinie"
              value={form.cancellationPolicy}
              onChange={(val) => updateField('cancellationPolicy', val)}
              options={[
                { value: 'flexible', label: 'Flexibel' },
                { value: 'moderate', label: 'Moderat' },
                { value: 'strict', label: 'Streng' },
              ]}
            />
          </div>
        </Card>

        {/* Pricing Tiers — date-range based */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preiszeiträume</h2>
          <p className="text-sm text-gray-500 mb-4">
            Definieren Sie Zeiträume mit einem Gesamtpreis. Falls leer, wird der Standardpreis pro Tag × Anzahl Tage verwendet.
          </p>
          {form.pricingTiers.map((tier, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 mb-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Zeitraum {i + 1}</span>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 text-sm"
                  onClick={() => {
                    const updated = form.pricingTiers.filter((_, idx) => idx !== i);
                    setForm((prev) => ({ ...prev, pricingTiers: updated }));
                  }}
                >
                  Entfernen
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  label="Startdatum"
                  type="date"
                  value={tier.start_date}
                  onChange={(e) => {
                    const updated = [...form.pricingTiers];
                    updated[i] = { ...updated[i], start_date: e.target.value };
                    setForm((prev) => ({ ...prev, pricingTiers: updated }));
                  }}
                  required
                />
                <Input
                  label="Enddatum"
                  type="date"
                  value={tier.end_date}
                  onChange={(e) => {
                    const updated = [...form.pricingTiers];
                    updated[i] = { ...updated[i], end_date: e.target.value };
                    setForm((prev) => ({ ...prev, pricingTiers: updated }));
                  }}
                  required
                />
                <Input
                  label="Gesamtpreis (CHF)"
                  type="number"
                  step="0.01"
                  value={tier.total_price}
                  onChange={(e) => {
                    const updated = [...form.pricingTiers];
                    updated[i] = { ...updated[i], total_price: parseFloat(e.target.value) || 0 };
                    setForm((prev) => ({ ...prev, pricingTiers: updated }));
                  }}
                  placeholder="149.00"
                  required
                />
                <Input
                  label="Bezeichnung (optional)"
                  value={tier.label ?? ''}
                  onChange={(e) => {
                    const updated = [...form.pricingTiers];
                    updated[i] = { ...updated[i], label: e.target.value || undefined };
                    setForm((prev) => ({ ...prev, pricingTiers: updated }));
                  }}
                  placeholder="z.B. Sommerangebot"
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setForm((prev) => ({
                ...prev,
                pricingTiers: [...prev.pricingTiers, { start_date: '', end_date: '', total_price: 0 }],
              }));
            }}
          >
            + Preiszeitraum hinzufügen
          </Button>
        </Card>

        {/* Add-ons hint */}
        <Card className="p-6 border-l-4 border-l-baby-blue-400 bg-baby-blue-50/30">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-baby-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Zusatzleistungen / Extras</h2>
              <p className="text-sm text-gray-600 mt-1">
                Zusatzleistungen (z.B. Autowäsche, Reifenwechsel) können nach der Erstellung des Parkplatzes auf der Bearbeitungsseite hinzugefügt werden.
              </p>
            </div>
          </div>
        </Card>

        {/* Amenities */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ausstattung</h2>
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

        {/* Description & Instructions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Beschreibung & Anweisungen</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Beschreibung</label>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-baby-blue-500 focus:border-transparent resize-none"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Beschreiben Sie Ihren Parkplatz..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-in Anweisungen</label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-baby-blue-500 focus:border-transparent resize-none"
                value={form.checkInInstructions}
                onChange={(e) => updateField('checkInInstructions', e.target.value)}
                placeholder="Wie finden Kunden den Parkplatz?"
              />
            </div>
          </div>
        </Card>

        {/* Images */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bilder</h2>
          <ImageUpload
            images={form.images}
            onChange={(images) => setForm((prev) => ({ ...prev, images }))}
            maxImages={8}
            label="Bilder hochladen"
          />
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.back()}>
            Abbrechen
          </Button>
          <Button type="submit" loading={loading}>
            Parkplatz veröffentlichen
          </Button>
        </div>
      </form>
    </FadeIn>
  );
}
