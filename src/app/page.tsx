"use client";

import { useState,useCallback,useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import { buildQueryString, formatDateForInput } from "@/lib/utils";
import BookingDateTimePicker from '@/components/ui/BookingDateTimePicker';

import dayjs from 'dayjs';
export default function HomePage() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [checkInTime, setCheckInTime] = useState('10:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkinDateTime, setCheckinDateTime] = useState<dayjs.Dayjs | null>(null);
  const [checkoutDateTime, setCheckoutDateTime] = useState<dayjs.Dayjs | null>(null);
  const [checkinDisplay, setCheckinDisplay] = useState('');
  const [checkoutDisplay, setCheckoutDisplay] = useState('');
// In your page.tsx
const defaultCheckin = useMemo(() => dayjs().add(1, 'day').hour(11).minute(0), []);
const defaultCheckout = useMemo(() => dayjs().add(3, 'day').hour(13).minute(0), []);

const handleBookingChange = useCallback((checkin: dayjs.Dayjs | null, checkout: dayjs.Dayjs | null) => {
  setCheckinDateTime(checkin);
  setCheckoutDateTime(checkout);
  setCheckinDisplay(checkin?.format('DD MMM YYYY, HH:mm') || '');
  setCheckoutDisplay(checkout?.format('DD MMM YYYY, HH:mm') || '');
}, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinDateTime || !checkoutDateTime) return;

    // Your existing query logic...
    const startDate = checkinDateTime.format('YYYY-MM-DD');
    const endDate = checkoutDateTime.format('YYYY-MM-DD');
    const arrival = checkinDateTime.format('HH:mm');
    const returnTime = checkoutDateTime.format('HH:mm');

    router.push(`/zurich?startDate=${startDate}&endDate=${endDate}&arrival=${arrival}&return=${returnTime}`);
    
  };

  // const handleSearch = (e: { preventDefault: () => void }) => {
  //   e.preventDefault();
  //   if (!checkIn || !checkOut) return;
  //   const query = buildQueryString({
  //     startDate: formatDateForInput(checkIn),
  //     endDate: formatDateForInput(checkOut),
  //     arrival: checkInTime,
  //     return: checkOutTime,
  //   });
  //   router.push(`/zurich?${query}`);
  // };

  const advantages = [
    {
      iconPath:
        "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      title: "Bis 50% günstiger",
      desc: "Offizieller Flughafen-Parkplatz kostet mehr.",
    },
    {
      iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
      title: "Schneller Transfer",
      desc: "Nur 8 Minuten zum Terminal.",
    },
    {
      iconPath:
        "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      title: "Maximale Sicherheit",
      desc: "24/7 Videoüberwachung.",
    },
    {
      iconPath:
        "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      title: "Parkgarage",
      desc: "Wettergeschützt parken.",
    },
  ];

  const features = [
    {
      img: "/images/why-choose-us1.png",
      title: "Schneller Transfer",
      desc: "8 Minuten Transfer zu allen Terminals. Stressfrei und komfortabel.",
    },
    {
      img: "/images/why-choose-us2.png",
      title: "Wettergeschützte Parkgarage",
      desc: "Ihr Auto ist sicher vor Regen und Wetter in unserer überdachten Garage.",
    },
    {
      img: "/images/why-choose-us3.png",
      title: "Freundliches Personal",
      desc: "Unser Team hilft Ihnen gerne – beim Gepäck und bei Fragen.",
    },
    {
      img: "/images/why-choose-us4.png",
      title: "Maximale Sicherheit",
      desc: "Kameras, Videoüberwachung und Personal rund um die Uhr.",
    },
  ];

  const steps = [
    {
      tab: "Buchung",
      title: "Buchung",
      desc: "Auf unserer Webseite finden und buchen Sie Ihren Parkplatz zum besten Preis. Sichern Sie sich Ihre Reservierung.",
    },
    {
      tab: "Ankunft",
      title: "Ankunft",
      desc: "Fahren Sie direkt zur erhaltenen Adresse. Der Host empfängt Sie und bringt Sie zum Flughafen-Terminal.",
    },
    {
      tab: "Zum Flughafen",
      title: "Zum Flughafen",
      desc: "Ihr Host bringt Sie direkt zum Terminal des Flughafens Zürich. Nur 8 Minuten Fahrt.",
    },
    {
      tab: "Bei Rückkehr",
      title: "Bei Rückkehr",
      desc: "Nach Ihrer Reise kontaktieren Sie den Host. Er holt Sie am Flughafen ab und bringt Sie zurück zu Ihrem Auto.",
    },
  ];

  const addons = [
    {
      title: "Kindersitz",
      desc: "Kostenloser Kindersitz für Ihren Transfer.",
      price: "Gratis",
      iconPath:
        "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      title: "Grosses Gepäck",
      desc: "Transport von Ski, Golf-Taschen u.v.m.",
      price: "Gratis",
      iconPath:
        "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    },
    {
      title: "Fahrzeugwäsche",
      desc: "Professionelle Aussenreinigung bei Rückkehr.",
      price: "ab CHF 50",
      iconPath:
        "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
    },
  ];

  const faqs = [
    {
      q: "Wie lange dauert der Transfer zum Flughafen?",
      a: "Der Transfer dauert nur 8 Minuten. Unser Host bringt Sie direkt zum Terminal am Flughafen Zürich.",
    },
    {
      q: "Wie lange muss ich auf den Transfer warten?",
      a: "Unser Host ist bereit, sobald Sie ankommen. Kein Warten, sofort losfahren.",
    },
    {
      q: "Wann und wie oft findet ein Transfer statt?",
      a: "Wir bringen Sie individuell zum Flughafen. Sobald Sie beim Parkplatz ankommen, bringt der Host Sie direkt zum Terminal.",
    },
    {
      q: "Ist es ein Problem, wenn ich früher oder später ankomme?",
      a: "Nein, kein Problem. Kontaktieren Sie einfach den Host über die Telefonnummer in Ihrer Bestätigung.",
    },
    {
      q: "Wann muss ich für das Parken bezahlen?",
      a: "Die Bezahlung erfolgt online bei der Buchung. So ist alles erledigt, bevor Sie ankommen.",
    },
    {
      q: "Wie kann ich meine Reservierung stornieren?",
      a: "Mehr als 24 Stunden vorher: volle Rückerstattung. 12–24 Stunden: 50%. Weniger als 12 Stunden: keine Rückerstattung.",
    },
  ];

  const reviews = [
    {
      name: "Chris P.",
      text: "Sehr guter Service zu vernünftigen Preisen. Schnelle Abholung hin und zurück. Wir kommen wieder!",
    },
    {
      name: "David A.",
      text: "Erstaunlicher Parkservice. Sanfte, präzise und schnelle Erfahrung. Sehr zu empfehlen für Reisen ab Zürich.",
    },
    {
      name: "Yantar P.",
      text: "Tolle Erfahrung von Anfang bis Ende! Die Reservierung ist einfach. Das Personal ist überaus freundlich.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* ===== HERO ===== */}
      <section id="home" className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-10 md:py-16 lg:py-20">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-primary-50">
                <Image
                  src="/images/parking-1.png"
                  alt="Flughafen Zürich Parkplatz"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="absolute -bottom-3 -right-3 sm:bottom-4 sm:right-4 bg-white rounded-xl shadow-soft px-4 py-3 border border-primary-100">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-900">
                    4.9
                  </span>
                  <span className="text-xs text-gray-500">
                    • 1&apos;000+ Bewertungen
                  </span>
                </div>
              </div>
            </div>

            {/* Content + Search */}
            <div className="order-1 lg:order-2">
              <p className="text-sm font-medium text-primary-600 mb-2 uppercase tracking-wider">
                Nr. 1 am Flughafen Zürich
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Flughafen Zürich <br />
                Parking
              </h1>

              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-soft">
               <form onSubmit={handleSearch} className="space-y-4">
 <BookingDateTimePicker
        onChange={handleBookingChange}
        defaultCheckin={defaultCheckin}
        defaultCheckout={defaultCheckout}
      />

     
  <Button type="submit" className="w-full" size="lg">
    Preis prüfen
  </Button>
</form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ADVANTAGES BAR ===== */}
      <section className="border-y border-primary-50 bg-primary-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {advantages.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="shrink-0 text-primary-600">
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={item.iconPath}
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

     

      {/* ===== REVIEWS ===== */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-primary-600 uppercase tracking-wider mb-2">
              Nr. 1 auf TripAdvisor seit 6 Jahren
            </p>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={`review-star-${s}`}
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div
                key={r.name}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-soft"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {r.name}
                    </p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg
                          key={`${r.name}-star-${s}`}
                          className="h-3 w-3 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {r.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section id="about" className="py-14 md:py-20 bg-primary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10 text-center">
            Warum Elvario wählen?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {features.map((item) => (
              <div
                key={item.title}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-soft transition-shadow"
              >
                <div className="relative h-48 sm:h-56 bg-primary-50">
                  <Image
                    src={item.img}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LOCATION ===== */}
      <section id="location" className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Standort
            </h2>
            <p className="text-gray-500">Nur 8 Minuten zum Terminal.</p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-200 h-64 sm:h-80 lg:h-96 bg-primary-50 relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d43252.05870925658!2d8.51!3d47.45!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47900b7b3b0b5b5b%3A0x0!2zNDfCsDI3JzAwLjAiTiA4wrAzMCczNi4wIkU!5e0!3m2!1sde!2sch!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Elvario Standort"
            />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-14 md:py-20 bg-primary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
            So funktioniert&apos;s
          </h2>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {steps.map((step, idx) => (
              <button
                key={step.tab}
                onClick={() => setActiveStep(idx)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeStep === idx
                    ? "bg-primary-500 text-white shadow-blue-glow"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-primary-200"
                }`}
              >
                {step.tab}
              </button>
            ))}
          </div>
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-soft">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {steps[activeStep].title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {steps[activeStep].desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ADD-ONS ===== */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
            Zusatzleistungen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {addons.map((addon) => (
              <div
                key={addon.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-soft transition-shadow"
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-primary-50 rounded-2xl flex items-center justify-center">
                  <svg
                    className="h-7 w-7 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={addon.iconPath}
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {addon.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{addon.desc}</p>
                <span className="text-sm font-semibold text-primary-600">
                  {addon.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section className="py-14 md:py-20 bg-primary-50/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
            Über Uns
          </h2>
          <div className="space-y-4 text-gray-600 leading-relaxed text-sm sm:text-base">
            <p>
              Elvario wurde gegründet, um Reisenden eine einfache, günstige
              und sichere Möglichkeit zu bieten, ihr Auto in der Nähe des
              Flughafens Zürich zu parken.
            </p>
            <p>
              Mit über <strong>15&apos;000 Bewertungen</strong> und zahlreichen
              Auszeichnungen setzen wir auf aussergewöhnlichen Service und
              Kundenzufriedenheit. Persönlicher Service, faire Preise und eine
              wettergeschützte Garage.
            </p>
            <p>
              Unsere Hosts freuen sich, Sie kennenzulernen. Erleben Sie den
              Unterschied – buchen Sie noch heute!
            </p>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-14 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
            Häufig gestellte Fragen
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={faq.q}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-primary-50/50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 pr-4">
                    {faq.q}
                  </span>
                  <svg
                    className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="py-14 md:py-20 bg-primary-50/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Kontakt
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-soft">
              <svg
                className="h-8 w-8 text-primary-500 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <p className="text-xs text-gray-500 mb-1">Support-Hotline</p>
              <p className="text-sm font-semibold text-gray-900">
                +41 445453979
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-soft">
              <svg
                className="h-8 w-8 text-primary-500 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs text-gray-500 mb-1">E-Mail</p>
              <p className="text-sm font-semibold text-gray-900">
                info@elvario.ch
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
