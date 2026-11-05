import {
  generateIdentityKeyPair,
  generateDeterministicIdentityKeyPair,
  generateX25519KeyPair,
  signData,
  verifySignature,
  deriveKeyHKDF,
  encryptAESGCM,
  decryptAESGCM,
  bytesToBase64,
  base64ToBytes
} from "./cryptoEngine";
import { getItem, setItem, deleteItem, getDeviceId, getCurrentUserId } from "./keyStore";
import { encryptRatchetMessage, decryptRatchetMessage } from "./doubleRatchet";
import { initializeUserKeys, getOwnIdentityKey } from "./x3dh";
import { getCachedPlaintext, setCachedPlaintext } from "./plaintextCache";
import { autoSyncBackupIfPinAvailable } from "./pinBackup";
import api from "../axios";

const CURRENT_GROUP_KEY_GEN = 3;
const PEER_KEY_SCHEMA_VERSION = 4;
const distributedRecipientsByChat = new Map();
const pendingPeerKeyFetches = new Map();

// Step the sender ratchet chain
function stepSenderChain(chainKeyBytes) {
  const messageKey = deriveKeyHKDF(chainKeyBytes, "GROUP_MSG_SALT", "MESSAGE_KEY", 32);
  const nextChainKey = deriveKeyHKDF(chainKeyBytes, "GROUP_CHAIN_SALT", "CHAIN_KEY", 32);
  return { messageKey, nextChainKey };
}

function deriveGroupMessageKey(initialChainKeyBytes, chainIndex) {
  const idx = Number(chainIndex) || 1;
  if (!initialChainKeyBytes || idx < 1) return null;
  let cur = initialChainKeyBytes;
  let targetMsgKey = null;
  for (let i = 1; i <= idx; i++) {
    const { messageKey, nextChainKey } = stepSenderChain(cur);
    if (i === idx) {
      targetMsgKey = messageKey;
      break;
    }
    cur = nextChainKey;
  }
  return targetMsgKey;
}

// 1. Get or create own Sender Key for a group chat
export async function getOrCreateOwnGroupSenderKey(chatId, memberIds = []) {
  const ownIdentity = await initializeUserKeys();
  const deviceId = await getDeviceId();
  const currentUserId = getCurrentUserId();
  if (!chatId || !currentUserId || !ownIdentity?.identityKeyPriv) return null;

  const keyId = `own:${chatId}:${currentUserId}`;
  let ownGroupKey = await getItem("sender_keys", keyId);

  // Derive deterministic initialChainKey and signingKeyPair from (identityKeyPriv, chatId, currentUserId)
  // This guarantees 100% consistency across normal tabs, incognito tabs, and page reloads for the same user!
  const ikPrivBytes = base64ToBytes(ownIdentity.identityKeyPriv);
  const detChainKeyBytes = deriveKeyHKDF(ikPrivBytes, chatId, `GROUP_SENDER_CHAIN_KEY_V3:${currentUserId}`, 32);
  const detSignSeedBytes = deriveKeyHKDF(ikPrivBytes, chatId, `GROUP_SENDER_SIGN_KEY_V3:${currentUserId}`, 32);
  const detSignKp = generateDeterministicIdentityKeyPair(detSignSeedBytes);
  const expectedInitialChainKeyBase64 = bytesToBase64(detChainKeyBytes);

  // Auto fetch group members if not provided
  let effectiveMemberIds = Array.isArray(memberIds) && memberIds.length > 0 ? [...memberIds] : [];
  if (effectiveMemberIds.length === 0) {
    try {
      const res = await api.get(`/v1/chat/groups/${chatId}/members`);
      const list = res.data?.body || [];
      effectiveMemberIds = list.map((m) => m.id || m.userId).filter(Boolean);
    } catch (e) {
      console.warn("Could not auto-fetch group members:", e);
    }
  }
  if (currentUserId && !effectiveMemberIds.includes(currentUserId)) {
    effectiveMemberIds.push(currentUserId);
  }

  const needsUpgrade =
    !ownGroupKey ||
    ownGroupKey.keyGeneration !== CURRENT_GROUP_KEY_GEN ||
    ownGroupKey.initialChainKeyBase64 !== expectedInitialChainKeyBase64;

  if (needsUpgrade) {
    ownGroupKey = {
      id: keyId,
      chatId,
      senderId: currentUserId,
      senderDeviceId: deviceId,
      initialChainKeyBase64: expectedInitialChainKeyBase64,
      chainKeyBase64: expectedInitialChainKeyBase64,
      signingPrivKeyBase64: detSignKp.privateKeyBase64,
      signingPubKeyBase64: detSignKp.publicKeyBase64,
      keyGeneration: CURRENT_GROUP_KEY_GEN,
      iteration: 0,
      distributed: false,
    };
    await setItem("sender_keys", ownGroupKey);
  }

  // Ensure sender key is distributed to server in this runtime session
  const distributedSet = distributedRecipientsByChat.get(chatId) || new Set();
  const hasUndistributedMembers = effectiveMemberIds.some((mId) => !distributedSet.has(mId));

  if (effectiveMemberIds.length > 0 && (!ownGroupKey.distributed || hasUndistributedMembers)) {
    const uploadedIds = await distributeSenderKeyToMembers(chatId, ownGroupKey, effectiveMemberIds);
    if (uploadedIds.length > 0) {
      for (const id of uploadedIds) {
        distributedSet.add(id);
      }
      distributedRecipientsByChat.set(chatId, distributedSet);
      ownGroupKey.distributed = true;
      await setItem("sender_keys", ownGroupKey);
      autoSyncBackupIfPinAvailable();
    }
  }

  return ownGroupKey;
}

