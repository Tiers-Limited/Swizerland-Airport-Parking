import { Header, Footer } from '@/components/layout';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-500 mb-8">Last updated: March 2024</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                Welcome to Zurich Airport Parking ("we," "our," or "us"). These Terms of Service govern your use of our website and services, including our parking reservation platform and related shuttle services.
              </p>
              <p className="text-gray-600">
                By accessing or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Services</h2>
              <p className="text-gray-600 mb-4">
                We provide an online platform that enables users to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Search and compare parking facilities near Zurich Airport</li>
                <li>Make reservations for parking services</li>
                <li>Access shuttle services between parking facilities and the airport</li>
                <li>Manage their bookings and account information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-600 mb-4">
                To use certain features of our services, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Be responsible for all activities that occur under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Bookings and Payments</h2>
              <p className="text-gray-600 mb-4">
                When you make a reservation through our platform:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>You enter into a contract with the parking facility operator</li>
                <li>Payment is due at the time of booking</li>
                <li>Prices include all applicable taxes and the shuttle service</li>
                <li>You will receive a confirmation email with booking details</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cancellations and Refunds</h2>
              <p className="text-gray-600 mb-4">
                Our cancellation policy allows for:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Free cancellation up to 24 hours before scheduled arrival</li>
                <li>Cancellations within 24 hours may be subject to a fee</li>
                <li>No-shows are not eligible for refunds</li>
                <li>Refunds are processed within 5-7 business days</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Liability</h2>
              <p className="text-gray-600 mb-4">
                While we facilitate bookings, the parking services are provided by independent operators. We are not liable for:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Damage to vehicles during parking (liability lies with facility operator)</li>
                <li>Delays in shuttle services due to traffic or other factors</li>
                <li>Personal property left in vehicles</li>
                <li>Losses arising from circumstances beyond our control</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Prohibited Activities</h2>
              <p className="text-gray-600 mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Use our services for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Submit false or misleading information</li>
                <li>Interfere with the proper functioning of our services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Changes to Terms</h2>
              <p className="text-gray-600">
                We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through our website. Continued use of our services after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Governing Law</h2>
              <p className="text-gray-600">
                These Terms are governed by Swiss law. Any disputes shall be resolved in the courts of the Canton of Zurich, Switzerland.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact</h2>
              <p className="text-gray-600">
                For questions about these Terms, please contact us at:
              </p>
              <p className="text-gray-600 mt-2">
                Email: legal@zurichparking.ch<br />
                Address: Flughafenstrasse 123, 8058 Zurich, Switzerland
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
