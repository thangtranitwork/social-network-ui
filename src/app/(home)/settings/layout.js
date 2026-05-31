"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import MotionContainer from "@/components/ui-components/MotionContainer";
import {
  UserCircle, Lock, Ban, Sun, ArrowLeft, Shield, Bell,
} from "lucide-react";
import {pageMetadata, usePageMetadata} from "@/utils/clientMetadata";
import { useTranslations } from "next-intl";

export default function SettingsLayout({ children }) {
  const t = useTranslations('settings');
  const pathname = usePathname();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  usePageMetadata(pageMetadata.settings());

  const groupedMenuItems = [
    {
      title: t('account'),
      items: [
        { id: "personalinfo", icon: UserCircle, label: t('personalInfo') },
        { id: "privacy", icon: Lock, label: t('privacy') },
        { id: "notifications", icon: Bell, label: t('notifications') },
      ]
    },
    {
      title: t('interaction'),
      items: [
        { id: "blockedlist", icon: Ban, label: t('blockedList') },
      ]
    },
    {
      title: t('displaySection'),
      items: [
        { id: "display", icon: Sun, label: t('display') },
      ]
    },
    {
      title: t('version', { version: '2.0.0' }),
      items: []
    }
  ];

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Handle mobile navigation
  useEffect(() => {
    if (isMobile) {
      // If we're on a specific settings page, hide sidebar
      const isOnSettingsSubpage = pathname !== '/settings' && pathname.startsWith('/settings/');
      setShowSidebar(!isOnSettingsSubpage);
    } else {
      // Always show sidebar on desktop
      setShowSidebar(true);
    }
  }, [pathname, isMobile]);

  const handleBackToSidebar = () => {
    if (isMobile) {
      router.push('/settings');
    }
  };

  const getCurrentPageTitle = () => {
    for (const group of groupedMenuItems) {
      for (const item of group.items) {
        if (pathname.endsWith(item.id)) {
          return item.label;
        }
      }
    }
    return t('title');
  };

  return (
      <div className="flex flex-col md:flex-row w-full bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden min-h-[600px]">
        {/* Sidebar */}
        <aside className={`
        ${isMobile ? (showSidebar ? 'w-full' : 'hidden') : 'w-[260px]'} 
        border-r border-[var(--border)] p-6
        ${isMobile ? 'fixed inset-0 z-10 bg-[var(--card)]' : 'bg-[var(--card-elevated)]/30'}
      `}>
          <h2 className="text-sm text-[var(--muted-foreground)] font-semibold mb-6">
            {t('title')}
          </h2>
          <nav className="space-y-6">
            {groupedMenuItems.map((group, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-2">
                    {group.title}
                  </h3>
                  {group.items.map((item, subIdx) => (
                      <Link
                          key={subIdx}
                          href={`/settings/${item.id}`}
                          className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-all ${
                              pathname.endsWith(item.id) ? "bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold" : "text-[var(--muted-foreground)]"
                          } ${isMobile ? 'py-4' : 'py-2'}`}
                          onClick={() => {
                            if (isMobile) {
                              setShowSidebar(false);
                            }
                          }}
                      >
                        <item.icon className={`w-5 h-5 ${pathname.endsWith(item.id) ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]"}`} />
                        <span className={`font-medium ${isMobile ? 'text-base' : 'text-sm'}`}>
                    {item.label}
                  </span>
                      </Link>
                  ))}
                </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className={`
        flex-1 space-y-6
        ${isMobile ? (showSidebar ? 'hidden' : 'w-full p-4') : 'p-8'}
      `}>
          {/* Mobile header with back button */}
          {isMobile && !showSidebar && (
              <div className="flex items-center gap-4 pb-4 border-b border-[var(--border)] mb-6">
                <button
                    onClick={handleBackToSidebar}
                    className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold text-[var(--foreground)]">
                  {getCurrentPageTitle()}
                </h1>
              </div>
          )}

          <MotionContainer modeKey={pathname} effect="fadeUp" duration={0.25}>
            {children}
          </MotionContainer>
        </main>
      </div>
  );
}
