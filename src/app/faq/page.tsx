'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui';
import { Header, Footer } from '@/components/layout';

const faqCategories = [
  {
    name: 'Booking',
    faqs: [
      {
        question: 'How do I make a reservation?',
        answer: 'Simply enter your travel dates on our homepage or search page, browse available parking options, select your preferred facility, and complete the booking with your vehicle and payment details. You\'ll receive an instant confirmation email with all the details.',
      },
      {
        question: 'Can I modify my booking?',
        answer: 'Yes, you can modify your booking dates and times up to 24 hours before your scheduled arrival. Log in to your account, go to "My Bookings," and select the booking you want to change. Some changes may affect the total price.',
      },
      {
        question: 'What is your cancellation policy?',
        answer: 'Free cancellation is available up to 24 hours before your scheduled arrival. Cancellations made within 24 hours may be subject to a fee. Refunds are processed within 5-7 business days.',
      },
      {
        question: 'Do I need to print my booking confirmation?',
        answer: 'No, you don\'t need to print anything. Simply show your booking confirmation on your smartphone when you arrive at the parking facility. The booking code in your confirmation email is all you need.',
      },
    ],
  },
  {
    name: 'Shuttle Service',
    faqs: [
      {
        question: 'How does the shuttle service work?',
        answer: 'After parking your car, you\'ll board a free shuttle bus that takes you directly to the airport terminal. When you return, follow the signs to the shuttle pickup area, and the shuttle will bring you back to the parking facility.',
      },
      {
        question: 'How often do the shuttles run?',
        answer: 'Shuttle frequency varies by parking facility, but most run every 10-20 minutes during peak hours. Check the specific parking listing for exact shuttle schedules and operating hours.',
      },
      {
        question: 'How long does the shuttle take to the airport?',
        answer: 'Most of our partner facilities are located 5-15 minutes from Zurich Airport. The exact travel time depends on traffic conditions and the specific facility location.',
      },
      {
        question: 'What if my flight is delayed?',
        answer: 'Don\'t worry! Our shuttle service operates throughout the parking facility\'s opening hours. If your flight is significantly delayed, contact the parking facility directly – their number is in your booking confirmation.',
      },
    ],
  },
  {
    name: 'Parking & Security',
    faqs: [
      {
        question: 'Is my car safe?',
        answer: 'Absolutely. All our partner facilities feature 24/7 security surveillance, CCTV cameras, secure fencing, and regular patrols. Many also offer covered parking options for additional protection.',
      },
      {
        question: 'What happens when I arrive at the parking facility?',
        answer: 'When you arrive, check in at the reception with your booking confirmation. Staff will guide you to your parking spot, and then you can take the shuttle to the airport.',
      },
      {
        question: 'Can I leave my car keys?',
        answer: 'This depends on the parking type. "Self-park" means you keep your keys. "Valet" means a professional driver parks your car, which requires leaving keys. Check the listing details for specifics.',
      },
      {
        question: 'What if my car is damaged while parked?',
        answer: 'All our partner facilities carry liability insurance. If any damage occurs, report it immediately to the facility staff and document it with photos. Claims are handled by the facility\'s insurance.',
      },
    ],
  },
  {
    name: 'Payment & Pricing',
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and various digital payment methods. Payment is securely processed through our encrypted payment system.',
      },
      {
        question: 'Is the price final or will there be additional charges?',
        answer: 'The price shown during booking is the final price, including all taxes and shuttle service. There are no hidden fees. Additional charges only apply if you extend your stay beyond the booked period.',
      },
      {
        question: 'How can I get an invoice?',
        answer: 'An invoice is automatically sent to your email after payment. You can also download invoices anytime from your account under "My Bookings."',
      },
      {
        question: 'Do you offer discounts for longer stays?',
        answer: 'Yes! Many of our partner facilities offer weekly discounts. The discounted price is automatically calculated and displayed when you search for dates longer than 7 days.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600">
              Find answers to common questions about parking, bookings, and shuttle services.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-12">
              {faqCategories.map((category) => (
                <div key={category.name}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.name}</h2>
                  <div className="space-y-3">
                    {category.faqs.map((faq, index) => {
                      const key = `${category.name}-${index}`;
                      const isOpen = openItems[key];

                      return (
                        <Card key={key} padding="none" className="overflow-hidden">
                          <button
                            onClick={() => toggleItem(key)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                            <svg
                              className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {isOpen && (
                            <div className="px-6 pb-4">
                              <p className="text-gray-600">{faq.answer}</p>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Still have questions */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Still Have Questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
            >
              Contact Support
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
