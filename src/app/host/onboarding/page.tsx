'use client';

import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { Header, Footer } from '@/components/layout';
import { FadeIn } from '@/components/animations';

export default function HostOnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <FadeIn>
          <div className="w-full max-w-lg">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-baby-blue-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-baby-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Host werden</h1>
              <p className="text-gray-500 mt-2">Parkplätze anbieten und verdienen.</p>
            </div>

            <Card className="p-8 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Registrierung nur über den Administrator</h2>
              <p className="text-gray-600 mb-6">
                Host-Konten werden ausschliesslich durch den Administrator erstellt.
                Bitte kontaktieren Sie uns, um ein Host-Konto zu erhalten.
              </p>

              <div className="space-y-3">
                <Link href="/contact">
                  <Button className="w-full">Kontakt aufnehmen</Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary" className="w-full">Zurück zur Startseite</Button>
                </Link>
              </div>
            </Card>

            {/* Benefits */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl mb-1">💰</div>
                <p className="text-xs text-gray-500">Zusätzliches Einkommen</p>
              </div>
              <div>
                <div className="text-2xl mb-1">📊</div>
                <p className="text-xs text-gray-500">Einfache Verwaltung</p>
              </div>
              <div>
                <div className="text-2xl mb-1">🛡️</div>
                <p className="text-xs text-gray-500">Voller Support</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </main>

      <Footer />
    </div>
  );
}
