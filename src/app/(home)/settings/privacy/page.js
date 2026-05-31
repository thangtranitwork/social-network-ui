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
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] animate-fadeIn">
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 space-y-8">
        <h1 className="text-2xl font-bold">{t('privacy')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1: Quyền riêng tư (Privacy Settings) */}
          <div className="bg-[var(--card)] p-6 rounded-lg shadow-md space-y-6 border border-[var(--border)]">
            <h2 className="text-lg font-bold border-b border-[var(--border)] pb-2">Quyền riêng tư</h2>
            
            {/* Quyền riêng tư mặc định của bài viết */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--muted-foreground)]">
                {t('defaultPrivacyLabel')}
              </label>
              <select
                  name="defaultPostPrivacy"
                  value={privacy.defaultPostPrivacy}
                  onChange={handleChange}
                  className="w-full bg-[var(--input)] text-[var(--foreground)] px-3 py-2 rounded-md border border-[var(--border)] focus:outline-none focus:border-blue-500"
              >
                <option value="PUBLIC">{tPost('privacy.public')}</option>
                <option value="FRIEND">{tPost('privacy.friend')}</option>
                <option value="PRIVATE">{tPost('privacy.private')}</option>
              </select>
            </div>

            {/* Trạng thái xác minh email */}
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm font-semibold text-[var(--muted-foreground)]">{t('emailVerified')}</span>
              <span
                  className={`text-sm font-medium ${
                      privacy.emailVerified ? "text-green-600" : "text-red-600"
                  }`}
              >
              {privacy.emailVerified ? t('verified') : t('notVerified')}
            </span>
            </div>

            {/* Trạng thái khóa tài khoản */}
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm font-semibold text-[var(--muted-foreground)]">{t('accountLocked')}</span>
              <span
                  className={`text-sm font-medium ${
                      privacy.isLocked ? "text-red-600" : "text-green-600"
                  }`}
              >
              {privacy.isLocked ? tCommon('yes') : tCommon('no')}
            </span>
            </div>

            {/* Danh sách chặn */}
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm font-semibold text-[var(--muted-foreground)]">
                {t('viewBlockedLabel')}
              </span>
              <a
                  href="/settings/blockedlist"
                  className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
              >
                {tCommon('seeAll')}
              </a>
            </div>

            {/* Nút lưu */}
            <div className="pt-4">
              <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
              >
                {tCommon('save')}
              </button>
            </div>
          </div>

          {/* Column 2: Xác thực 2 lớp (Two-Factor Authentication - 2FA) */}
          <div className="bg-[var(--card)] p-6 rounded-lg shadow-md space-y-6 border border-[var(--border)]">
            <h2 className="text-lg font-bold border-b border-[var(--border)] pb-2">{t('twoFactorAuth')}</h2>

            {/* 2FA Status Indicator */}
            <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
              <span className="text-sm font-semibold text-[var(--muted-foreground)]">{t('twoFactorStatus')}</span>
              <span
                className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                  is2FAEnabled
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {is2FAEnabled ? t('twoFactorEnabled') : t('twoFactorDisabled')}
              </span>
            </div>

            {/* Error & Success Messages */}
            {error2FA && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/55 p-3 rounded-md">{error2FA}</div>}
            {success2FA && <div className="text-sm text-green-500 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/55 p-3 rounded-md">{success2FA}</div>}

            {/* 2FA Actions */}
            {!is2FAEnabled && !secret && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Tăng cường bảo mật cho tài khoản của bạn bằng cách yêu cầu mã xác thực 6 chữ số mỗi khi đăng nhập từ thiết bị lạ.
                </p>
                <button
                  onClick={handleEnable2FA}
                  disabled={loading2FA}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition disabled:opacity-50 font-medium"
                >
                  {loading2FA ? tCommon('loading') : t('twoFactorEnableBtn')}
                </button>
              </div>
            )}

            {secret && (
              <div className="space-y-4 animate-fadeIn">
                <p className="text-sm font-medium">{t('twoFactorScanPrompt')}</p>
                
                {/* QR Code Container */}
                <div className="flex justify-center p-4 bg-white rounded-lg border border-[var(--border)] w-fit mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                    alt="QR Code"
                    className="w-[180px] h-[180px]"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Hoặc thiết lập thủ công với khóa: <code className="bg-[var(--muted)] px-2 py-1 rounded font-mono text-sm font-bold text-blue-600 dark:text-blue-400 select-all">{secret}</code>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t('twoFactorCodePlaceholder')}
                    className="flex-1 bg-[var(--input)] text-[var(--foreground)] px-3 py-2 rounded-md border border-[var(--border)] focus:outline-none focus:border-blue-500 font-mono tracking-widest text-center"
                    maxLength={6}
                  />
                  <button
                    onClick={handleVerify2FA}
                    disabled={loading2FA || code.length !== 6}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition disabled:opacity-50 font-medium whitespace-nowrap"
                  >
                    {loading2FA ? tCommon('loading') : t('twoFactorVerifyBtn')}
                  </button>
                </div>
              </div>
            )}

            {is2FAEnabled && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Xác thực hai lớp (2FA) hiện đang được kích hoạt để bảo vệ tài khoản của bạn. Nhập mã bảo mật để tắt tính năng này.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t('twoFactorDisablePlaceholder')}
                    className="flex-1 bg-[var(--input)] text-[var(--foreground)] px-3 py-2 rounded-md border border-[var(--border)] focus:outline-none focus:border-blue-500 font-mono tracking-widest text-center"
                    maxLength={6}
                  />
                  <button
                    onClick={handleDisable2FA}
                    disabled={loading2FA || code.length !== 6}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition disabled:opacity-50 font-medium whitespace-nowrap"
                  >
                    {loading2FA ? tCommon('loading') : t('twoFactorDisableBtn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
