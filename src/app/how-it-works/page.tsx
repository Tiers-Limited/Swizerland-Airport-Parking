import { Card, CardContent, Button } from '@/components/ui';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';

const steps = [
  {
    number: '01',
    title: 'Search & Compare',
    description: 'Enter your travel dates and compare parking options near Zurich Airport. Filter by price, distance, amenities, and shuttle frequency.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Book Online',
    description: 'Reserve your spot instantly with our secure booking system. Enter your vehicle details, flight information, and pay securely online.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Park & Shuttle',
    description: 'Drive to your parking facility, leave your car in secure hands, and take the free shuttle directly to the airport terminal.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Return & Collect',
    description: "When you land, the shuttle brings you back to your car. It's that simple – no stress, no hassle.',",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

const benefits = [
  { title: 'Save Up to 70%', description: 'Compared to official airport parking rates' },
  { title: 'Free Shuttle', description: 'Included with every booking, running frequently' },
  { title: 'Secure Parking', description: '24/7 surveillance, fenced facilities, CCTV' },
  { title: 'Real-time Updates', description: 'Track your shuttle and get notifications' },
  { title: 'Flexible Cancellation', description: 'Free cancellation up to 24 hours before' },
  { title: 'Instant Confirmation', description: 'Receive your booking details immediately' },
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
              How It Works
            </h1>
            <p className="text-xl text-gray-600">
              Book airport parking in 4 simple steps. Save money and travel stress-free.
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
                      Step {step.number}
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
              Why Choose Us?
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
              Ready to Book Your Parking?
            </h2>
            <p className="text-primary-100 mb-8">
              Find the best parking deals near Zurich Airport and save up to 70% compared to official rates.
            </p>
            <Link href="/zurich">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                Search Parking Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
