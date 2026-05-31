'use client';

import { useTranslations } from 'next-intl';
import ThemeToggle from '@/components/ui-components/Themetoggle';
import LanguageSwitcher from '@/components/ui-components/LanguageSwitcher';

export default function DisplaySettings() {
  const t = useTranslations('settings');

  return (
    <div className="space-y-8 w-full max-w-2xl animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('displayTitle')}</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Tùy chỉnh giao diện hiển thị và ngôn ngữ của ứng dụng.
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme toggle row */}
        <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[var(--card-elevated)]/40 border border-[var(--border)]">
          <div className="space-y-0.5">
            <div className="font-semibold text-sm">{t('theme')}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Chuyển đổi giữa chế độ sáng và tối.</div>
          </div>
          <ThemeToggle />
        </div>

        {/* Language switcher row */}
        <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[var(--card-elevated)]/40 border border-[var(--border)]">
          <div className="space-y-0.5">
            <div className="font-semibold text-sm">{t('language')}</div>
            <div className="text-xs text-[var(--muted-foreground)]">{t('languageDesc')}</div>
          </div>
          <LanguageSwitcher variant="toggle" />
        </div>

        {/* Font size row */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--card-elevated)]/40 border border-[var(--border)] space-y-3">
          <div className="space-y-0.5">
            <div className="font-semibold text-sm">{t('fontSize')}</div>
            <div className="text-xs text-[var(--muted-foreground)]">{t('fontSizeComingSoon')}</div>
          </div>
          <select
            name="fontSize"
            className="w-full bg-[var(--background)] text-[var(--foreground)] px-4 py-2.5 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] text-sm transition-all cursor-not-allowed opacity-60"
            defaultValue="medium"
            disabled
          >
            <option value="small">{t('fontSizeSmall')}</option>
            <option value="medium">{t('fontSizeMedium')}</option>
            <option value="large">{t('fontSizeLarge')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
