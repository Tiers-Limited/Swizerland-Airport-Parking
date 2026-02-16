import { Header, Footer } from '@/components/layout';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-500 mb-8">Last updated: March 2024</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                Zurich Airport Parking ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
              </p>
              <p className="text-gray-600">
                Please read this Privacy Policy carefully. By using our services, you consent to the practices described in this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
              <p className="text-gray-600 mb-4">
                We collect information you provide directly, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Name and contact information (email, phone number)</li>
                <li>Account credentials (email and password)</li>
                <li>Vehicle information (registration plate, make, model)</li>
                <li>Payment information (processed securely through payment providers)</li>
                <li>Travel information (arrival/departure times, flight details)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Automatically Collected Information</h3>
              <p className="text-gray-600 mb-4">
                When you use our services, we automatically collect:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Device information (browser type, operating system)</li>
                <li>IP address and location data</li>
                <li>Usage data (pages visited, features used)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Process and manage your parking reservations</li>
                <li>Communicate booking confirmations and updates</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve our services and user experience</li>
                <li>Send promotional materials (with your consent)</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and ensure security</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
              <p className="text-gray-600 mb-4">
                We may share your information with:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Parking facility operators (to fulfill your reservation)</li>
                <li>Payment processors (to complete transactions)</li>
                <li>Service providers (hosting, analytics, email)</li>
                <li>Legal authorities (when required by law)</li>
              </ul>
              <p className="text-gray-600 mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-600 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication mechanisms</li>
                <li>Regular security assessments</li>
                <li>Limited access to personal information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-600 mb-4">
                Under applicable data protection laws, you have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to or restrict processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="text-gray-600 mt-4">
                To exercise these rights, please contact us at privacy@zurichparking.ch.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies</h2>
              <p className="text-gray-600 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Remember your preferences</li>
                <li>Analyze website traffic and usage</li>
                <li>Personalize content and advertisements</li>
                <li>Provide social media features</li>
              </ul>
              <p className="text-gray-600 mt-4">
                You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-600">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. After this period, data is securely deleted or anonymized.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Transfers</h2>
              <p className="text-gray-600">
                Your information may be transferred to and processed in countries outside Switzerland. We ensure appropriate safeguards are in place to protect your information in compliance with applicable laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new Privacy Policy on this page and, where appropriate, by email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-600">
                If you have questions about this Privacy Policy or our data practices, please contact:
              </p>
              <p className="text-gray-600 mt-2">
                Data Protection Officer<br />
                Email: privacy@zurichparking.ch<br />
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
