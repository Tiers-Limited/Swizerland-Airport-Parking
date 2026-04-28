'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { Card, Button, Input, Alert } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { apiCall } from '@/lib/api';

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  contactPerson: string;
  phoneNumber: string;
  taxId: string;
  address: string;
  bankIban: string;
  mwstNumber: string;
  website: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  companyName?: string;
  bankIban?: string;
  mwstNumber?: string;
}

const swissIbanRegex = /^CH\d{2}(?:\s?[A-Z0-9]){15,30}$/i;
const swissMwstRegex = /^(?:CHE-)?\d{3}\.\d{3}\.\d{3}(?:\s?(?:MWST|TVA|IVA))?$/i;

const validateHostRegistrationAccountFields = (form: FormState, isAuthenticated: boolean): FormErrors => {
  const nextErrors: FormErrors = {};

  if (isAuthenticated) {
    return nextErrors;
  }

  if (!form.name.trim()) nextErrors.name = 'Full name is required.';
  if (!form.email.trim()) nextErrors.email = 'Email is required.';
  if (!form.password.trim()) nextErrors.password = 'Password is required.';
  if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
    nextErrors.confirmPassword = 'Passwords do not match.';
  }

  return nextErrors;
};

const validateHostRegistrationBusinessFields = (form: FormState): FormErrors => {
  const nextErrors: FormErrors = {};

  if (!form.companyName.trim()) {
    nextErrors.companyName = 'Company name is required.';
  }

  if (form.bankIban.trim()) {
    const normalizedIban = form.bankIban.trim().replaceAll(/\s/g, '');
    if (!swissIbanRegex.test(normalizedIban)) {
      nextErrors.bankIban = 'Use a Swiss IBAN, for example CH12 3456 7890 1234 5678 9.';
    }
  }

  if (form.mwstNumber.trim() && !swissMwstRegex.test(form.mwstNumber.trim())) {
    nextErrors.mwstNumber = 'Use a Swiss MWST number, for example CHE-123.456.789 MWST.';
  }

  return nextErrors;
};

const initialForm: FormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  contactPerson: '',
  phoneNumber: '',
  taxId: '',
  address: '',
  bankIban: '',
  mwstNumber: '',
  website: '',
};

