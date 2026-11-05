const DB_NAME = "pocpoc_e2ee_store";
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("identity_keys")) {
          db.createObjectStore("identity_keys", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("pre_keys")) {
          db.createObjectStore("pre_keys", { keyPath: "keyId" });
        }
        if (!db.objectStoreNames.contains("signed_pre_keys")) {
          db.createObjectStore("signed_pre_keys", { keyPath: "keyId" });
        }
        if (!db.objectStoreNames.contains("sessions")) {
          db.createObjectStore("sessions", { keyPath: "sessionId" }); // "<userId>:<deviceId>"
        }
        if (!db.objectStoreNames.contains("sender_keys")) {
          db.createObjectStore("sender_keys", { keyPath: "id" }); // "<chatId>:<senderId>"
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

export async function setItem(storeName, item) {
  const db = await getDB();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getItem(storeName, key) {
  const db = await getDB();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteItem(storeName, key) {
  const db = await getDB();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllItems(storeName) {
  const db = await getDB();
  if (!db) return [];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllE2EEData() {
  if (typeof window === "undefined") return;
  try {
    const db = await getDB();
    if (db) {
      const storeNames = ["identity_keys", "pre_keys", "signed_pre_keys", "sessions", "sender_keys"].filter(
        (name) => db.objectStoreNames.contains(name)
      );
      if (storeNames.length > 0) {
        await new Promise((resolve) => {
          const tx = db.transaction(storeNames, "readwrite");
          for (const name of storeNames) {
            tx.objectStore(name).clear();
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
          tx.onabort = () => resolve();
        });
      }
    }
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("pocpoc_e2ee_")) {
        localStorage.removeItem(k);
      }
    }
    console.log("🧹 [E2E-UI] Cleared all local E2EE storage and IndexedDB object stores.");
  } catch (err) {
    console.warn("Could not clear E2EE IndexedDB:", err);
  }
}

export function getCurrentUserId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("userId") || "";
}

export async function getDeviceId() {
  if (typeof window === "undefined") return "web-device-default";
  const uid = getCurrentUserId();
  const storageKey = uid ? `pocpoc_e2ee_device_id_${uid}` : "pocpoc_e2ee_device_id";
  let deviceId = localStorage.getItem(storageKey);
  if (!deviceId) {
    deviceId = "web-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now();
    localStorage.setItem(storageKey, deviceId);
  }
  return deviceId;
}
