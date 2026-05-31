import React from "react";
import Link from "next/link";
import {
  UserCircle,
  Bell,
  Lock,
  Users,
  Ban,
  MessageCircle,
  FileText,
  Flag,
  ShieldCheck,
  Mail,
  Database,
  MessageSquare,
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
        { id: "restrictedaccounts", icon: ShieldCheck, label: t('restrictedAccounts') },
      ]
    },
    {
      title: t('interaction'),
      items: [
        { id: "connections", icon: Users, label: t('connections') },
        { id: "blockedlist", icon: Ban, label: t('blockedList') },
        { id: "sentreports", icon: Flag, label: t('sentReports') },
      ]
    },
    {
      title: t('content'),
      items: [
        { id: "savedposts", icon: FileText, label: t('savedPosts') },
        { id: "uploadedfiles", icon: Database, label: t('uploadedFiles') },
      ]
    },
    {
      title: t('notifications'),
      items: [
        { id: "messages", icon: MessageCircle, label: t('messages') },
        { id: "groupchatactivity", icon: MessageSquare, label: t('groupChatActivity') },
        { id: "notifications", icon: Mail, label: t('notifications') },
      ]
    }
    ];

  return (
    <div className="flex flex-col w-full bg-[var(--background)] text-[var(--foreground)] p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groupedMenuItems.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-2">
              {group.title}
            </h2>
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/settings/${item.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-[var(--accent)] transition-colors border-b last:border-0 border-[var(--border)]"
                >
                  <item.icon className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

