'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ui-components/Themetoggle';
import LanguageSwitcher from '@/components/ui-components/LanguageSwitcher';
import {
  Shield,
  Eye,
  Lock,
  Database,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Clock,
  Copy,
  Check,
  Sparkles,
  Settings,
  History,
  MapPin
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacy');
  const [activeSection, setActiveSection] = useState('intro');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const sections = [
    {
      id: 'intro',
      num: '01',
      icon: Shield,
      title: t('sections.intro.title'),
      paragraphs: [t('sections.intro.p1'), t('sections.intro.p2')]
    },
    {
      id: 'account-data',
      num: '02',
      icon: UserCheck,
      title: t('sections.accountData.title'),
      paragraphs: [t('sections.accountData.p1'), t('sections.accountData.p2')]
    },
    {
      id: 'view-telemetry',
      num: '03',
      icon: Eye,
      title: t('sections.viewTelemetry.title'),
      paragraphs: [t('sections.viewTelemetry.p1'), t('sections.viewTelemetry.p2')],
      isSpecial: true
    },
    {
      id: 'messages',
      num: '04',
      icon: Lock,
      title: t('sections.messages.title'),
      paragraphs: [t('sections.messages.p1'), t('sections.messages.p2')]
    },
    {
      id: 'sharing',
      num: '05',
      icon: Database,
      title: t('sections.sharing.title'),
      paragraphs: [t('sections.sharing.p1'), t('sections.sharing.p2')]
    },
    {
      id: 'user-rights',
      num: '06',
      icon: CheckCircle2,
      title: t('sections.userRights.title'),
      paragraphs: [
        t('sections.userRights.p1'),
        t('sections.userRights.p2'),
        t('sections.userRights.p3')
      ]
    },
    {
      id: 'location-telemetry',
      num: '07',
      icon: MapPin,
      title: t('sections.locationTelemetry.title'),
      paragraphs: [
        t('sections.locationTelemetry.p1'),
        t('sections.locationTelemetry.p2'),
        t('sections.locationTelemetry.p3')
      ]
    },
    {
      id: 'contact',
      num: '08',
      icon: Mail,
      title: t('sections.contact.title'),
      paragraphs: [t('sections.contact.p1')]
    }
  ];

  // ScrollSpy to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
      }
    );

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('privacy@pocpoc.online');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-white transition-colors duration-200">
      
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 sm:h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="group flex items-baseline gap-1 text-2xl font-bold tracking-tight text-[var(--foreground)]"
            >
              <span>Poc</span>
              <span className="text-[var(--accent)] group-hover:italic transition-all">Poc</span>
            </Link>

            <span className="hidden sm:inline-block text-xs text-[var(--muted-foreground)] border-l border-[var(--border)] pl-4">
              {t('badge')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="toggle" />
            <ThemeToggle />
            <Link
              href="/login"
              className="text-xs font-medium px-4 py-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {t('login')}
            </Link>
          </div>

        </div>
      </header>

      {/* ─── HERO INTRO ─── */}
      <section className="max-w-6xl mx-auto px-6 pt-12 sm:pt-16 pb-8 border-b border-[var(--border)]">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>{t('badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--foreground)] leading-tight">
            {t('title')}
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted-foreground)] leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] pt-2">
            <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>{t('lastUpdated')}</span>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT ─── */}
      <main className="max-w-6xl mx-auto px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* ─── LEFT: CLEAN TABLE OF CONTENTS ─── */}
          <aside className="lg:col-span-4 hidden lg:block sticky top-28 space-y-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] pb-2 border-b border-[var(--border)]">
                {t('tableOfContents')}
              </h3>

              <nav className="space-y-1">
                {sections.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold'
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50'
                      }`}
                    >
                      <span className="truncate">{sec.title}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 ml-2" />
                      )}
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Quick action card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-[var(--foreground)] font-semibold">
                <Settings className="w-4 h-4 text-[var(--accent)]" />
                <span>Cài đặt quyền riêng tư</span>
              </div>
              <p className="text-[var(--muted-foreground)] leading-relaxed">
                Bạn có thể xem lại lịch sử xem bài viết và tùy chỉnh thông tin tài khoản bất kỳ lúc nào.
              </p>
              <div className="pt-2">
                <Link
                  href="/settings/history"
                  className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline font-medium"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{t('viewHistoryLink')}</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* ─── RIGHT: EDITORIAL SECTIONS ─── */}
          <div className="lg:col-span-8 space-y-10">
            {sections.map((sec) => {
              const isViewTelemetry = sec.id === 'view-telemetry';
              const isContact = sec.id === 'contact';

              return (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="scroll-mt-28 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-xs space-y-5"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-[var(--border)]">
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center shrink-0">
                      <sec.icon className="w-4 h-4" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                      {sec.title}
                    </h2>
                  </div>

                  <div className="space-y-4 text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
                    {sec.paragraphs.map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>

                  {/* Highlight box for View History in Section 3 */}
                  {isViewTelemetry && (
                    <div className="pt-2">
                      <div className="p-4 rounded-xl bg-[var(--accent-subtle)]/50 border border-[var(--accent)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-xs text-[var(--foreground)]">
                            Tự động xóa sau 90 ngày
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Lịch sử xem bài viết chỉ phục vụ chính bạn và hoàn toàn tự động xóa sạch sau 90 ngày.
                          </p>
                        </div>
                        <Link
                          href="/settings/history"
                          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-95 transition-opacity"
                        >
                          <span>{t('viewHistoryLink')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Contact box in Section 7 */}
                  {isContact && (
                    <div className="pt-2">
                      <div className="p-4 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-xs text-[var(--muted-foreground)]">
                          Email tiếp nhận ý kiến:
                          <span className="block text-sm font-semibold text-[var(--foreground)] mt-0.5">
                            privacy@pocpoc.online
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] transition-colors"
                        >
                          {copiedEmail ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500 font-medium">{t('copiedEmail')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                              <span>{t('copyEmail')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}

            {/* Bottom Footer Links */}
            <div className="pt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('backHome')}</span>
              </Link>
              <div className="flex items-center gap-3">
                <Link href="/about" className="hover:text-[var(--foreground)] transition-colors">
                  Giới thiệu
                </Link>
                <span>·</span>
                <span>&copy; {new Date().getFullYear()} PocPoc. Bảo lưu mọi quyền.</span>
              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}
