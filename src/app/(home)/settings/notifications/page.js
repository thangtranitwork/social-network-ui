"use client";

import { useState, useEffect } from "react";
import api from "@/utils/axios";
import { useTranslations } from "next-intl";

export default function NotificationsSettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const [preferences, setPreferences] = useState({
    emailNotifications: false,
    pushNotifications: false,
    digestFrequency: "NONE",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState(null);

  useEffect(() => {
    const tokenFromLocalStorage = localStorage.getItem("accessToken");
    setToken(tokenFromLocalStorage);
    const username = localStorage.getItem("userName");

    const fetchPreferences = async () => {
      try {
        const res = await api.get(`/v1/users/${username}`, {
          headers: { Authorization: `Bearer ${tokenFromLocalStorage}` },
        });
        if (res.data.code === 200) {
          setPreferences({
            emailNotifications: res.data.body.emailNotifications || false,
            pushNotifications: res.data.body.pushNotifications || false,
            digestFrequency: res.data.body.digestFrequency || "NONE",
          });
        } else {
          setError(res.data.message);
        }
      } catch (err) {
        setError("Could not load preferences.");
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleToggle = (field) => {
    setPreferences((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await api.patch(
        "/v1/users/update-notification-preferences",
        preferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Preferences updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Error updating preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
        <main className="flex-1 w-full p-4 sm:p-8 text-center flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
        </main>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-2xl animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('notifications')}</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Quản lý cách bạn nhận các thông báo từ hệ thống và bạn bè.
        </p>
      </div>

      {message && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 p-4 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
          <span className="text-emerald-500">✓</span> {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 p-4 rounded-xl text-red-800 dark:text-red-300 text-sm flex items-center gap-2">
          <span className="text-red-500">✗</span> {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Email notifications row */}
        <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[var(--card-elevated)]/40 border border-[var(--border)]">
          <div className="space-y-0.5">
            <div className="font-semibold text-sm">Email Notifications</div>
            <div className="text-xs text-[var(--muted-foreground)]">Receive notifications via email.</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={preferences.emailNotifications} 
              onChange={() => handleToggle('emailNotifications')} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
          </label>
        </div>

        {/* Push notifications row */}
        <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[var(--card-elevated)]/40 border border-[var(--border)]">
          <div className="space-y-0.5">
            <div className="font-semibold text-sm">Push Notifications</div>
            <div className="text-xs text-[var(--muted-foreground)]">Receive push notifications on this device.</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={preferences.pushNotifications} 
              onChange={() => handleToggle('pushNotifications')} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
          </label>
        </div>

        {/* Notification Digest */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--card-elevated)]/40 border border-[var(--border)] space-y-3">
          <div className="space-y-0.5">
            <div className="font-semibold text-sm">Notification Digest</div>
            <div className="text-xs text-[var(--muted-foreground)]">Receive a summary of notifications.</div>
          </div>
          <select
            name="digestFrequency"
            value={preferences.digestFrequency}
            onChange={handleChange}
            className="w-full bg-[var(--background)] text-[var(--foreground)] px-4 py-2.5 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 text-sm transition-all cursor-pointer"
          >
            <option value="NONE">None</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
        </div>

        {/* Save button */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{tCommon('saving')}</span>
              </>
            ) : (
              <span>{tCommon('save')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
