import { x25519, ed25519 } from '@noble/curves/ed25519.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { argon2id } from '@noble/hashes/argon2.js';
import { randomBytes } from '@noble/hashes/utils.js';

// Helper: Uint8Array <-> Base64
export function bytesToBase64(bytes) {
  if (typeof window === 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBytes(base64) {
  if (typeof window === 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Generate random bytes
export function getRandomBytes(length) {
  return randomBytes(length);
}

// 1. Curve25519 Identity KeyPair (Ed25519 for signing, convertible to X25519 for DH)
export function generateIdentityKeyPair() {
  const privKey = ed25519.utils.randomSecretKey();
  const pubKey = ed25519.getPublicKey(privKey);
  return {
    privateKey: privKey,
    publicKey: pubKey,
    privateKeyBase64: bytesToBase64(privKey),
    publicKeyBase64: bytesToBase64(pubKey),
  };
}

export function generateDeterministicIdentityKeyPair(seedBytes32) {
  const privKey = new Uint8Array(seedBytes32.slice(0, 32));
  const pubKey = ed25519.getPublicKey(privKey);
  return {
    privateKey: privKey,
    publicKey: pubKey,
    privateKeyBase64: bytesToBase64(privKey),
    publicKeyBase64: bytesToBase64(pubKey),
  };
}

// 2. X25519 PreKey / Ephemeral KeyPair
export function generateX25519KeyPair() {
  const privKey = x25519.utils.randomSecretKey();
  const pubKey = x25519.getPublicKey(privKey);
  return {
    privateKey: privKey,
    publicKey: pubKey,
    privateKeyBase64: bytesToBase64(privKey),
    publicKeyBase64: bytesToBase64(pubKey),
  };
}

// Sign data using Ed25519
export function signData(privateKeyBytes, dataBytes) {
  const sig = ed25519.sign(dataBytes, privateKeyBytes);
  return bytesToBase64(sig);
}

// Verify Ed25519 signature
export function verifySignature(publicKeyBytes, dataBytes, signatureBase64) {
  try {
    const sigBytes = base64ToBytes(signatureBase64);
    return ed25519.verify(sigBytes, dataBytes, publicKeyBytes);
  } catch (e) {
    console.error("Signature verification failed:", e);
    return false;
  }
}

// Convert Ed25519 private seed (32 bytes) to X25519 private scalar
export function ed25519PrivToX25519(edPriv) {
  const hash = sha512(edPriv);
  const xPriv = hash.slice(0, 32);
  xPriv[0] &= 248;
  xPriv[31] &= 127;
  xPriv[31] |= 64;
  return xPriv;
}

// Convert Ed25519 public point (32 bytes) to X25519 Montgomery u coordinate (32 bytes)
export function ed25519PubToX25519(edPub) {
  const hex = typeof edPub === 'string'
    ? edPub
    : Array.from(edPub, b => b.toString(16).padStart(2, '0')).join('');
  const point = ed25519.Point.fromHex(hex);
  const y = point.y;
  const p = 2n ** 255n - 19n;
  const inv = (a) => {
    let res = 1n;
    let base = a % p;
    let exp = p - 2n;
    while (exp > 0n) {
      if (exp & 1n) res = (res * base) % p;
      base = (base * base) % p;
      exp >>= 1n;
    }
    return res;
  };
  const u = ((1n + y) * inv((1n - y + p) % p)) % p;
  const uBytes = new Uint8Array(32);
  let tmp = u;
  for (let i = 0; i < 32; i++) {
    uBytes[i] = Number(tmp & 0xffn);
    tmp >>= 8n;
  }
  return uBytes;
}

// Compute Diffie-Hellman Shared Secret (ECDH X25519)
export function computeDH(privateKeyBytes, publicKeyBytes) {
  return x25519.getSharedSecret(privateKeyBytes, publicKeyBytes);
}

// HKDF-SHA256 Derivation
export function deriveKeyHKDF(ikm, salt, info, length = 32) {
  const saltBytes = typeof salt === 'string' ? new TextEncoder().encode(salt) : salt;
  const infoBytes = typeof info === 'string' ? new TextEncoder().encode(info) : info;
  return hkdf(sha256, ikm, saltBytes, infoBytes, length);
}

// AES-256-GCM Symmetric Encryption (Web Crypto API)
export async function encryptAESGCM(plaintextStrOrBytes, keyBytes, ivBytes = null) {
  const iv = ivBytes || getRandomBytes(12);
  const data = typeof plaintextStrOrBytes === 'string' 
    ? new TextEncoder().encode(plaintextStrOrBytes) 
    : plaintextStrOrBytes;

  const cryptoSubtle = typeof window !== 'undefined' ? window.crypto.subtle : globalThis.crypto.subtle;
  const cryptoKey = await cryptoSubtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const ciphertextBuffer = await cryptoSubtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );

  return {
    ciphertextBase64: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    ivBase64: bytesToBase64(iv),
    iv,
  };
}

// AES-256-GCM Symmetric Decryption (Web Crypto API)
export async function decryptAESGCM(ciphertextBase64, keyBytes, ivBase64OrBytes) {
  const ciphertextBytes = base64ToBytes(ciphertextBase64);
  const iv = typeof ivBase64OrBytes === 'string' ? base64ToBytes(ivBase64OrBytes) : ivBase64OrBytes;

  const cryptoSubtle = typeof window !== 'undefined' ? window.crypto.subtle : globalThis.crypto.subtle;
  const cryptoKey = await cryptoSubtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await cryptoSubtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertextBytes
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// Argon2id KDF for Zero-Knowledge PIN Backup
export async function deriveBackupKeyFromPin(pinStr, saltBytes = null) {
  const salt = saltBytes || getRandomBytes(16);
  const pinBytes = new TextEncoder().encode(pinStr);

  const derivedKey = await argon2id(pinBytes, salt, {
    t: 3,       // iterations
    m: 65536,   // 64MB memory
    p: 4,       // parallelism
    dkLen: 32   // 256-bit key
  });

  return {
    keyBytes: derivedKey,
    salt,
    saltBase64: bytesToBase64(salt),
    params: {
      memoryKb: 65536,
      iterations: 3,
      parallelism: 4,
    }
  };
}
