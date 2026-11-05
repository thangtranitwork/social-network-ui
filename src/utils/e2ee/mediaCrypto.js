import {
  encryptAESGCM,
  decryptAESGCM,
  getRandomBytes,
  bytesToBase64,
  base64ToBytes
} from "./cryptoEngine";
import api from "../axios";

// 1. Encrypt file binary buffer before upload to MinIO
export async function encryptFileForUpload(file) {
  const fileBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(fileBuffer);

  const fileKey = getRandomBytes(32); // 256-bit key
  const fileIV = getRandomBytes(12);  // 96-bit IV

  // Compute SHA-256 for integrity check
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", fileBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256Hex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const { ciphertextBase64 } = await encryptAESGCM(fileBytes, fileKey, fileIV);
  const encryptedBlobBytes = base64ToBytes(ciphertextBase64);

  const encryptedFile = new File([encryptedBlobBytes], file.name + ".enc", {
    type: "application/octet-stream",
  });

  return {
    encryptedFile,
    fileKeyBase64: bytesToBase64(fileKey),
    fileIVBase64: bytesToBase64(fileIV),
    sha256: sha256Hex,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };
}

// 2. Download and decrypt encrypted file from MinIO
export async function downloadAndDecryptFile(fileUrl, fileKeyBase64, fileIVBase64, expectedSha256) {
  const res = await api.get(fileUrl, { responseType: "arraybuffer" });
  const encryptedBytes = new Uint8Array(res.data);
  const encryptedBase64 = bytesToBase64(encryptedBytes);

  const fileKey = base64ToBytes(fileKeyBase64);
  const fileIV = base64ToBytes(fileIVBase64);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    fileKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fileIV },
    cryptoKey,
    base64ToBytes(encryptedBase64)
  );

  // Verify SHA-256 hash
  if (expectedSha256) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", decryptedBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const actualSha256 = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    if (actualSha256 !== expectedSha256) {
      throw new Error("File integrity check failed: SHA-256 mismatch");
    }
  }

  return decryptedBuffer;
}
