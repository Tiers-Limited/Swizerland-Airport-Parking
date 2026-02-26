'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Extend Window for Google Translate globals
declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
          },
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit: () => void;
  }
}

interface GoogleTranslateProps {
  variant?: 'default' | 'compact';
  className?: string;
}

const languages = [
  { code: 'de', label: 'DE', flag: '🇩🇪' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
];

export default function GoogleTranslate({ variant = 'default', className }: GoogleTranslateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang');
  const [currentLang, setCurrentLang] = useState<string>(langParam === 'en' ? 'en' : 'de');

  // Initialize Google Translate
  useEffect(() => {
    // If already initialized, skip
    if (document.getElementById('google-translate-script')) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'de',
          includedLanguages: 'de,en',
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    // Inject CSS to hide Google Translate banner/frame
    const style = document.createElement('style');
    style.id = 'google-translate-styles';
    style.textContent = `
      /* Hide Google Translate top bar */
      .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame {
        display: none !important;
      }
      body { top: 0 !important; }
      .skiptranslate { display: none !important; }
      /* Prevent body shift from Google Translate */
      .goog-te-gadget { display: none !important; }
    `;
    document.head.appendChild(style);

    // Read language from URL param (priority) or localStorage
    const initialLang = langParam === 'en' ? 'en' : (localStorage.getItem('gTranslateLang') || 'de');
    if (initialLang === 'en') {
      setCurrentLang('en');
      // Wait for Google Translate to load, then apply
      const applyTimer = setInterval(() => {
        const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
        if (select) {
          select.value = 'en';
          select.dispatchEvent(new Event('change'));
          clearInterval(applyTimer);
        }
      }, 500);
      // Clear after 10s as safety net
      setTimeout(() => clearInterval(applyTimer), 10000);
    }
  }, [langParam]);

  const updateUrlParam = useCallback((langCode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (langCode === 'de') {
      params.delete('lang');
    } else {
      params.set('lang', langCode);
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const changeLanguage = useCallback((langCode: string) => {
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (!select) return;

    if (langCode === 'de') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
      localStorage.setItem('gTranslateLang', 'de');
      setCurrentLang('de');
      // Update URL then reload to reset Google Translate
      const params = new URLSearchParams(searchParams.toString());
      params.delete('lang');
      const qs = params.toString();
      window.location.href = `${pathname}${qs ? `?${qs}` : ''}`;
    } else {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
      localStorage.setItem('gTranslateLang', langCode);
      setCurrentLang(langCode);
      updateUrlParam(langCode);
    }
  }, [pathname, searchParams, updateUrlParam]);

  if (variant === 'compact') {
    return (
      <>
        <div id="google_translate_element" style={{ display: 'none' }} />
        <div className={cn('flex items-center gap-1 rounded-lg bg-gray-100 p-0.5', className)}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={cn(
                'px-2 py-1 rounded-md text-xs font-medium transition-all duration-200',
                currentLang === lang.code
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {lang.flag} {lang.label}
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div id="google_translate_element" style={{ display: 'none' }} />
      <div className={cn('flex items-center gap-1 rounded-xl bg-gray-50 p-1 border border-gray-200', className)}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => changeLanguage(lang.code)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              currentLang === lang.code
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            )}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
