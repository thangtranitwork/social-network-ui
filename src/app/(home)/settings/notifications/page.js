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
      <main className="flex-1 w-full p-4 sm:p-8 text-center">
        <div className="animate-pulse text-[var(--muted-foreground)]">{tCommon('loading')}</div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
      <main className="flex-1 w-full p-4 sm:p-8 space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold">{t('notifications')}</h1>

        {message && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-md text-green-700 text-sm">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        <div className="bg-[var(--card)] p-4 sm:p-6 rounded-lg shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Email Notifications</div>
              <div className="text-sm text-[var(--muted-foreground)]">Receive notifications via email.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={preferences.emailNotifications} 
                onChange={() => handleToggle('emailNotifications')} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Push Notifications</div>
              <div className="text-sm text-[var(--muted-foreground)]">Receive push notifications on this device.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={preferences.pushNotifications} 
                onChange={() => handleToggle('pushNotifications')} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex flex-col space-y-2">
            <div>
              <div className="font-semibold">Notification Digest</div>
              <div className="text-sm text-[var(--muted-foreground)]">Receive a summary of notifications.</div>
            </div>
            <select
              name="digestFrequency"
              value={preferences.digestFrequency}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-[var(--background)] border border-[var(--border)]"
            >
              <option value="NONE">None</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full sm:w-auto bg-[var(--primary)] text-[var(--primary-foreground)] px-6 py-2 rounded-md ${
              saving ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
            }`}
          >
            {saving ? tCommon('saving') : tCommon('save')}
          </button>
        </div>
      </main>
    </div>
  );
}