// 2. Distribute own Sender Key to group members using 1-1 Double Ratchet
export async function distributeSenderKeyToMembers(chatId, ownGroupKey, memberIds) {
  const currentUserId = getCurrentUserId();
  const initialChainKey = ownGroupKey.initialChainKeyBase64 || ownGroupKey.chainKeyBase64;
  console.log("🔑 [SenderKey-UI] distributeSenderKeyToMembers START chatId:", chatId, "memberIds:", memberIds);

  const batchSenderKeys = [];

  for (const mId of memberIds) {
    try {
      const senderKeyPayload = JSON.stringify({
        chatId,
        senderId: currentUserId,
        senderDeviceId: ownGroupKey.senderDeviceId,
        initialChainKeyBase64: initialChainKey,
        chainKeyBase64: initialChainKey,
        signingPubKeyBase64: ownGroupKey.signingPubKeyBase64,
        signingPrivKeyBase64: mId === currentUserId ? ownGroupKey.signingPrivKeyBase64 : undefined,
        keyGeneration: ownGroupKey.keyGeneration,
        iteration: ownGroupKey.iteration,
      });

      const { ciphertext, e2eHeader } = await encryptRatchetMessage(mId, senderKeyPayload);
      batchSenderKeys.push({
        recipientId: mId,
        recipientDeviceId: e2eHeader.recipientDeviceId || "web-default",
        keyGeneration: ownGroupKey.keyGeneration,
        encryptedSenderKey: ciphertext,
        e2eHeader,
      });
    } catch (err) {
      // Member may not have initialized E2EE keys yet (e.g. offline seed user)
      console.warn("Could not distribute sender key to member", mId, err?.message || err);
    }
  }

  if (batchSenderKeys.length > 0) {
    try {
      await api.post(`/v1/chat/e2e/groups/${chatId}/sender-keys`, {
        senderDeviceId: ownGroupKey.senderDeviceId,
        senderKeys: batchSenderKeys,
      });
      console.log("✅ [SenderKey-UI] Uploaded sender keys to server for", batchSenderKeys.length, "recipients");
      return batchSenderKeys.map((item) => item.recipientId);
    } catch (uploadErr) {
      console.error("❌ [SenderKey-UI] Failed to post sender-keys batch to server:", uploadErr);
    }
  }
  return [];
}

// 3. Encrypt a group message using Sender Key
export async function encryptGroupMessage(chatId, plaintext, memberIds = []) {
  const ownGroupKey = await getOrCreateOwnGroupSenderKey(chatId, memberIds);
  const initialChainKeyBytes = base64ToBytes(ownGroupKey.initialChainKeyBase64 || ownGroupKey.chainKeyBase64);
  const signingPrivKeyBytes = base64ToBytes(ownGroupKey.signingPrivKeyBase64);

  const nextIndex = (Number(ownGroupKey.iteration) || 0) + 1;
  const messageKey = deriveGroupMessageKey(initialChainKeyBytes, nextIndex);

  const { ciphertextBase64, ivBase64 } = await encryptAESGCM(plaintext, messageKey);

  // Sign ciphertext with Ed25519 signing key
  const signature = signData(signingPrivKeyBytes, new TextEncoder().encode(ciphertextBase64));

  ownGroupKey.iteration = nextIndex;
  await setItem("sender_keys", ownGroupKey);

  return {
    ciphertext: ciphertextBase64,
    e2eHeader: {
      version: 1,
      algorithm: "SENDER_KEY_V1",
      senderDeviceId: ownGroupKey.senderDeviceId,
      keyGeneration: ownGroupKey.keyGeneration,
      iv: ivBase64,
      chainIndex: nextIndex,
      signature,
    }
  };
}

