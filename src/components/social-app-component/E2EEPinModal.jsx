"use client";

import React, { useState, useEffect } from "react";
import { Lock, KeyRound, ShieldCheck, RefreshCw } from "lucide-react";
import { initializeUserKeys } from "@/utils/e2ee/x3dh";
import { createKeyBackup, restoreKeyFromBackup, autoSyncKeyBackup } from "@/utils/e2ee/pinBackup";
import { getItem } from "@/utils/e2ee/keyStore";
import api from "@/utils/axios";

export default function E2EEPinModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("SETUP"); // "SETUP" | "RESTORE"
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkE2EEStatus() {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) return;

      try {
        const backupDerivedKey = await getItem("identity_keys", "backup_derived_key");
        if (backupDerivedKey?.keyBytesBase64) {
          await initializeUserKeys();
          autoSyncKeyBackup();
          return;
        }

        const localKey = await initializeUserKeys();
        let hasBackupOnServer = false;
        try {
          const res = await api.get("/v1/chat/e2e/keys/status");
          hasBackupOnServer = !!res.data?.body?.hasBackup;
        } catch (apiErr) {
          console.warn("Failed to query e2e status from server:", apiErr);
        }

        if (!localKey && hasBackupOnServer) {
          setMode("RESTORE");
          setIsOpen(true);
        } else if (!hasBackupOnServer) {
          setMode("SETUP");
          setIsOpen(true);
        }
      } catch (err) {
        console.warn("Could not check E2EE status:", err);
      }
    }

    checkE2EEStatus();
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (pin.length < 6) {
      setError("Mã PIN phải có ít nhất 6 ký tự");
      return;
    }

    if (mode === "SETUP" && pin !== confirmPin) {
      setError("Mã PIN xác nhận không trùng khớp");
      return;
    }

    setLoading(true);
    try {
      if (mode === "SETUP") {
        await createKeyBackup(pin);
        localStorage.setItem("pocpoc_vault_v2_synced", "true");
        setIsOpen(false);
      } else {
        await restoreKeyFromBackup(pin);
        localStorage.setItem("pocpoc_vault_v2_synced", "true");
        setIsOpen(false);
        window.location.reload();
      }
    } catch (err) {
      setError(mode === "SETUP" ? "Không thể lưu mã PIN: " + err.message : "Mã PIN không đúng hoặc két sắt bị lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl dark:bg-blue-900/40 dark:text-blue-400">
            {mode === "SETUP" ? <Lock className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {mode === "SETUP" ? "Thiết lập mã PIN" : "Mở khóa tin nhắn"}
            </h2>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mã PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              maxLength={20}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-center text-xl tracking-widest text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              required
              autoFocus
            />
          </div>

          {mode === "SETUP" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Xác nhận mã PIN
              </label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••••"
                maxLength={20}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-center text-xl tracking-widest text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              {mode === "SETUP" ? "Kích hoạt" : "Mở khóa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
