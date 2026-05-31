"use client";

import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import api from "@/utils/axios";

export default function PrivacySettings() {
  const t = useTranslations('settings');
  const tPost = useTranslations('post');
  const tCommon = useTranslations('common');

  // General Privacy States
  const [privacy, setPrivacy] = useState({
    showFriends: true,
    defaultPostPrivacy: "friends",
    allowFriendRequest: true,
    emailVerified: true,
    isLocked: false,
  });

  // 2FA States
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading2FA, setLoading2FA] = useState(false);
  const [error2FA, setError2FA] = useState("");
  const [success2FA, setSuccess2FA] = useState("");

  // Load values
  useEffect(() => {
    const storedPrivacy = localStorage.getItem("defaultPrivacy");
    if (storedPrivacy) {
      setPrivacy((prev) => ({
        ...prev,
        defaultPostPrivacy: storedPrivacy,
      }));
    }
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      const res = await api.get("/v1/auth/2fa/status", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setIs2FAEnabled(res.data.body.isTwoFactorEnabled);
    } catch (err) {
      setError2FA(t('twoFactorLoadError'));
    }
  };

  const handleEnable2FA = async () => {
    setLoading2FA(true);
    setError2FA("");
    setSuccess2FA("");
    try {
      const res = await api.post("/v1/auth/2fa/generate", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setSecret(res.data.body.secret);
      setQrCodeUrl(res.data.body.url);
    } catch (err) {
      setError2FA(t('twoFactorGenError'));
    } finally {
      setLoading2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    setLoading2FA(true);
    setError2FA("");
    setSuccess2FA("");
    try {
      await api.post("/v1/auth/2fa/verify", { code }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setSuccess2FA(t('twoFactorSuccessEnable'));
      toast.success(t('twoFactorSuccessEnable'));
      setIs2FAEnabled(true);
      setSecret("");
      setQrCodeUrl("");
      setCode("");
    } catch (err) {
      setError2FA(t('twoFactorInvalidCode'));
      toast.error(t('twoFactorInvalidCode'));
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading2FA(true);
    setError2FA("");
    setSuccess2FA("");
    try {
      await api.post("/v1/auth/2fa/disable", { code }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setSuccess2FA(t('twoFactorSuccessDisable'));
      toast.success(t('twoFactorSuccessDisable'));
      setIs2FAEnabled(false);
      setCode("");
    } catch (err) {
      setError2FA(t('twoFactorInvalidCode'));
      toast.error(t('twoFactorInvalidCode'));
    } finally {
      setLoading2FA(false);
    }
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setPrivacy((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem("defaultPrivacy", privacy.defaultPostPrivacy);
    toast.success(t('privacySaveSuccess'));
  };

  return (
    <div className="space-y-8 w-full animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('privacy')}</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Quản lý bảo mật tài khoản và cài đặt quyền riêng tư bài viết của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Quyền riêng tư (Privacy Settings) */}
        <div className="bg-[var(--card-elevated)]/40 p-5 sm:p-6 rounded-2xl border border-[var(--border)] space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-base font-semibold border-b border-[var(--border)] pb-2">Quyền riêng tư</h2>
            
            {/* Quyền riêng tư mặc định của bài viết */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                {t('defaultPrivacyLabel')}
              </label>
              <select
                  name="defaultPostPrivacy"
                  value={privacy.defaultPostPrivacy}
                  onChange={handleChange}
                  className="w-full bg-[var(--background)] text-[var(--foreground)] px-4 py-2.5 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] text-sm cursor-pointer transition-all"
              >
                <option value="PUBLIC">{tPost('privacy.public')}</option>
                <option value="FRIEND">{tPost('privacy.friend')}</option>
                <option value="PRIVATE">{tPost('privacy.private')}</option>
              </select>
            </div>

            {/* Trạng thái xác minh email */}
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm font-medium text-[var(--muted-foreground)]">{t('emailVerified')}</span>
              <span
                  className={`text-sm font-semibold ${
                      privacy.emailVerified ? "text-green-600 dark:text-emerald-400" : "text-red-600"
                  }`}
              >
              {privacy.emailVerified ? t('verified') : t('notVerified')}
            </span>
            </div>

            {/* Trạng thái khóa tài khoản */}
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm font-medium text-[var(--muted-foreground)]">{t('accountLocked')}</span>
              <span
                  className={`text-sm font-semibold ${
                      privacy.isLocked ? "text-red-600" : "text-green-600 dark:text-emerald-400"
                  }`}
              >
              {privacy.isLocked ? tCommon('yes') : tCommon('no')}
            </span>
            </div>

            {/* Danh sách chặn */}
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                {t('viewBlockedLabel')}
              </span>
              <a
                  href="/settings/blockedlist"
                  className="text-sm text-[var(--accent)] hover:underline font-semibold"
              >
                {tCommon('seeAll')}
              </a>
            </div>
          </div>

          {/* Nút lưu */}
          <div className="pt-6 flex justify-end">
            <button
                onClick={handleSave}
                className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              {tCommon('save')}
            </button>
          </div>
        </div>

        {/* Column 2: Xác thực 2 lớp (Two-Factor Authentication - 2FA) */}
        <div className="bg-[var(--card-elevated)]/40 p-5 sm:p-6 rounded-2xl border border-[var(--border)] space-y-6">
          <h2 className="text-base font-semibold border-b border-[var(--border)] pb-2">{t('twoFactorAuth')}</h2>

          {/* 2FA Status Indicator */}
          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
            <span className="text-sm font-medium text-[var(--muted-foreground)]">{t('twoFactorStatus')}</span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                is2FAEnabled
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {is2FAEnabled ? t('twoFactorEnabled') : t('twoFactorDisabled')}
            </span>
          </div>

          {/* Error & Success Messages */}
          {error2FA && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/40 p-3 rounded-xl">{error2FA}</div>}
          {success2FA && <div className="text-sm text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 p-3 rounded-xl">{success2FA}</div>}

          {/* 2FA Actions */}
          {!is2FAEnabled && !secret && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Tăng cường bảo mật cho tài khoản của bạn bằng cách yêu cầu mã xác thực 6 chữ số mỗi khi đăng nhập từ thiết bị lạ.
              </p>
              <button
                onClick={handleEnable2FA}
                disabled={loading2FA}
                className="btn-primary w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading2FA ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{tCommon('loading')}</span>
                  </>
                ) : (
                  <span>{t('twoFactorEnableBtn')}</span>
                )}
              </button>
            </div>
          )}

          {secret && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-sm font-medium">{t('twoFactorScanPrompt')}</p>
              
              {/* QR Code Container */}
              <div className="flex justify-center p-4 bg-white rounded-2xl border border-[var(--border)] w-fit mx-auto shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                  alt="QR Code"
                  className="w-[160px] h-[160px]"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  Hoặc thiết lập thủ công với khóa: <code className="bg-[var(--background)] px-2 py-1 rounded border border-[var(--border)] font-mono text-xs font-bold text-[var(--accent)] select-all">{secret}</code>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t('twoFactorCodePlaceholder')}
                  className="flex-1 bg-[var(--background)] text-[var(--foreground)] px-4 py-2.5 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] font-mono tracking-widest text-center text-sm outline-none"
                  maxLength={6}
                />
                <button
                  onClick={handleVerify2FA}
                  disabled={loading2FA || code.length !== 6}
                  className="btn-primary disabled:opacity-50 whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
                >
                  {loading2FA ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <span>{t('twoFactorVerifyBtn')}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {is2FAEnabled && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Xác thực hai lớp (2FA) hiện đang được kích hoạt để bảo vệ tài khoản của bạn. Nhập mã bảo mật để tắt tính năng này.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t('twoFactorDisablePlaceholder')}
                  className="flex-1 bg-[var(--background)] text-[var(--foreground)] px-4 py-2.5 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] font-mono tracking-widest text-center text-sm outline-none"
                  maxLength={6}
                />
                <button
                  onClick={handleDisable2FA}
                  disabled={loading2FA || code.length !== 6}
                  className="btn-primary disabled:opacity-50 whitespace-nowrap bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
                >
                  {loading2FA ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <span>{t('twoFactorDisableBtn')}</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
