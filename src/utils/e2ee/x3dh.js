import {
  generateIdentityKeyPair,
  generateX25519KeyPair,
  signData,
  verifySignature,
  computeDH,
  deriveKeyHKDF,
  ed25519PrivToX25519,
  ed25519PubToX25519,
  bytesToBase64,
  base64ToBytes
} from "./cryptoEngine";
import { setItem, getItem, getAllItems, deleteItem, getDeviceId, getCurrentUserId } from "./keyStore";
import api from "../axios";

const uploadedBundleInRuntime = new Map();

export async function ensurePreKeyBundleUploaded(identityKey, force = false) {
  if (!identityKey || !identityKey.identityKeyPub || !identityKey.signedPreKeyPub) return false;
  const uid = getCurrentUserId() || identityKey.userId || "current";
  const deviceId = await getDeviceId();
  const cacheKey = `${uid}:${deviceId}:${identityKey.identityKeyPub}`;
  if (!force && uploadedBundleInRuntime.get(cacheKey)) {
    return true;
  }

  try {
    const storedPreKeys = await getAllItems("pre_keys");
    const oneTimePreKeys = (storedPreKeys || []).slice(0, 50).map((pk) => ({
      keyId: pk.keyId,
      publicKey: pk.publicKeyBase64,
    }));

    await api.post("/v1/chat/e2e/keys/upload", {
      deviceId,
      deviceName: "Web Browser",
      registrationId: identityKey.registrationId || 100001,
      identityKeyPub: identityKey.identityKeyPub,
      signedPreKeyId: identityKey.signedPreKeyId || 1,
      signedPreKeyPub: identityKey.signedPreKeyPub,
      signedPreKeySig: identityKey.signedPreKeySig,
      oneTimePreKeys,
    });
    uploadedBundleInRuntime.set(cacheKey, true);
    console.log("✅ [E2E-UI] Synced Public PreKey Bundle to server for user:", uid, "device:", deviceId);
    return true;
  } catch (err) {
    console.error("❌ [E2E-UI] Failed to sync PreKey Bundle to server:", err);
    return false;
  }
}

export async function getOwnIdentityKey() {
  const uid = getCurrentUserId();
  if (!uid) return null;
  let key = await getItem("identity_keys", uid);
  if (!key) {
    const legacyKey = await getItem("identity_keys", "current");
    if (legacyKey && legacyKey.identityKeyPub && legacyKey.identityKeyPriv) {
      key = {
        ...legacyKey,
        id: uid,
        userId: uid,
      };
      await setItem("identity_keys", key);
    }
  }
  return key;
}

export async function initializeUserKeys() {
  const uid = getCurrentUserId();
  if (!uid) return null;
  const deviceId = await getDeviceId();
  let identityKey = await getOwnIdentityKey();

  if (!identityKey) {
    // Check if user already has an encrypted backup vault on server
    try {
      const statusRes = await api.get("/v1/chat/e2e/keys/status");
      if (statusRes.data?.body?.hasBackup) {
        console.log("🔐 [E2E-UI] Backup vault exists on server. Waiting for PIN entry to restore keys.");
        return null;
      }
    } catch (e) {
      console.warn("Could not check key status:", e);
    }

    console.log("🔐 [E2E-UI] Initializing fresh key pair for device", deviceId, "user:", uid);
    const idKp = generateIdentityKeyPair();
    const signedPreKp = generateX25519KeyPair();
    const signedPreKeyId = Math.floor(Math.random() * 1000000);

    // Sign the X25519 signed prekey public bytes with Ed25519 identity key
    const sigBase64 = signData(idKp.privateKey, signedPreKp.publicKey);

    // Generate 100 One-Time PreKeys
    const oneTimePreKeys = [];
    for (let i = 1; i <= 100; i++) {
      const opk = generateX25519KeyPair();
      await setItem("pre_keys", {
        keyId: i,
        privateKeyBase64: opk.privateKeyBase64,
        publicKeyBase64: opk.publicKeyBase64,
      });
      oneTimePreKeys.push({
        keyId: i,
        publicKey: opk.publicKeyBase64,
      });
    }

    identityKey = {
      id: uid,
      userId: uid,
      registrationId: Math.floor(Math.random() * 1000000),
      identityKeyPub: idKp.publicKeyBase64,
      identityKeyPriv: idKp.privateKeyBase64,
      signedPreKeyId,
      signedPreKeyPub: signedPreKp.publicKeyBase64,
      signedPreKeyPriv: signedPreKp.privateKeyBase64,
      signedPreKeySig: sigBase64,
    };

    await setItem("identity_keys", identityKey);
    await setItem("identity_keys", { ...identityKey, id: "current" });
  }

  // Always ensure the server has our public PreKey Bundle in e2e_device_keys
  await ensurePreKeyBundleUploaded(identityKey);

  return identityKey;
}

