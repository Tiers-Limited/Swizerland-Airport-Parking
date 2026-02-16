import { Header, Footer } from '@/components/layout';

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Cancellation Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-500 mb-8">Last updated: March 2024</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-600">
                We understand that travel plans can change. This policy outlines the terms and conditions for cancelling or modifying your parking reservation with Zurich Airport Parking.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Free Cancellation</h2>
              <div className="bg-success-50 border border-success-200 rounded-lg p-6 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="h-6 w-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold text-success-800">Free cancellation available</span>
                </div>
                <p className="text-success-700">
                  Cancel up to 24 hours before your scheduled arrival time for a full refund.
                </p>
              </div>
              <p className="text-gray-600">
                To cancel your booking, log in to your account, go to "My Bookings," and select the booking you wish to cancel. Follow the prompts to complete the cancellation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Late Cancellations</h2>
              <p className="text-gray-600 mb-4">
                Cancellations made less than 24 hours before your scheduled arrival are subject to the following:
              </p>
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-6">
                <ul className="space-y-2 text-warning-800">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">12-24 hours before:</span>
                    <span>50% of the booking total will be charged</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">Less than 12 hours:</span>
                    <span>No refund available</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">No-Shows</h2>
              <p className="text-gray-600">
                If you do not arrive at the parking facility without cancelling your reservation, no refund will be provided. We recommend cancelling your booking if your plans change to avoid being charged.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Modifications</h2>
              <p className="text-gray-600 mb-4">
                You can modify your booking dates and times free of charge, subject to availability:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Modifications must be made at least 24 hours before your original arrival time</li>
                <li>If the new dates result in a higher price, you will be charged the difference</li>
                <li>If the new dates result in a lower price, the difference will be refunded</li>
                <li>Log in to your account to make modifications online</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Process</h2>
              <p className="text-gray-600 mb-4">
                When a refund is approved:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Refunds are processed within 1-2 business days</li>
                <li>The refund will be credited to your original payment method</li>
                <li>Bank processing times may vary (typically 5-7 business days)</li>
                <li>You will receive an email confirmation when your refund is processed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Special Circumstances</h2>
              <p className="text-gray-600 mb-4">
                We understand that exceptional circumstances may arise. In the following situations, we may offer a full refund or credit regardless of the standard policy:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Flight cancellation by the airline (proof required)</li>
                <li>Medical emergency (documentation required)</li>
                <li>Government travel restrictions</li>
                <li>Natural disasters or extreme weather events</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Please contact our support team with relevant documentation to request an exception.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Early Departure</h2>
              <p className="text-gray-600">
                If you collect your vehicle earlier than your booked end date, no refund will be provided for the unused portion of your reservation. We recommend booking only for the days you need.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Extended Stay</h2>
              <p className="text-gray-600 mb-4">
                If you need to extend your parking stay beyond your original booking:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Contact the parking facility directly or extend through your account</li>
                <li>Extension is subject to availability</li>
                <li>Additional days will be charged at the current daily rate</li>
                <li>Payment can be made online or at the facility</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600">
                If you have questions about our cancellation policy or need assistance with your booking, please contact our support team:
              </p>
              <p className="text-gray-600 mt-2">
                Email: support@zurichparking.ch<br />
                Phone: +41 44 123 45 67<br />
                Hours: Monday - Friday, 8:00 - 18:00 CET
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
