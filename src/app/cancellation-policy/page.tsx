import { Header, Footer } from "@/components/layout";

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Stornierungsrichtlinie
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-500 mb-8">
              Zuletzt aktualisiert: März 2024
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Übersicht
              </h2>
              <p className="text-gray-600">
                Wir verstehen, dass sich Reisepläne ändern können. Diese
                Richtlinie beschreibt die Bedingungen für die Stornierung oder
                Änderung Ihrer Parkplatzreservierung bei Zurich Airport Parking.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Kostenlose Stornierung
              </h2>
              <div className="bg-success-50 border border-success-200 rounded-lg p-6 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <svg
                    className="h-6 w-6 text-success-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-semibold text-success-800">
                    Kostenlose Stornierung möglich
                  </span>
                </div>
                <p className="text-success-700">
                  Stornieren Sie bis zu 24 Stunden vor Ihrer geplanten Ankunft
                  für eine vollständige Erstattung.
                </p>
              </div>
              <p className="text-gray-600">
                Buchungsstornierungen werden durch unser Admin-Team bearbeitet.
                Bitte kontaktieren Sie den Support und geben Sie Ihren
                Buchungscode sowie den Stornierungsgrund an.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Verspätete Stornierungen
              </h2>
              <p className="text-gray-600 mb-4">
                Stornierungen, die weniger als 24 Stunden vor Ihrer geplanten
                Ankunft erfolgen, unterliegen folgenden Bedingungen:
              </p>
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-6">
                <ul className="space-y-2 text-warning-800">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">12–24 Stunden vorher:</span>
                    <span>50 % des Buchungsbetrags werden berechnet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">Weniger als 12 Stunden:</span>
                    <span>Keine Erstattung möglich</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Nichterscheinen
              </h2>
              <p className="text-gray-600">
                Wenn Sie nicht am Parkplatz erscheinen, ohne Ihre Reservierung
                zu stornieren, wird keine Erstattung gewährt. Wir empfehlen,
                Ihre Buchung zu stornieren, wenn sich Ihre Pläne ändern, um
                unnötige Kosten zu vermeiden.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Änderungen
              </h2>
              <p className="text-gray-600 mb-4">
                Sie können Ihre Buchungsdaten und -zeiten kostenlos ändern,
                vorbehaltlich der Verfügbarkeit:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  Änderungen müssen mindestens 24 Stunden vor Ihrer
                  ursprünglichen Ankunftszeit vorgenommen werden
                </li>
                <li>
                  Wenn die neuen Daten einen höheren Preis ergeben, wird Ihnen
                  die Differenz berechnet
                </li>
                <li>
                  Wenn die neuen Daten einen niedrigeren Preis ergeben, wird die
                  Differenz erstattet
                </li>
                <li>
                  Bitte kontaktieren Sie den Support, damit ein Admin die
                  Änderung durchführen kann
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Erstattungsprozess
              </h2>
              <p className="text-gray-600 mb-4">
                Wenn eine Erstattung genehmigt wird:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  Erstattungen werden innerhalb von 1–2 Werktagen bearbeitet
                </li>
                <li>
                  Die Erstattung wird Ihrer ursprünglichen Zahlungsmethode
                  gutgeschrieben
                </li>
                <li>
                  Die Bearbeitungszeit der Bank kann variieren (in der Regel 5–7
                  Werktage)
                </li>
                <li>
                  Sie erhalten eine E-Mail-Bestätigung, sobald Ihre Erstattung
                  bearbeitet wurde
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Besondere Umstände
              </h2>
              <p className="text-gray-600 mb-4">
                Wir verstehen, dass aussergewöhnliche Umstände eintreten können.
                In den folgenden Situationen können wir unabhängig von der
                Standardrichtlinie eine vollständige Erstattung oder Gutschrift
                anbieten:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  Flugstornierung durch die Fluggesellschaft (Nachweis
                  erforderlich)
                </li>
                <li>Medizinischer Notfall (Dokumentation erforderlich)</li>
                <li>Staatliche Reisebeschränkungen</li>
                <li>Naturkatastrophen oder extreme Wetterereignisse</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Bitte kontaktieren Sie unser Support-Team mit den entsprechenden
                Unterlagen, um eine Ausnahme zu beantragen.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Frühe Abreise
              </h2>
              <p className="text-gray-600">
                Wenn Sie Ihr Fahrzeug früher als zum gebuchten Enddatum abholen,
                wird für den ungenutzten Teil Ihrer Reservierung keine
                Erstattung gewährt. Wir empfehlen, nur für die Tage zu buchen,
                die Sie benötigen.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Verlängerter Aufenthalt
              </h2>
              <p className="text-gray-600 mb-4">
                Wenn Sie Ihren Parkaufenthalt über Ihre ursprüngliche Buchung
                hinaus verlängern müssen:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  Kontaktieren Sie die Parkeinrichtung direkt oder verlängern
                  Sie über Ihr Konto
                </li>
                <li>Die Verlängerung ist von der Verfügbarkeit abhängig</li>
                <li>
                  Zusätzliche Tage werden zum aktuellen Tagespreis berechnet
                </li>
                <li>Die Zahlung kann online oder vor Ort erfolgen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Kontakt
              </h2>
              <p className="text-gray-600">
                Wenn Sie Fragen zu unserer Stornierungsrichtlinie haben oder
                Hilfe bei Ihrer Buchung benötigen, kontaktieren Sie bitte unser
                Support-Team:
              </p>
              <p className="text-gray-600 mt-2">
                E-Mail (Gäste): support@elvario.ch
                <br />
                E-Mail (Hosts): host@elvario.ch
                <br />
                Telefon: +41 44 5453979
                <br />
                Öffnungszeiten: Montag – Freitag, 8:00 – 18:00 MEZ
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
