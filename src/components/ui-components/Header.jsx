"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import api, { clearSession } from "@/utils/axios";
import NewPostModal from "../social-app-component/CreatePostForm";
import useAppStore from "@/store/ZustandStore";
import LanguageSwitcher from "@/components/ui-components/LanguageSwitcher";
import { useTranslations } from "next-intl";


export default function Header({ }) {
  const router = useRouter();
  const [showPostModal, setShowPostModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const clearAllData = useAppStore(state => state.clearAllData);
  const t = useTranslations('post');

  return (
    <>
      <header
        className="w-full px-6 flex items-center justify-between bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] sticky top-0 z-50"
        style={{ height: "64px" }}
      >

        {/* Left/Center - Logo */}
        <div className="flex items-center">
          <Link href="/home" className="logo-brand">
            poc<span className="logo-accent">poc</span>
          </Link>
        </div>

        <div className="flex justify-end items-center gap-4">
          {/* Language switcher */}
          <LanguageSwitcher variant="toggle" />

          {/* Create post button */}
          <button
            type="button"
            aria-label="Add"
            onClick={() => setShowPostModal(true)}
            className="btn-primary"
            disabled={isLoggingOut}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{t('create')}</span>
          </button>
        </div>
      </header>


      {/* 📌 Modal tạo bài viết */}
      {showPostModal && !isLoggingOut && (
        <NewPostModal
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
        />
      )}
    </>
  );
}