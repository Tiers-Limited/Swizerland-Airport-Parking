'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Logo, Button, GoogleTranslate } from '@/components/ui';
import { cn, getInitials, getFirstName } from '@/lib/utils';
import { Icon } from '../ui/Icons';

interface HeaderProps {
  transparent?: boolean;
}

export default function Header({ transparent = false }: Readonly<HeaderProps>) {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Startseite', href: '/#home' },
    { name: "So funktioniert's", href: '/#how-it-works' },
    { name: 'Über uns', href: '/#about' },
    { name: 'Standort', href: '/#location' },
    { name: 'FAQ', href: '/#faq' },
    { name: 'Kontakt', href: '/#contact' },
  ];

  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        transparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-sm shadow-soft'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Logo size="lg" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'text-baby-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            <GoogleTranslate variant="compact" />
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-baby-blue-100 flex items-center justify-center text-baby-blue-600 font-medium text-sm">
                    {getInitials(user?.name)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {getFirstName(user?.name)}
                  </span>
                  <Icon name="ChevronDown" className="h-4 w-4 text-gray-400" />
                </button>

                {isProfileMenuOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-10 cursor-default bg-transparent border-none"
                      onClick={() => setIsProfileMenuOpen(false)}
                      onKeyDown={(e) => { if (e.key === 'Escape') setIsProfileMenuOpen(false); }}
                      aria-label="Close menu"
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-medium border border-gray-100 py-2 z-20">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      {user?.role !== 'host' && user?.role !== 'admin' && user?.role !== 'super_admin' && (
                        <>
                          <Link
                            href="/account"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Mein Konto
                          </Link>
                          <Link
                            href="/account/bookings"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Meine Buchungen
                          </Link>
                          <Link
                            href="/account/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Einstellungen
                          </Link>
                        </>
                      )}
                      {user?.role === 'host' && (
                        <Link
                          href="/host"
                          className="block px-4 py-2 text-sm text-baby-blue-600 hover:bg-gray-50 font-medium"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Host Portal
                        </Link>
                      )}
                      {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-50 font-medium"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Admin Portal
                        </Link>
                      )}
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-error-600 hover:bg-gray-50"
                        >
                          Abmelden
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    <span >Anmelden</span>
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm"><span >Jetzt starten</span></Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <Icon name="X" className="h-6 w-6 text-gray-600" />
            ) : (
              <Icon name="Menu" className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-baby-blue-50 text-baby-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                  
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  {user?.role !== 'host' && user?.role !== 'admin' && user?.role !== 'super_admin' && (
                    <>
                      <Link
                        href="/account"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        Mein Konto
                      </Link>
                      <Link
                        href="/account/bookings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        Meine Buchungen
                      </Link>
                      <Link
                        href="/account/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        Einstellungen
                      </Link>
                    </>
                  )}
                  {user?.role === 'host' && (
                    <Link
                      href="/host"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-baby-blue-600 hover:bg-gray-50 rounded-lg"
                    >
                      Host Portal
                    </Link>
                  )}
                  {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-gray-50 rounded-lg"
                    >
                      Admin Portal
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-error-600 hover:bg-gray-50 rounded-lg text-left"
                  >
                    Abmelden
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 pb-2">
                    <GoogleTranslate variant="compact" />
                  </div>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full"><span >Anmelden</span></Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full"><span >Jetzt starten</span></Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