async function fetchAndDecryptPeerGroupKey(chatId, senderId, targetKeyGen = null) {
  const peerKeyId = `peer:${chatId}:${senderId}`;
  if (pendingPeerKeyFetches.has(peerKeyId)) {
    return pendingPeerKeyFetches.get(peerKeyId);
  }

  const promise = (async () => {
    try {
      const res = await api.get(`/v1/chat/e2e/groups/${chatId}/sender-keys`);
      const records = (res.data?.body || []).filter((r) => r.senderId === senderId);
      records.sort((a, b) => (Number(b.keyGeneration) || 0) - (Number(a.keyGeneration) || 0));

      const senderRecord =
        (targetKeyGen ? records.find((r) => Number(r.keyGeneration) === Number(targetKeyGen)) : null) ||
        records[0];

      if (!senderRecord) {
        throw new Error(`Sender key not found on server for group member ${senderId}`);
      }

      const decryptedPayloadStr = await decryptRatchetMessage(
        senderId,
        senderRecord.encryptedSenderKey,
        senderRecord.e2eHeader
      );
      const payload = JSON.parse(decryptedPayloadStr);
      const initialKey = payload.initialChainKeyBase64 || payload.chainKeyBase64;

      const peerGroupKey = {
        id: peerKeyId,
        chatId,
        senderId,
        senderDeviceId: payload.senderDeviceId,
        initialChainKeyBase64: initialKey,
        chainKeyBase64: initialKey,
        signingPubKeyBase64: payload.signingPubKeyBase64,
        keyGeneration: Number(payload.keyGeneration) || CURRENT_GROUP_KEY_GEN,
        iteration: payload.iteration,
        schemaVersion: PEER_KEY_SCHEMA_VERSION,
      };

      await setItem("sender_keys", peerGroupKey);
      return peerGroupKey;
    } finally {
      pendingPeerKeyFetches.delete(peerKeyId);
    }
  })();

  pendingPeerKeyFetches.set(peerKeyId, promise);
  return promise;
}

// 4. Decrypt a group message from another sender (or self across tabs)
export async function decryptGroupMessage(chatId, senderId, ciphertextBase64, e2eHeader) {
  const cached = getCachedPlaintext(ciphertextBase64);
  if (cached) return cached;

  await initializeUserKeys();
  const currentUserId = getCurrentUserId();
  const targetIndex = Number(e2eHeader?.chainIndex) || 1;
  const msgKeyGen = Number(e2eHeader?.keyGeneration) || CURRENT_GROUP_KEY_GEN;

  if (senderId === currentUserId) {
    const ownGroupKey = await getOrCreateOwnGroupSenderKey(chatId);
    const ownInitial = ownGroupKey?.initialChainKeyBase64 || ownGroupKey?.chainKeyBase64;
    if (ownInitial) {
      const msgKey = deriveGroupMessageKey(base64ToBytes(ownInitial), targetIndex);
      if (msgKey) {
        try {
          const decrypted = await decryptAESGCM(ciphertextBase64, msgKey, e2eHeader.iv);
          setCachedPlaintext(ciphertextBase64, decrypted);
          if (targetIndex > (Number(ownGroupKey.iteration) || 0)) {
            ownGroupKey.iteration = targetIndex;
            await setItem("sender_keys", ownGroupKey);
          }
          return decrypted;
        } catch (decryptErr) {
          // Fall through to peer key lookup if needed
        }
      }
    }
  }

  const peerKeyId = `peer:${chatId}:${senderId}`;
  let peerGroupKey = await getItem("sender_keys", peerKeyId);

  if (
    !peerGroupKey ||
    peerGroupKey.schemaVersion !== PEER_KEY_SCHEMA_VERSION ||
    (msgKeyGen && Number(peerGroupKey.keyGeneration) !== msgKeyGen)
  ) {
    peerGroupKey = await fetchAndDecryptPeerGroupKey(chatId, senderId, msgKeyGen);
  }

  const tryDecryptWithPeerKey = async (keyObj) => {
    const initialKey = keyObj.initialChainKeyBase64 || keyObj.chainKeyBase64;
    const msgKey = deriveGroupMessageKey(base64ToBytes(initialKey), targetIndex);
    if (!msgKey) {
      throw new Error("Could not derive group message key");
    }
    const decryptedText = await decryptAESGCM(ciphertextBase64, msgKey, e2eHeader.iv);
    setCachedPlaintext(ciphertextBase64, decryptedText);
    return decryptedText;
  };

  try {
    return await tryDecryptWithPeerKey(peerGroupKey);
  } catch (firstErr) {
    await deleteItem("sender_keys", peerKeyId);
    peerGroupKey = await fetchAndDecryptPeerGroupKey(chatId, senderId, msgKeyGen);
    return await tryDecryptWithPeerKey(peerGroupKey);
  }
}
