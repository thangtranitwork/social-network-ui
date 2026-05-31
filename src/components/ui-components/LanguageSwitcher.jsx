'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setLocaleAction } from '@/utils/localeActions';

const locales = ['vi', 'en'];
const localeLabels = { vi: 'Tiếng Việt', en: 'English' };
const localeFlags = { vi: '🇻🇳', en: '🇺🇸' };
const COOKIE_NAME = 'NEXT_LOCALE';

function getCookieLocale() {
  if (typeof document === 'undefined') return 'vi';
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  const val = match?.[2];
  return locales.includes(val) ? val : 'vi';
}

/**
 * LanguageSwitcher - cookie-based, no URL prefix change
 * variant: 'toggle' (VI|EN pill) | 'dropdown' (full dropdown)
 */
export default function LanguageSwitcher({ variant = 'dropdown' }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('vi'); // Always default to 'vi' for server match
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentLocale(getCookieLocale());
  }, []);

  const handleLocaleChange = (locale) => {
    setIsOpen(false);
    startTransition(async () => {
      await setLocaleAction(locale);
      setCurrentLocale(locale);
      router.refresh();
    });
  };

  if (variant === 'toggle') {
    return (
      <div className="flex items-center gap-0.5 rounded-full border border-[var(--border)] p-0.5 bg-[var(--muted)]">
        {locales.map((locale) => {
          const isActive = mounted && currentLocale === locale;
          return (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              disabled={isPending}
              aria-label={`Switch to ${localeLabels[locale]}`}
              className={[
                'px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200',
                isActive
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                isPending ? 'opacity-50 cursor-wait' : '',
              ].join(' ')}
            >
              {locale.toUpperCase()}
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select language"
        className={[
          'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
          'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]',
          'hover:bg-[var(--muted)] transition-all duration-200',
          isPending ? 'opacity-50 cursor-wait' : '',
        ].join(' ')}
      >
        <span className="text-base">{mounted ? localeFlags[currentLocale] : localeFlags['vi']}</span>
        <span>{mounted ? localeLabels[currentLocale] : localeLabels['vi']}</span>
        <svg
          className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
        {isPending && (
          <span className="w-3.5 h-3.5 border-2 border-[var(--border)] border-t-[var(--foreground)] rounded-full animate-spin" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            role="listbox"
            className="absolute right-0 mt-2 w-44 z-50 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden"
            style={{ animation: 'scaleIn 0.15s ease-out' }}
          >
            {locales.map((locale) => {
              const isSelected = mounted && currentLocale === locale;
              return (
                <button
                  key={locale}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleLocaleChange(locale)}
                  disabled={isPending}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors duration-150',
                    isSelected
                      ? 'bg-[var(--accent-subtle,#f0fdf4)] text-[var(--accent,#00b36b)] font-semibold'
                      : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
                  ].join(' ')}
                >
                  <span className="text-base">{localeFlags[locale]}</span>
                  <span>{localeLabels[locale]}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
