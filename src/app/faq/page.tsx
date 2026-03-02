'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui';
import { Header, Footer } from '@/components/layout';

const faqCategories = [
  {
    name: 'Buchung',
    faqs: [
      {
        question: 'Wie mache ich eine Reservierung?',
        answer: 'Geben Sie einfach Ihre Reisedaten auf unserer Startseite oder Suchseite ein, durchsuchen Sie die verfügbaren Parkoptionen, wählen Sie Ihre bevorzugte Einrichtung und schliessen Sie die Buchung mit Ihren Fahrzeug- und Zahlungsdaten ab. Sie erhalten sofort eine Bestätigungs-E-Mail mit allen Details.',
      },
      {
        question: 'Kann ich meine Buchung ändern?',
        answer: 'Ja, Sie können Ihre Buchungsdaten und -zeiten bis 24 Stunden vor Ihrer geplanten Ankunft ändern. Melden Sie sich in Ihrem Konto an, gehen Sie zu „Meine Buchungen" und wählen Sie die Buchung aus, die Sie ändern möchten. Einige Änderungen können den Gesamtpreis beeinflussen.',
      },
      {
        question: 'Wie lautet Ihre Stornierungsrichtlinie?',
        answer: 'Bis 24 Stunden vor Ihrer geplanten Ankunft ist eine kostenlose Stornierung möglich. Bei Stornierungen innerhalb von 24 Stunden kann eine Gebühr anfallen. Rückerstattungen werden innerhalb von 5–7 Werktagen bearbeitet.',
      },
      {
        question: 'Muss ich meine Buchungsbestätigung ausdrucken?',
        answer: 'Nein, Sie müssen nichts ausdrucken. Zeigen Sie bei Ihrer Ankunft in der Parkeinrichtung einfach Ihre Buchungsbestätigung auf Ihrem Smartphone vor. Der Buchungscode in Ihrer Bestätigungs-E-Mail genügt.',
      },
    ],
  },
  {
    name: 'Transfer & Anreise',
    faqs: [
      {
        question: 'Wie komme ich vom Parkplatz zum Flughafen?',
        answer: 'Die meisten Parkeinrichtungen bieten einen bequemen Transferservice zum Flughafenterminal an. Details zum Transfer finden Sie in der jeweiligen Parkplatzbeschreibung und in Ihrer Buchungsbestätigung.',
      },
      {
        question: 'Wie weit sind die Parkplätze vom Flughafen entfernt?',
        answer: 'Die meisten unserer Partnereinrichtungen befinden sich 5–15 Minuten vom Flughafen Zürich entfernt. Die genaue Entfernung und Fahrzeit finden Sie in der Parkplatzbeschreibung.',
      },
      {
        question: 'Was passiert, wenn mein Flug Verspätung hat?',
        answer: 'Keine Sorge! Bei erheblicher Flugverspätung kontaktieren Sie die Parkeinrichtung direkt – die Telefonnummer finden Sie in Ihrer Buchungsbestätigung.',
      },
    ],
  },
  {
    name: 'Parken & Sicherheit',
    faqs: [
      {
        question: 'Ist mein Auto sicher?',
        answer: 'Absolut. Alle unsere Partnereinrichtungen verfügen über 24/7-Sicherheitsüberwachung, Videoüberwachungskameras, sichere Umzäunung und regelmässige Patrouillen. Viele bieten auch überdachte Parkplätze für zusätzlichen Schutz an.',
      },
      {
        question: 'Was passiert bei meiner Ankunft in der Parkeinrichtung?',
        answer: 'Bei Ihrer Ankunft melden Sie sich an der Rezeption mit Ihrer Buchungsbestätigung an. Das Personal weist Ihnen Ihren Parkplatz zu.',
      },
      {
        question: 'Kann ich meinen Autoschlüssel behalten?',
        answer: 'Das hängt von der Parkart ab. Bei „Self-Park" behalten Sie Ihren Schlüssel. Bei „Valet" parkt ein professioneller Fahrer Ihr Auto, wofür die Schlüsselübergabe erforderlich ist. Überprüfen Sie die Inseratdetails für weitere Informationen.',
      },
      {
        question: 'Was passiert, wenn mein Auto während des Parkens beschädigt wird?',
        answer: 'Alle unsere Partnereinrichtungen verfügen über eine Haftpflichtversicherung. Sollte ein Schaden auftreten, melden Sie diesen sofort dem Personal der Einrichtung und dokumentieren Sie ihn mit Fotos. Schadensfälle werden über die Versicherung der Einrichtung abgewickelt.',
      },
    ],
  },
  {
    name: 'Zahlung & Preise',
    faqs: [
      {
        question: 'Welche Zahlungsmethoden akzeptieren Sie?',
        answer: 'Wir akzeptieren alle gängigen Kreditkarten (Visa, Mastercard, American Express), Debitkarten und verschiedene digitale Zahlungsmethoden. Die Zahlung wird sicher über unser verschlüsseltes Zahlungssystem abgewickelt.',
      },
      {
        question: 'Ist der Preis endgültig oder kommen zusätzliche Kosten hinzu?',
        answer: 'Der bei der Buchung angezeigte Preis ist der Endpreis, inklusive aller Steuern. Es gibt keine versteckten Gebühren. Zusätzliche Kosten fallen nur an, wenn Sie Ihren Aufenthalt über den gebuchten Zeitraum hinaus verlängern.',
      },
      {
        question: 'Wie erhalte ich eine Rechnung?',
        answer: 'Eine Rechnung wird nach der Zahlung automatisch an Ihre E-Mail-Adresse gesendet. Sie können Rechnungen auch jederzeit in Ihrem Konto unter „Meine Buchungen" herunterladen.',
      },
      {
        question: 'Bieten Sie Rabatte für längere Aufenthalte an?',
        answer: 'Ja! Viele unserer Partnereinrichtungen bieten Wochenrabatte an. Der vergünstigte Preis wird automatisch berechnet und angezeigt, wenn Sie nach Zeiträumen von mehr als 7 Tagen suchen.',
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
              Häufig gestellte Fragen
            </h1>
            <p className="text-xl text-gray-600">
              Finden Sie Antworten auf häufige Fragen zu Parken und Buchungen.
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

        {/* Noch Fragen */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Noch Fragen?
            </h2>
            <p className="text-gray-600 mb-6">
              Sie finden die gesuchte Antwort nicht? Unser Support-Team hilft Ihnen gerne.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
            >
              Support kontaktieren
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
