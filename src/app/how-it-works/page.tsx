import { Card, CardContent, Button } from '@/components/ui';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';

const steps = [
  {
    number: '01',
    title: 'Suchen & Vergleichen',
    description: 'Geben Sie Ihre Reisedaten ein und vergleichen Sie Parkoptionen in der Nähe des Flughafens Zürich. Filtern Sie nach Preis, Entfernung, Ausstattung und Shuttle-Frequenz.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Online buchen',
    description: 'Reservieren Sie Ihren Platz sofort mit unserem sicheren Buchungssystem. Geben Sie Ihre Fahrzeugdaten, Fluginformationen ein und bezahlen Sie sicher online.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Parken & Shuttle',
    description: 'Fahren Sie zur Parkanlage, übergeben Sie Ihr Fahrzeug in sichere Hände und nehmen Sie den kostenlosen Shuttle direkt zum Flughafenterminal.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Rückkehr & Abholung',
    description: 'Nach der Landung bringt der Shuttle Sie zurück zu Ihrem Fahrzeug. So einfach – kein Stress, kein Aufwand.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

const benefits = [
  { title: 'Bis zu 70% sparen', description: 'Im Vergleich zu offiziellen Flughafenparkgebühren' },
  { title: 'Gratis Shuttle', description: 'Bei jeder Buchung inklusive, regelmässig verkehrend' },
  { title: 'Sicheres Parken', description: '24/7 Überwachung, eingezäunte Anlagen, Videoüberwachung' },
  { title: 'Echtzeit-Updates', description: 'Verfolgen Sie Ihren Shuttle und erhalten Sie Benachrichtigungen' },
  { title: 'Flexible Stornierung', description: 'Kostenlose Stornierung bis zu 24 Stunden vorher' },
  { title: 'Sofortige Bestätigung', description: 'Erhalten Sie Ihre Buchungsdetails sofort' },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              So funktioniert's
            </h1>
            <p className="text-xl text-gray-600">
              Flughafenparken in 4 einfachen Schritten buchen. Geld sparen und stressfrei reisen.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={`flex flex-col md:flex-row items-center gap-8 ${
                    index % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                      {step.icon}
                    </div>
                  </div>
                  <div className={`flex-1 text-center ${index % 2 === 1 ? 'md:text-right' : 'md:text-left'}`}>
                    <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">
                      Schritt {step.number}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-4">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Warum uns wählen?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit) => (
                <Card key={benefit.title} padding="md">
                  <CardContent className="text-center">
                    <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-6 w-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-sm text-gray-500">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary-600">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Bereit, Ihren Parkplatz zu buchen?
            </h2>
            <p className="text-primary-100 mb-8">
              Finden Sie die besten Parkangebote in der Nähe des Flughafens Zürich und sparen Sie bis zu 70% im Vergleich zu offiziellen Tarifen.
            </p>
            <Link href="/zurich">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                Jetzt Parkplatz suchen
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
