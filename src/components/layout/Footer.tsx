'use client';
import Link from 'next/link';
import { Icon } from '../ui/Icons';


export default function Footer() {
  const currentYear = new Date().getFullYear();

  const navigation = {
    product: [
      { name: "So funktioniert's", href: '/how-it-works' },
      { name: 'Parkplatz suchen', href: '/zurich' },
      { name: 'Parking Host werden', href: '/host-registration' },
    //   { name: 'Pricing', href: '/pricing' },
    ],
    support: [
      { name: 'FAQ', href: '/faq' },
      { name: 'Kontaktieren Sie uns', href: '/contact' },
      { name: 'Hilfezentrum', href: '/help' },
    ],
    // company: [
    //   { name: 'About Us', href: '/about' },
    //   { name: 'For Hosts', href: '/host' },
    //   { name: 'Careers', href: '/careers' },
    // ],
    legal: [
      { name: 'AGB', href: '/terms' },
      { name: 'Datenschutz', href: '/privacy' },
      { name: 'Stornierungsrichtlinie', href: '/cancellation-policy' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo and tagline */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 relative">
                  <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                  >
                    <circle cx="20" cy="20" r="18" fill="#3B9AFF" />
                    <path
                      d="M14 12h7c3.5 0 6 2.5 6 6s-2.5 6-6 6h-4v6h-3V12zm3 9h4c1.5 0 3-1 3-3s-1.5-3-3-3h-4v6z"
                      fill="white"
                    />
                    <path
                      d="M28 8l3 2-8 4-2-1 7-5z"
                      fill="white"
                      opacity="0.8"
                    />
                  </svg>
                </div>
                <span className="font-bold text-xl text-white">Elvario</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Sicheres Parken am Flughafen Zürich mit persönlichem Transferservice.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Produkt</h3>
            <ul className="space-y-3">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-3">
              {navigation.support.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          {/* <div>
            <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div> */}

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Rechtliches</h3>
            <ul className="space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} ZurichPark. Alle Rechte vorbehalten.
            </p>
            <div className="flex items-center gap-4">
              {/* Social links */}
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Icon name="Twitter" className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Icon name="Linkedin" className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Icon name="Facebook" className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