// X3DH Initiator: Alice creates a session with Bob using Bob's PreKey Bundle
export async function initiateX3DHSession(targetUserId, deviceBundle) {
  const ownIdentity = await getOwnIdentityKey();
  const deviceId = await getDeviceId();

  const ikA_priv = base64ToBytes(ownIdentity.identityKeyPriv);
  const ikA_pub = base64ToBytes(ownIdentity.identityKeyPub);

  const ikB_pub = base64ToBytes(deviceBundle.identityKeyPub);
  const spkB_pub = base64ToBytes(deviceBundle.signedPreKeyPub);

  // 1. Verify Bob's Signed PreKey Signature
  const isSigValid = verifySignature(ikB_pub, spkB_pub, deviceBundle.signedPreKeySig);
  if (!isSigValid) {
    throw new Error("Invalid Signed PreKey signature from peer");
  }

  // Convert Ed25519 identity keys to X25519 for Diffie-Hellman calculation
  const ikA_x_priv = ed25519PrivToX25519(ikA_priv);
  const ikB_x_pub = ed25519PubToX25519(ikB_pub);

  // 2. Generate Alice's Ephemeral Key
  const ekA = generateX25519KeyPair();

  // 3. Diffie-Hellman calculations (Triple DH: DH1, DH2, DH3)
  const dh1 = computeDH(ikA_x_priv, spkB_pub);
  const dh2 = computeDH(ekA.privateKey, ikB_x_pub);
  const dh3 = computeDH(ekA.privateKey, spkB_pub);

  let combinedDH = new Uint8Array(dh1.length + dh2.length + dh3.length);
  combinedDH.set(dh1, 0);
  combinedDH.set(dh2, dh1.length);
  combinedDH.set(dh3, dh1.length + dh2.length);

  // 4. Derive Shared Root Key (SK) via HKDF
  const rootKey = deriveKeyHKDF(combinedDH, "X3DH_SALT", "X3DH_INFO", 32);

  const session = {
    sessionId: `${targetUserId}:${deviceBundle.deviceId}`,
    peerUserId: targetUserId,
    peerDeviceId: deviceBundle.deviceId,
    rootKeyBase64: bytesToBase64(rootKey),
    sendingChainKeyBase64: bytesToBase64(rootKey),
    receivingChainKeyBase64: null,
    chainIndex: 0,
    ephemeralKeyBase64: ekA.publicKeyBase64,
    peerIdentityKeyBase64: deviceBundle.identityKeyPub,
    updatedAt: new Date().toISOString(),
  };

  console.log("🔐 [X3DH-UI] Session initiated with", targetUserId, "rootKey prefix:", session.rootKeyBase64.substring(0, 12));
  await setItem("sessions", session);

  return {
    session,
    x3dhHeader: {
      version: 1,
      algorithm: "X3DH_DR_V1",
      senderDeviceId: deviceId,
      recipientDeviceId: deviceBundle.deviceId,
      senderIdentityKey: ownIdentity.identityKeyPub,
      ephemeralKey: ekA.publicKeyBase64,
      signedPreKeyId: deviceBundle.signedPreKeyID,
      oneTimePreKeyId: deviceBundle.oneTimePreKeyID,
      chainIndex: 0,
    }
  };
}

// X3DH Responder: Bob receives Alice's first message and establishes the session
export async function respondX3DHSession(senderUserId, header) {
  const ownIdentity = await getOwnIdentityKey();

  const ikB_priv = base64ToBytes(ownIdentity.identityKeyPriv);
  const spkB_priv = base64ToBytes(ownIdentity.signedPreKeyPriv);

  const ikA_pub = base64ToBytes(header.senderIdentityKey);
  const ekA_pub = base64ToBytes(header.ephemeralKey);

  // Convert Ed25519 identity keys to X25519 for Diffie-Hellman calculation
  const ikB_x_priv = ed25519PrivToX25519(ikB_priv);
  const ikA_x_pub = ed25519PubToX25519(ikA_pub);

  // Diffie-Hellman calculations (Triple DH: DH1, DH2, DH3)
  const dh1 = computeDH(spkB_priv, ikA_x_pub);
  const dh2 = computeDH(ikB_x_priv, ekA_pub);
  const dh3 = computeDH(spkB_priv, ekA_pub);

  let combinedDH = new Uint8Array(dh1.length + dh2.length + dh3.length);
  combinedDH.set(dh1, 0);
  combinedDH.set(dh2, dh1.length);
  combinedDH.set(dh3, dh1.length + dh2.length);

  const rootKey = deriveKeyHKDF(combinedDH, "X3DH_SALT", "X3DH_INFO", 32);

  const session = {
    sessionId: `${senderUserId}:${header.senderDeviceId}`,
    peerUserId: senderUserId,
    peerDeviceId: header.senderDeviceId,
    rootKeyBase64: bytesToBase64(rootKey),
    sendingChainKeyBase64: null,
    receivingChainKeyBase64: bytesToBase64(rootKey),
    chainIndex: 0,
    ephemeralKeyBase64: header.ephemeralKey,
    peerIdentityKeyBase64: header.senderIdentityKey,
    updatedAt: new Date().toISOString(),
  };

  console.log("🔐 [X3DH-UI] Session responded for", senderUserId, "rootKey prefix:", session.rootKeyBase64.substring(0, 12));
  await setItem("sessions", session);
  return session;
}
