import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;
const SALT = "sigmagit-migration-credentials-v1";
const VERSION_PREFIX = "v1.";

let cachedKey: Buffer | null = null;

function getKey(): Buffer | null {
  if (cachedKey !== null) return cachedKey;
  const secret = process.env.MIGRATION_CREDENTIALS_KEY;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT_NAME) {
      console.warn(
        "[CredentialCipher] MIGRATION_CREDENTIALS_KEY not set or too short; credentials will use legacy base64 (not secure)"
      );
    }
    return null;
  }
  cachedKey = scryptSync(secret, SALT, KEY_LEN);
  return cachedKey;
}

/**
 * Encrypt a credential value for storage. Uses AES-256-GCM when
 * MIGRATION_CREDENTIALS_KEY is set; otherwise falls back to base64 (legacy).
 */
export function encryptCredential(value: string): string {
  const key = getKey();
  if (!key) {
    return Buffer.from(value, "utf-8").toString("base64");
  }
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, enc]);
  return VERSION_PREFIX + combined.toString("base64");
}

/**
 * Decrypt a stored credential. Accepts both "v1." prefixed (AES-GCM) and
 * legacy base64-only values for backward compatibility.
 */
export function decryptCredential(encrypted: string): string {
  if (encrypted.startsWith(VERSION_PREFIX)) {
    const key = getKey();
    if (!key) {
      throw new Error(
        "Stored credentials are encrypted but MIGRATION_CREDENTIALS_KEY is not set"
      );
    }
    const raw = Buffer.from(encrypted.slice(VERSION_PREFIX.length), "base64");
    if (raw.length < IV_LEN + AUTH_TAG_LEN) {
      throw new Error("Invalid encrypted credential payload");
    }
    const iv = raw.subarray(0, IV_LEN);
    const authTag = raw.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
    const ciphertext = raw.subarray(IV_LEN + AUTH_TAG_LEN);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext) + decipher.final("utf8");
  }
  return Buffer.from(encrypted, "base64").toString("utf-8");
}
