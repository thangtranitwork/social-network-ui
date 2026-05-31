'use client';

import { useTranslations } from 'next-intl';
import ThemeToggle from '@/components/ui-components/Themetoggle';
import LanguageSwitcher from '@/components/ui-components/LanguageSwitcher';

export default function DisplaySettings() {
  const t = useTranslations('settings');

  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
      <main className="flex-1 w-full p-8 space-y-6">
        <h1 className="text-2xl font-bold">{t('displayTitle')}</h1>

        <div className="bg-[var(--card)] p-6 rounded-xl shadow-sm border border-[var(--border)] space-y-6">
          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold">{t('theme')}</label>
            </div>
            <ThemeToggle />
          </div>

          <div className="h-px bg-[var(--border)]" />

          {/* Language switcher */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold">{t('language')}</label>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{t('languageDesc')}</p>
            </div>
            <LanguageSwitcher variant="toggle" />
          </div>

          <div className="h-px bg-[var(--border)]" />

          {/* Font size (coming soon) */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              {t('fontSize')}
            </label>
            <select
              name="fontSize"
              className="w-full bg-[var(--input)] text-[var(--foreground)] px-3 py-2 rounded-lg border border-[var(--border)]"
              defaultValue="medium"
              disabled
            >
              <option value="small">{t('fontSizeSmall')}</option>
              <option value="medium">{t('fontSizeMedium')}</option>
              <option value="large">{t('fontSizeLarge')}</option>
            </select>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              {t('fontSizeComingSoon')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
