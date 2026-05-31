"use client";

import React from "react";
import Link from "next/link";
import {
  UserCircle,
  Bell,
  Lock,
  Ban,
  Sun,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function SettingsOverview() {
  const t = useTranslations('settings');

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
    }
  ];

  return (
    <div className="space-y-8 w-full max-w-2xl animate-fadeIn p-2 sm:p-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Chọn một mục cài đặt từ danh sách dưới đây để bắt đầu thiết lập.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {groupedMenuItems.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-3">
            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-1">
              {group.title}
            </h2>
            <div className="bg-[var(--card-elevated)]/40 rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/settings/${item.id}`}
                  className="flex items-center gap-3 p-4 text-[var(--foreground)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)] transition-all duration-200"
                >
                  <item.icon className="w-5 h-5 text-[var(--accent)] shrink-0" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
