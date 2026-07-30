"use client";

import { useEffect, useState, useCallback } from "react";
import { requestFCMToken, onForegroundMessage } from "@/utils/firebase";
import toast from "react-hot-toast";
import axios from "@/utils/axios";

export default function useFCM(userId) {
  const [fcmToken, setFcmToken] = useState(null);
  const [permission, setPermission] = useState("default");

  // Send token to Go Backend API
  const sendTokenToBackend = async (token) => {
    if (!token || !userId) return;
    try {
      await axios.post("/v1/notifications/fcm-token", {
        userId,
        fcmToken: token,
        deviceType: "WEB"
      });
      console.log("✅ FCM token registered on backend server");
    } catch (err) {
      console.warn("⚠️ Failed to send FCM token to backend:", err?.message || err);
    }
  };

  const initializeFCM = useCallback(async () => {
    if (typeof window === "undefined") return;

    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    const token = await requestFCMToken();
    if (token) {
      setFcmToken(token);
      await sendTokenToBackend(token);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    initializeFCM();

    // Listen to foreground FCM messages
    let unsubscribeForeground = null;
    onForegroundMessage((payload) => {
      console.log("🔥 Foreground FCM Notification payload:", payload);
      const title = payload.notification?.title || payload.data?.title || "Thông báo";
      const body = payload.notification?.body || payload.data?.body || "";

      toast(`${title}: ${body}`, {
        icon: "🔔",
        duration: 5000,
      });
    }).then((unsub) => {
      unsubscribeForeground = unsub;
    });

    return () => {
      if (typeof unsubscribeForeground === "function") {
        unsubscribeForeground();
      }
    };
  }, [userId, initializeFCM]);

  return {
    fcmToken,
    permission,
    requestToken: initializeFCM
  };
}
