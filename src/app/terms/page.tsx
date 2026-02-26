import { Header, Footer } from '@/components/layout';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Allgemeine Geschäftsbedingungen</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-500 mb-8">Zuletzt aktualisiert: März 2024</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Einleitung</h2>
              <p className="text-gray-600 mb-4">
                Willkommen bei Zurich Airport Parking («wir», «unser» oder «uns»). Diese Allgemeinen Geschäftsbedingungen regeln Ihre Nutzung unserer Website und Dienstleistungen, einschliesslich unserer Parkplatzreservierungsplattform und der damit verbundenen Shuttle-Dienste.
              </p>
              <p className="text-gray-600">
                Durch den Zugriff auf oder die Nutzung unserer Dienste erklären Sie sich mit diesen Bedingungen einverstanden. Wenn Sie diesen Bedingungen nicht zustimmen, nutzen Sie unsere Dienste bitte nicht.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Dienstleistungen</h2>
              <p className="text-gray-600 mb-4">
                Wir bieten eine Online-Plattform, die es Nutzern ermöglicht:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Parkeinrichtungen in der Nähe des Flughafens Zürich zu suchen und zu vergleichen</li>
                <li>Reservierungen für Parkdienstleistungen vorzunehmen</li>
                <li>Shuttle-Dienste zwischen Parkeinrichtungen und dem Flughafen zu nutzen</li>
                <li>Ihre Buchungen und Kontoinformationen zu verwalten</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Benutzerkonten</h2>
              <p className="text-gray-600 mb-4">
                Um bestimmte Funktionen unserer Dienste nutzen zu können, müssen Sie ein Konto erstellen. Sie verpflichten sich:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Bei der Registrierung korrekte und vollständige Angaben zu machen</li>
                <li>Die Sicherheit Ihrer Zugangsdaten zu gewährleisten</li>
                <li>Uns unverzüglich über jeden unbefugten Zugriff auf Ihr Konto zu informieren</li>
                <li>Für alle Aktivitäten verantwortlich zu sein, die unter Ihrem Konto stattfinden</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Buchungen und Zahlungen</h2>
              <p className="text-gray-600 mb-4">
                Wenn Sie über unsere Plattform eine Reservierung vornehmen:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Schliessen Sie einen Vertrag mit dem Parkplatzbetreiber ab</li>
                <li>Die Zahlung ist zum Zeitpunkt der Buchung fällig</li>
                <li>Die Preise beinhalten alle anfallenden Steuern und den Shuttle-Service</li>
                <li>Sie erhalten eine Bestätigungs-E-Mail mit den Buchungsdetails</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Stornierungen und Erstattungen</h2>
              <p className="text-gray-600 mb-4">
                Unsere Stornierungsbedingungen ermöglichen:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Kostenlose Stornierung bis 24 Stunden vor der geplanten Ankunft</li>
                <li>Bei Stornierungen innerhalb von 24 Stunden kann eine Gebühr erhoben werden</li>
                <li>Bei Nichterscheinen besteht kein Anspruch auf Erstattung</li>
                <li>Erstattungen werden innerhalb von 5–7 Werktagen bearbeitet</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Haftung</h2>
              <p className="text-gray-600 mb-4">
                Obwohl wir Buchungen vermitteln, werden die Parkdienstleistungen von unabhängigen Betreibern erbracht. Wir haften nicht für:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Schäden an Fahrzeugen während des Parkens (die Haftung liegt beim Betreiber der Anlage)</li>
                <li>Verspätungen bei Shuttle-Diensten aufgrund von Verkehr oder anderen Faktoren</li>
                <li>Persönliche Gegenstände, die in Fahrzeugen zurückgelassen werden</li>
                <li>Verluste, die durch Umstände ausserhalb unserer Kontrolle entstehen</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Verbotene Aktivitäten</h2>
              <p className="text-gray-600 mb-4">
                Sie verpflichten sich, Folgendes zu unterlassen:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Nutzung unserer Dienste für rechtswidrige Zwecke</li>
                <li>Versuch, unbefugten Zugriff auf unsere Systeme zu erlangen</li>
                <li>Übermittlung falscher oder irreführender Informationen</li>
                <li>Beeinträchtigung der ordnungsgemässen Funktion unserer Dienste</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Änderungen der AGB</h2>
              <p className="text-gray-600">
                Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern. Über wesentliche Änderungen werden wir die Nutzer per E-Mail oder über unsere Website informieren. Die fortgesetzte Nutzung unserer Dienste nach Änderungen gilt als Zustimmung zu den geänderten Bedingungen.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Anwendbares Recht</h2>
              <p className="text-gray-600">
                Diese Bedingungen unterliegen dem schweizerischen Recht. Allfällige Streitigkeiten werden vor den Gerichten des Kantons Zürich, Schweiz, beigelegt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Kontakt</h2>
              <p className="text-gray-600">
                Bei Fragen zu diesen Bedingungen kontaktieren Sie uns bitte unter:
              </p>
              <p className="text-gray-600 mt-2">
                E-Mail: legal@zurichparking.ch<br />
                Adresse: Flughafenstrasse 123, 8058 Zürich, Schweiz
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