export default function HostRegistrationPage() {
  const router = useRouter();
  const { user, isAuthenticated, register } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const canShowAccountFields = !isAuthenticated;

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitHostRegistration = async () => {
    return apiCall('POST', '/hosts/register', {
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      phoneNumber: form.phoneNumber.trim() || undefined,
      taxId: form.taxId.trim() || undefined,
      address: form.address.trim() || undefined,
      bankIban: form.bankIban.trim() || undefined,
      mwstNumber: form.mwstNumber.trim() || undefined,
      website: form.website.trim() || undefined,
    });
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const nextErrors = {
      ...validateHostRegistrationAccountFields(form, isAuthenticated),
      ...validateHostRegistrationBusinessFields(form),
    };

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);

    try {
      if (!isAuthenticated) {
        const reg = await register({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
          role: 'customer',
        });

        if (!reg.success) {
          setError(reg.error || 'Failed to create account.');
          setLoading(false);
          return;
        }
      }

      const hostRes = await submitHostRegistration();
      if (!hostRes.success) {
        setError(hostRes.error?.message || 'Failed to submit host registration.');
        setLoading(false);
        return;
      }

      setSuccess('Your host registration has been submitted. Your account is under approval. Once an admin approves, you will access the host portal.');
      setForm(initialForm);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-800 to-slate-700" />
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90">
                  Parkplatzpartnerprogramm für Flughafenbetreiber
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                    Verwandeln Sie Ihren Parkplatz in einen stetigen Buchungskanal.
                  </h1>
                  <p className="max-w-2xl text-base sm:text-lg text-white/80 leading-7">
                    Schließen Sie sich ZurichPark an, um Reisende zu erreichen, die sichere Flughafenparkplätze in der Nähe von Zürich suchen. Wir kümmern uns um die Suche, Buchung, Bezahlung und die Anbindung der Parkhäuser, damit Sie sich ganz auf das Parkerlebnis konzentrieren können.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'Verifiziert', label: 'Vom Administrator genehmigtes Onboarding' },
                    { value: '24/7', label: 'Online-Buchungsverfügbarkeit' },
                    { value: '1 Portal', label: 'Anfragen zentral verwalten' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
                      <p className="text-lg font-semibold text-white">{item.value}</p>
                      <p className="mt-1 text-sm text-white/70">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="#registration-form">
                    <Button size="lg">Anwendung starten</Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button size="lg" variant="secondary">So funktioniert es</Button>
                  </Link>
                </div>
              </div>

              <div className="lg:pl-8">
                <Card className="p-6 sm:p-8 shadow-2xl shadow-slate-950/20 bg-white text-gray-900">
                  <div className="space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Was die Gastgeber erhalten</p>
                    <h2 className="text-2xl font-bold">Eine sauberere Methode, leere Parkplätze zu füllen</h2>
                    <ul className="space-y-3 text-sm text-gray-600">
                      <li>• Ein spezielles Gastgeberportal für Buchungen und Leistungsübersicht</li>
                      <li>• Das Onboarding wurde vom Administrator auf Qualität und Vertrauen geprüft.</li>
                      <li>• Unterstützung für Flughafenreisende, die ein einfaches und zuverlässiges Parkerlebnis benötigen</li>
                      <li>• Strukturierte Auszahlungen und Buchungsabwicklung über die Plattform</li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      title: 'Bessere Sichtbarkeit',
                      text: 'Präsentieren Sie sich auf einem Marktplatz, der speziell für Flughafenparkplätze konzipiert ist, und nicht auf einer allgemeinen Kleinanzeigenseite.',
                    },
                    {
                      title: 'Einfaches Onboarding',
                      text: 'Bitte übermitteln Sie Ihre Unternehmensdaten einmalig. Wir prüfen das Konto, bevor das Portal freigeschaltet wird.',
                    },
                    {
                      title: 'Operational control',
                      text: 'Ankünfte, Änderungsanfragen und Buchungsübersicht können über einen einzigen Host-Arbeitsbereich abgewickelt werden.',
                    },
                    {
                      title: 'Vertrauenswürdige Zahlungen',
                      text: 'Buchungen, Rückerstattungen und Auszahlungen werden innerhalb des Plattformablaufs abgewickelt.',
                    },
                  ].map((item) => (
                    <Card key={item.title} className="p-5">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
                    </Card>
                  ))}
                </div>

                <Card className="p-6" id="how-it-works">
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">So funktioniert es</p>
                  <div className="mt-4 space-y-4">
                    {[
                      'Füllen Sie den Gastgeberantrag mit Ihren Firmen- und Kontaktdaten aus.',
                      'Unser Team prüft das Konto und verifiziert das Profil.',
                      'Nach der Genehmigung erhalten Sie Zugriff auf das Gastgeberportal und können mit der Annahme von Buchungen beginnen.',
                    ].map((item, index) => (
                      <div key={item} className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-gray-600">{item}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card className="p-6 sm:p-8 shadow-soft" id="registration-form">
                {success && (
                  <Alert variant="success" className="mb-4">
                    {success}
                  </Alert>
                )}
                {error && (
                  <Alert variant="error" className="mb-4" onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                {isAuthenticated && user?.role === 'host' ? (
                  <div className="space-y-4 text-center">
                    <p className="text-gray-700">Ihr Konto hat bereits Host-Zugriff.</p>
                    <Button onClick={() => router.push('/host')}>Zum Host-Portal wechseln</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {canShowAccountFields && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Erstellen Sie Ihr Konto</p>
                          <p className="mt-1 text-sm text-gray-500">Sie benötigen ein Konto, bevor wir es in ein Host-Profil umwandeln können.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Vollständiger Name"
                            value={form.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            disabled={loading}
                            required
                            error={fieldErrors.name}
                          />
                          <Input
                            label="E-Mail"
                            type="email"
                            value={form.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            disabled={loading}
                            required
                            error={fieldErrors.email}
                          />
                          <Input
                            label="Telefon"
                            value={form.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            disabled={loading}
                          />
                          <div className="hidden md:block" />
                          <Input
                            label="Passwort"
                            type="password"
                            value={form.password}
                            onChange={(e) => updateField('password', e.target.value)}
                            disabled={loading}
                            required
                            error={fieldErrors.password}
                          />
                          <Input
                            label="Passwort bestätigen"
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) => updateField('confirmPassword', e.target.value)}
                            disabled={loading}
                            required
                            error={fieldErrors.confirmPassword}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Host-Anwendung</p>
                        <p className="mt-1 text-sm text-gray-500">Beschreiben Sie uns das Parkunternehmen, das Sie eintragen möchten.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Firmenname"
                          value={form.companyName}
                          onChange={(e) => updateField('companyName', e.target.value)}
                          disabled={loading}
                          required
                          error={fieldErrors.companyName}
                        />
                        <Input
                          label="Ansprechpartner"
                          value={form.contactPerson}
                          onChange={(e) => updateField('contactPerson', e.target.value)}
                          disabled={loading}
                          placeholder="An wen sollen wir uns wenden?"
                        />
                        <Input
                          label="Firmentelefon"
                          value={form.phoneNumber}
                          onChange={(e) => updateField('phoneNumber', e.target.value)}
                          disabled={loading}
                          placeholder="Hauptgeschäftstelefon"
                        />
                        <Input
                          label="Steuer-ID"
                          value={form.taxId}
                          onChange={(e) => updateField('taxId', e.target.value)}
                          disabled={loading}
                        />
                        <Input
                          label="IBAN"
                          value={form.bankIban}
                          onChange={(e) => updateField('bankIban', e.target.value)}
                          disabled={loading}
                          placeholder="Für zukünftige Auszahlungen"
                          helperText="Schweizer IBAN-Format, zum Beispiel CH12 3456 7890 1234 5678 9."
                          error={fieldErrors.bankIban}
                        />
                        <Input
                          label="MWST-Nummer"
                          value={form.mwstNumber}
                          onChange={(e) => updateField('mwstNumber', e.target.value)}
                          disabled={loading}
                          placeholder="Optional"
                          helperText="Schweizer MWST-Format, zum Beispiel CHE-123.456.789 MWST."
                          error={fieldErrors.mwstNumber}
                        />
                        <Input
                          label="Webseite"
                          type="url"
                          value={form.website}
                          onChange={(e) => updateField('website', e.target.value)}
                          disabled={loading}
                          placeholder="https://..."
                        />
                        <div className="md:col-span-2">
                          <label htmlFor="host-address" className="block text-sm font-medium text-gray-700 mb-1">Adresse <span className="text-error-500">*</span></label>
                          <textarea
                            id="host-address"
                            value={form.address}
                            onChange={(e) => updateField('address', e.target.value)}
                            rows={4}
                            disabled={loading}
                            placeholder="Geschäfteadresse oder Parkplatzadresse"
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" loading={loading} disabled={loading}>
                      Host-Antrag einreichen
                    </Button>

                    {!isAuthenticated && (
                      <p className="text-sm text-gray-500 text-center">
                        Bereits ein Konto? <Link href="/login?returnUrl=%2Fhost-registration" className="text-primary-600">Anmelden</Link>
                      </p>
                    )}
                  </form>
                )}
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
