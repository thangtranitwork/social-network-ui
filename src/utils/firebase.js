export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

export const VAPID_KEY = (process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "").trim();

let appInstance = null;
let messagingInstance = null;

export const getFirebaseApp = async () => {
  if (appInstance) return appInstance;
  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return appInstance;
  } catch (err) {
    console.warn("⚠️ firebase/app module error:", err?.message || err);
    return null;
  }
};

export const getFirebaseMessaging = async () => {
  if (typeof window === "undefined") return null;
  if (messagingInstance) return messagingInstance;

  try {
    const app = await getFirebaseApp();
    if (!app) return null;

    const { getMessaging, isSupported } = await import("firebase/messaging");
    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    }
  } catch (err) {
    console.warn("⚠️ Firebase Messaging is not supported in this browser:", err?.message || err);
  }
  return null;
};

/**
 * Request Notification Permission and return FCM Token
 */
export const requestFCMToken = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.log("ℹ️ Push notifications are not supported by browser");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("⚠️ Notification permission was denied");
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn("⚠️ Firebase Messaging instance unavailable");
      return null;
    }

    const { getToken } = await import("firebase/messaging");

    // Register dedicated Firebase Messaging Service Worker
    const swParams = new URLSearchParams({
      apiKey: firebaseConfig.apiKey || "",
      authDomain: firebaseConfig.authDomain || "",
      projectId: firebaseConfig.projectId || "",
      storageBucket: firebaseConfig.storageBucket || "",
      messagingSenderId: firebaseConfig.messagingSenderId || "",
      appId: firebaseConfig.appId || "",
      measurementId: firebaseConfig.measurementId || ""
    }).toString();

    let fcmReg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    if (!fcmReg) {
      fcmReg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swParams}`, { scope: "/" });
    }

    await navigator.serviceWorker.ready;

    // Clear stale subscription if present to ensure clean VAPID registration
    try {
      const existingSub = await fcmReg.pushManager.getSubscription();
      if (existingSub) {
        console.log("🧹 Clearing existing PushSubscription for clean FCM token generation...");
        await existingSub.unsubscribe();
      }
    } catch (e) {
      console.warn("ℹ️ Could not check/clear push subscription:", e);
    }

    let currentToken = null;

    // Try 1: With provided VAPID Key
    try {
      currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: fcmReg,
      });
    } catch (err1) {
      console.warn("⚠️ getToken with VAPID_KEY failed:", err1?.message || err1);
    }

    // Try 2: Without explicit VAPID Key (use default project key)
    if (!currentToken) {
      try {
        currentToken = await getToken(messaging, {
          serviceWorkerRegistration: fcmReg,
        });
      } catch (err2) {
        console.warn("⚠️ getToken without VAPID_KEY failed:", err2?.message || err2);
      }
    }

    if (currentToken) {
      console.log("🔥 FCM Token obtained successfully:", currentToken);
      return currentToken;
    }

    console.error("❌ All FCM getToken attempts failed with Push Service Error. Check VAPID key pair in Firebase Console or Browser Push Service settings.");
    return null;
  } catch (err) {
    console.error("❌ FCM Token retrieval error:", err?.message || err);
    return null;
  }
};

/**
 * Register foreground message listener
 */
export const onForegroundMessage = async (callback) => {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return () => {};

    const { onMessage } = await import("firebase/messaging");
    return onMessage(messaging, (payload) => {
      console.log("📩 Received foreground FCM message:", payload);
      if (callback) {
        callback(payload);
      }
    });
  } catch (err) {
    console.warn("⚠️ Failed to register onForegroundMessage listener:", err?.message || err);
    return () => {};
  }
};
