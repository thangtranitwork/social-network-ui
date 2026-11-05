import {
  deriveKeyHKDF,
  encryptAESGCM,
  decryptAESGCM,
  bytesToBase64,
  base64ToBytes
} from "./cryptoEngine";
import { getItem, setItem, getAllItems, getDeviceId } from "./keyStore";
import { initiateX3DHSession, respondX3DHSession, getOwnIdentityKey, initializeUserKeys } from "./x3dh";
import { getCachedPlaintext, setCachedPlaintext } from "./plaintextCache";
import api from "../axios";

// Advance the Symmetric KDF Ratchet chain by 1 step
function stepChain(chainKeyBytes) {
  const messageKey = deriveKeyHKDF(chainKeyBytes, "MSG_SALT", "MESSAGE_KEY", 32);
  const nextChainKey = deriveKeyHKDF(chainKeyBytes, "CHAIN_SALT", "CHAIN_KEY", 32);
  return { messageKey, nextChainKey };
}

function deriveRatchetMessageKey(rootKeyBytes, chainIndex) {
  const idx = Number(chainIndex) || 1;
  if (!rootKeyBytes || idx < 1) return null;
  let cur = rootKeyBytes;
  let targetMsgKey = null;
  for (let i = 1; i <= idx; i++) {
    const { messageKey, nextChainKey } = stepChain(cur);
    if (i === idx) {
      targetMsgKey = messageKey;
      break;
    }
    cur = nextChainKey;
  }
  return targetMsgKey;
}

// Encrypt plaintext using Double Ratchet session
export async function encryptRatchetMessage(targetUserId, plaintext) {
  await initializeUserKeys();
  const deviceId = await getDeviceId();
  const ownIdentity = await getOwnIdentityKey();

  // Try to find active session with target user
  const allSessions = await getAllItems("sessions");
  let session = allSessions.find(
    (s) => s.peerUserId === targetUserId && s.rootKeyBase64 && s.ephemeralKeyBase64
  ) || null;

  // If no valid session with ephemeralKey, fetch prekey bundle from server to establish session
  if (!session) {
    const res = await api.get(`/v1/chat/e2e/keys/bundle/${targetUserId}`);
    const bundleData = res.data?.body;
    if (!bundleData || !bundleData.devices?.length) {
      throw new Error(`Peer ${targetUserId} has no E2EE PreKey bundle on server`);
    }
    const targetDevice = bundleData.devices[0];
    const { session: newSession } = await initiateX3DHSession(targetUserId, targetDevice);
    session = newSession;
  }

  const nextIndex = (Number(session.chainIndex) || 0) + 1;
  const rootKeyBytes = base64ToBytes(session.rootKeyBase64);
  const messageKey = deriveRatchetMessageKey(rootKeyBytes, nextIndex);

  const { ciphertextBase64, ivBase64 } = await encryptAESGCM(plaintext, messageKey);

  session.chainIndex = nextIndex;
  await setItem("sessions", session);

  return {
    ciphertext: ciphertextBase64,
    e2eHeader: {
      version: 1,
      algorithm: "X3DH_DR_V1",
      senderDeviceId: deviceId,
      recipientDeviceId: session.peerDeviceId,
      senderIdentityKey: ownIdentity?.identityKeyPub || null,
      ephemeralKey: session.ephemeralKeyBase64 || null,
      iv: ivBase64,
      chainIndex: nextIndex,
    }
  };
}

// Decrypt ciphertext using Double Ratchet session
export async function decryptRatchetMessage(senderUserId, ciphertextBase64, e2eHeader) {
  const cached = getCachedPlaintext(ciphertextBase64);
  if (cached) return cached;

  if (!e2eHeader || !e2eHeader.iv) {
    throw new Error("Missing e2eHeader for decryption");
  }

  await initializeUserKeys();

  const sessionId = `${senderUserId}:${e2eHeader.senderDeviceId}`;
  let session = await getItem("sessions", sessionId);

  // If first time receiving or new ephemeral key received, establish/update responder session
  const isNewEphemeral = e2eHeader.ephemeralKey && (!session || session.ephemeralKeyBase64 !== e2eHeader.ephemeralKey);
  if (isNewEphemeral && e2eHeader.senderIdentityKey) {
    session = await respondX3DHSession(senderUserId, e2eHeader);
  }

  if (!session || !session.rootKeyBase64) {
    throw new Error(`No E2EE session found for peer ${senderUserId}:${e2eHeader.senderDeviceId}`);
  }

  const targetIndex = Number(e2eHeader.chainIndex) || 1;
  const rootKeyBytes = base64ToBytes(session.rootKeyBase64);
  const messageKey = deriveRatchetMessageKey(rootKeyBytes, targetIndex);

  try {
    const decryptedText = await decryptAESGCM(ciphertextBase64, messageKey, e2eHeader.iv);
    setCachedPlaintext(ciphertextBase64, decryptedText);
    return decryptedText;
  } catch (err) {
    if (e2eHeader.senderIdentityKey && e2eHeader.ephemeralKey) {
      session = await respondX3DHSession(senderUserId, e2eHeader);
      const resetRootBytes = base64ToBytes(session.rootKeyBase64);
      const retryMsgKey = deriveRatchetMessageKey(resetRootBytes, targetIndex);
      const decryptedText = await decryptAESGCM(ciphertextBase64, retryMsgKey, e2eHeader.iv);
      setCachedPlaintext(ciphertextBase64, decryptedText);
      return decryptedText;
    }
    throw err;
  }
}
