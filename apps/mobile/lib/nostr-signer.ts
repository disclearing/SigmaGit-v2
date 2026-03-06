import { Linking, Platform } from "react-native";

/**
 * NIP-55 / Amber-style Nostr signer URI for "get public key".
 * On Android, Amber (and compatible signers) can handle this to return the npub.
 */
const NOSTR_SIGNER_GET_PUBKEY_URI = "nostrsigner:get_public_key";

/**
 * Opens the Nostr signer app (e.g. Amber on Android) to request the public key.
 * Returns true if the link was opened, false otherwise (e.g. no app installed).
 */
export async function openSignerAppForPublicKey(): Promise<boolean> {
  try {
    const url = NOSTR_SIGNER_GET_PUBKEY_URI;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Normalize npub or hex pubkey for API.
 * - npub1... left as-is
 * - 64-char hex accepted (API will normalize)
 */
export function normalizeNpubInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("npub1")) return trimmed;
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return trimmed;
  return trimmed;
}

export function isValidNpubOrHex(input: string): boolean {
  const t = input.trim();
  if (t.startsWith("npub1") && t.length > 60) return true;
  if (/^[0-9a-fA-F]{64}$/.test(t)) return true;
  return false;
}
