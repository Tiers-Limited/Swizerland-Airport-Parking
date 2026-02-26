import { Header, Footer } from '@/components/layout';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Datenschutzrichtlinie</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-500 mb-8">Zuletzt aktualisiert: März 2024</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Einleitung</h2>
              <p className="text-gray-600 mb-4">
                Zurich Airport Parking („wir", „unser" oder „uns") verpflichtet sich zum Schutz Ihrer Privatsphäre. Diese Datenschutzrichtlinie erläutert, wie wir Ihre Informationen erfassen, verwenden, offenlegen und schützen, wenn Sie unsere Website und Dienste nutzen.
              </p>
              <p className="text-gray-600">
                Bitte lesen Sie diese Datenschutzrichtlinie sorgfältig durch. Mit der Nutzung unserer Dienste stimmen Sie den in dieser Richtlinie beschriebenen Praktiken zu.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Informationen, die wir erfassen</h2>
              
              <h3 className="text-lg font-medium text-gray-900 mb-3">Persönliche Informationen</h3>
              <p className="text-gray-600 mb-4">
                Wir erfassen Informationen, die Sie uns direkt zur Verfügung stellen, darunter:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Name und Kontaktinformationen (E-Mail, Telefonnummer)</li>
                <li>Zugangsdaten (E-Mail und Passwort)</li>
                <li>Fahrzeuginformationen (Kennzeichen, Marke, Modell)</li>
                <li>Zahlungsinformationen (sicher verarbeitet über Zahlungsanbieter)</li>
                <li>Reiseinformationen (Ankunfts-/Abflugzeiten, Flugdetails)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Automatisch erfasste Informationen</h3>
              <p className="text-gray-600 mb-4">
                Wenn Sie unsere Dienste nutzen, erfassen wir automatisch:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Geräteinformationen (Browsertyp, Betriebssystem)</li>
                <li>IP-Adresse und Standortdaten</li>
                <li>Nutzungsdaten (besuchte Seiten, genutzte Funktionen)</li>
                <li>Cookies und ähnliche Tracking-Technologien</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Wie wir Ihre Informationen verwenden</h2>
              <p className="text-gray-600 mb-4">
                Wir verwenden die erfassten Informationen, um:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Ihre Parkplatzreservierungen zu bearbeiten und zu verwalten</li>
                <li>Buchungsbestätigungen und Aktualisierungen mitzuteilen</li>
                <li>Kundensupport zu bieten und Anfragen zu beantworten</li>
                <li>Unsere Dienste und das Nutzererlebnis zu verbessern</li>
                <li>Werbematerialien zu senden (mit Ihrer Zustimmung)</li>
                <li>Gesetzlichen Verpflichtungen nachzukommen</li>
                <li>Betrug zu verhindern und die Sicherheit zu gewährleisten</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Weitergabe von Informationen</h2>
              <p className="text-gray-600 mb-4">
                Wir können Ihre Informationen weitergeben an:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Parkplatzbetreiber (zur Erfüllung Ihrer Reservierung)</li>
                <li>Zahlungsdienstleister (zur Abwicklung von Transaktionen)</li>
                <li>Dienstleister (Hosting, Analytik, E-Mail)</li>
                <li>Behörden (wenn gesetzlich vorgeschrieben)</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Wir verkaufen Ihre persönlichen Daten nicht an Dritte.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Datensicherheit</h2>
              <p className="text-gray-600 mb-4">
                Wir setzen angemessene technische und organisatorische Massnahmen zum Schutz Ihrer persönlichen Daten ein, darunter:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Verschlüsselung der Daten bei der Übertragung und im Ruhezustand</li>
                <li>Sichere Authentifizierungsmechanismen</li>
                <li>Regelmässige Sicherheitsüberprüfungen</li>
                <li>Eingeschränkter Zugriff auf persönliche Daten</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Ihre Rechte</h2>
              <p className="text-gray-600 mb-4">
                Gemäss den geltenden Datenschutzgesetzen haben Sie das Recht auf:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Zugang zu Ihren persönlichen Daten</li>
                <li>Berichtigung unrichtiger Daten</li>
                <li>Löschung Ihrer Daten</li>
                <li>Widerspruch gegen oder Einschränkung der Verarbeitung</li>
                <li>Datenübertragbarkeit</li>
                <li>Widerruf der Einwilligung jederzeit</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Um diese Rechte auszuüben, kontaktieren Sie uns bitte unter privacy@zurichparking.ch.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies</h2>
              <p className="text-gray-600 mb-4">
                Wir verwenden Cookies und ähnliche Technologien, um:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Ihre Einstellungen zu speichern</li>
                <li>Den Website-Verkehr und die Nutzung zu analysieren</li>
                <li>Inhalte und Werbung zu personalisieren</li>
                <li>Funktionen für soziale Medien bereitzustellen</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Sie können Cookie-Einstellungen über Ihre Browsereinstellungen verwalten.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Datenaufbewahrung</h2>
              <p className="text-gray-600">
                Wir bewahren Ihre persönlichen Daten so lange auf, wie es zur Erfüllung der in dieser Datenschutzrichtlinie beschriebenen Zwecke erforderlich ist, es sei denn, eine längere Aufbewahrungsfrist ist gesetzlich vorgeschrieben. Nach Ablauf dieser Frist werden die Daten sicher gelöscht oder anonymisiert.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Internationale Datenübermittlungen</h2>
              <p className="text-gray-600">
                Ihre Informationen können in Länder ausserhalb der Schweiz übermittelt und dort verarbeitet werden. Wir stellen sicher, dass geeignete Schutzmassnahmen zum Schutz Ihrer Daten gemäss den geltenden Gesetzen getroffen werden.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Änderungen dieser Richtlinie</h2>
              <p className="text-gray-600">
                Wir können diese Datenschutzrichtlinie von Zeit zu Zeit aktualisieren. Wir werden Sie über wesentliche Änderungen informieren, indem wir die neue Datenschutzrichtlinie auf dieser Seite veröffentlichen und Sie gegebenenfalls per E-Mail benachrichtigen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Kontakt</h2>
              <p className="text-gray-600">
                Wenn Sie Fragen zu dieser Datenschutzrichtlinie oder unseren Datenpraktiken haben, kontaktieren Sie bitte:
              </p>
              <p className="text-gray-600 mt-2">
                Datenschutzbeauftragter<br />
                E-Mail: privacy@zurichparking.ch<br />
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
