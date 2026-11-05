import {
  deriveBackupKeyFromPin,
  encryptAESGCM,
  decryptAESGCM,
  bytesToBase64,
  base64ToBytes
} from "./cryptoEngine";
import { getItem, setItem, getAllItems, getDeviceId, getCurrentUserId } from "./keyStore";
import { getOwnIdentityKey, ensurePreKeyBundleUploaded } from "./x3dh";
import api from "../axios";

export async function createKeyBackup(pin) {
  const identityKey = await getOwnIdentityKey();
  if (!identityKey) {
    throw new Error("No identity keys found to back up");
  }

  const preKeys = await getAllItems("pre_keys");
  const sessions = await getAllItems("sessions");
  const senderKeys = await getAllItems("sender_keys");
  const deviceId = await getDeviceId();

  const vaultPayload = JSON.stringify({
    identityKey,
    preKeys,
    sessions,
    senderKeys,
    deviceId,
    backedUpAt: new Date().toISOString(),
  });

  const { keyBytes, saltBase64, params } = await deriveBackupKeyFromPin(pin);
  const { ciphertextBase64, ivBase64 } = await encryptAESGCM(vaultPayload, keyBytes);

  await api.put("/v1/chat/e2e/backup", {
    encryptedVault: ciphertextBase64,
    vaultIv: ivBase64,
    kdfAlgorithm: "ARGON2ID",
    kdfSalt: saltBase64,
    kdfMemoryKb: params.memoryKb,
    kdfIterations: params.iterations,
    kdfParallelism: params.parallelism,
    keyFingerprint: identityKey.identityKeyPub.substring(0, 16),
    version: 1,
  });

  await setItem("identity_keys", {
    id: "backup_derived_key",
    keyBytesBase64: bytesToBase64(keyBytes),
    saltBase64,
    params,
  });

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("pocpoc_e2ee_pin", pin);
    } catch (e) {}
  }

  console.log("✅ E2EE: Key Backup (including sender keys) successfully saved to server");
}

export async function restoreKeyFromBackup(pin) {
  const res = await api.get("/v1/chat/e2e/backup");
  const backup = res.data?.body;
  if (!backup) {
    throw new Error("No backup found on server");
  }

  const saltBytes = base64ToBytes(backup.kdfSalt);
  const { keyBytes } = await deriveBackupKeyFromPin(pin, saltBytes);

  const decryptedJson = await decryptAESGCM(backup.encryptedVault, keyBytes, backup.vaultIv);
  const vault = JSON.parse(decryptedJson);

  const uid = getCurrentUserId();
  if (vault.identityKey) {
    const idKey = {
      ...vault.identityKey,
      id: uid || vault.identityKey.id || "current",
      userId: uid || vault.identityKey.userId,
    };
    await setItem("identity_keys", idKey);
    await setItem("identity_keys", { ...idKey, id: "current" });
    await ensurePreKeyBundleUploaded(idKey, true);
  }
  if (vault.deviceId && typeof window !== "undefined") {
    const storageKey = uid ? `pocpoc_e2ee_device_id_${uid}` : "pocpoc_e2ee_device_id";
    localStorage.setItem(storageKey, vault.deviceId);
  }
  if (Array.isArray(vault.preKeys)) {
    for (const pk of vault.preKeys) {
      await setItem("pre_keys", pk);
    }
  }
  if (Array.isArray(vault.sessions)) {
    for (const sess of vault.sessions) {
      await setItem("sessions", sess);
    }
  }
  if (Array.isArray(vault.senderKeys)) {
    for (const sk of vault.senderKeys) {
      await setItem("sender_keys", sk);
    }
  }

  await setItem("identity_keys", {
    id: "backup_derived_key",
    keyBytesBase64: bytesToBase64(keyBytes),
    saltBase64: backup.kdfSalt,
    params: {
      memoryKb: backup.kdfMemoryKb,
      iterations: backup.kdfIterations,
      parallelism: backup.kdfParallelism,
    },
  });

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("pocpoc_e2ee_pin", pin);
    } catch (e) {}
  }

  console.log("✅ E2EE: Keys, sessions and sender keys restored successfully from PIN backup");
  return vault;
}

export async function autoSyncKeyBackup() {
  if (typeof window === "undefined") return;
  try {
    const derivedRecord = await getItem("identity_keys", "backup_derived_key");
    if (!derivedRecord?.keyBytesBase64) return;

    const identityKey = await getOwnIdentityKey();
    if (!identityKey) return;

    await ensurePreKeyBundleUploaded(identityKey);

    const preKeys = await getAllItems("pre_keys");
    const sessions = await getAllItems("sessions");
    const senderKeys = await getAllItems("sender_keys");
    const deviceId = await getDeviceId();

    const vaultPayload = JSON.stringify({
      identityKey,
      preKeys,
      sessions,
      senderKeys,
      deviceId,
      backedUpAt: new Date().toISOString(),
    });

    const keyBytes = base64ToBytes(derivedRecord.keyBytesBase64);
    const { ciphertextBase64, ivBase64 } = await encryptAESGCM(vaultPayload, keyBytes);

    await api.put("/v1/chat/e2e/backup", {
      encryptedVault: ciphertextBase64,
      vaultIv: ivBase64,
      kdfAlgorithm: "ARGON2ID",
      kdfSalt: derivedRecord.saltBase64,
      kdfMemoryKb: derivedRecord.params.memoryKb,
      kdfIterations: derivedRecord.params.iterations,
      kdfParallelism: derivedRecord.params.parallelism,
      keyFingerprint: identityKey.identityKeyPub.substring(0, 16),
      version: 1,
    });
    console.log("☁️ Auto-synced E2EE backup vault with latest keys to server");
  } catch (err) {
    console.warn("Auto-sync key backup failed:", err);
  }
}

export async function autoSyncBackupIfPinAvailable() {
  await autoSyncKeyBackup();
}
