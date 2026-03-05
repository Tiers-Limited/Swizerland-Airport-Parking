'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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

/**
 * Wait for the Google Translate combo box to appear in the DOM.
 * Returns the <select> element or null after timeout.
 */
function waitForGoogleCombo(timeoutMs = 8000): Promise<HTMLSelectElement | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (existing) { resolve(existing); return; }

    const interval = setInterval(() => {
      const el = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (el) { clearInterval(interval); resolve(el); }
    }, 300);

    setTimeout(() => { clearInterval(interval); resolve(null); }, timeoutMs);
  });
}

export default function GoogleTranslate({ variant = 'default', className }: GoogleTranslateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang');
  // Initialize deterministically for server render; update from localStorage on mount
  const [currentLang, setCurrentLang] = useState<string>(
    () => (langParam === 'en' ? 'en' : 'de')
  );
  const [switching, setSwitching] = useState(false);
  const initializedRef = useRef(false);

  // Initialize Google Translate script (once)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // If script already in DOM, skip
    if (document.getElementById('google-translate-script')) return;

    const containerId = 'google_translate_element_root';
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'de',
          includedLanguages: 'de,en',
          autoDisplay: false,
        },
        containerId
      );
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    // Inject CSS to hide Google Translate banner/frame
    if (!document.getElementById('google-translate-styles')) {
      const style = document.createElement('style');
      style.id = 'google-translate-styles';
      style.textContent = `
        .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame {
          display: none !important;
        }
        body { top: 0 !important; }
        .skiptranslate { display: none !important; }
        .goog-te-gadget { display: none !important; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // We only ever need a single container appended to <body>.  Keeping it
  // around across mounts avoids race conditions with the Google script
  // manipulating / removing it while React is unmounting.
  //
  // The module-level variable ensures the container is created once and
  // reused for every <GoogleTranslate> instance.

  useEffect(() => {
    const containerId = 'google_translate_element_root';
    let container = document.getElementById(containerId) as HTMLDivElement | null;
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.display = 'none';
      document.body.appendChild(container);
    }

    // no cleanup: keeping the element in the DOM prevents the Google script
    // from ever trying to remove a node that React already removed.
  }, []);

  // On mount, apply saved language after Google Translate loads
  useEffect(() => {
    const savedLang = langParam === 'en' ? 'en' : (localStorage.getItem('gTranslateLang') || 'de');
    if (savedLang === 'en') {
      waitForGoogleCombo().then((select) => {
        if (select) {
          select.value = 'en';
          select.dispatchEvent(new Event('change'));
        }
      });
    }
    setCurrentLang(savedLang);
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeLanguage = useCallback(async (langCode: string) => {
    if (langCode === currentLang || switching) return;
    setSwitching(true);

    try {
      if (langCode === 'de') {
        // Clear Google Translate cookies to restore original language
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
        localStorage.setItem('gTranslateLang', 'de');
        setCurrentLang('de');

        // Build clean URL without lang param
        const params = new URLSearchParams(searchParams.toString());
        params.delete('lang');
        const qs = params.toString();
        // Reload to fully reset Google Translate state
        window.location.href = `${pathname}${qs ? `?${qs}` : ''}`;
      } else {
        // Switch to EN
        const select = await waitForGoogleCombo();
        if (select) {
          select.value = langCode;
          select.dispatchEvent(new Event('change'));
        }
        localStorage.setItem('gTranslateLang', langCode);
        setCurrentLang(langCode);

        // Update URL param
        const params = new URLSearchParams(searchParams.toString());
        params.set('lang', langCode);
        const qs = params.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
        setSwitching(false);
      }
    } catch {
      setSwitching(false);
    }
  }, [currentLang, switching, pathname, searchParams, router]);

  const buttonContent = (lang: typeof languages[number], isActive: boolean) => (
    <button
      key={lang.code}
      type="button"
      
      disabled={switching && lang.code !== currentLang}
      onClick={() => changeLanguage(lang.code)}
      className={cn(
        variant === 'compact'
          ? 'px-2 py-1 rounded-md text-xs font-medium transition-all duration-200'
          : 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
        isActive
          ? variant === 'compact'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'bg-white text-gray-900 shadow-sm border border-gray-200'
          : variant === 'compact'
            ? 'text-gray-500 hover:text-gray-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50',
        switching && lang.code !== currentLang && 'opacity-50 cursor-wait'
      )}
    >
      <span className={variant === 'compact' ? '' : 'text-base'}>{lang.flag}</span>
      {variant !== 'compact' && ' '}
      <span>{lang.label}</span>
    </button>
  );

  return (
    <>
      {/* Google Translate mounts into a container appended to document.body (not inside React tree) */}
      <div className={cn(
        variant === 'compact'
          ? 'flex items-center gap-1 rounded-lg bg-gray-100 p-0.5'
          : 'flex items-center gap-1 rounded-xl bg-gray-50 p-1 border border-gray-200',
        className
      )}>
        {languages.map((lang) => buttonContent(lang, currentLang === lang.code))}
      </div>
    </>
  );
}
