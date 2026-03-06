import { createAuthClient } from "better-auth/react";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
const NOSTR_SESSION_KEY = "sigmagit_nostr_session";

const sessionListeners = new Set<() => void>();
function notifySessionChange() {
  sessionListeners.forEach((fn) => fn());
}

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "exp",
      storagePrefix: process.env.NODE_ENV === "production" ? "sigmagit" : "sigmagit_dev",
      cookiePrefix: process.env.NODE_ENV === "production" ? "sigmagit" : "sigmagit_dev",
      storage: SecureStore,
    }),
  ],
});

export const { signIn } = authClient;
const authUseSession = authClient.useSession;

export function useSession() {
  const authSession = authUseSession();
  const [data, setData] = useState<{ user: unknown; session: { token: string } } | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    getSession().then((s) => {
      if (!cancelled) setData(s?.data ?? null);
    });
    const handler = () => {
      getSession().then((s) => {
        if (!cancelled) setData(s?.data ?? null);
      });
    };
    sessionListeners.add(handler);
    return () => {
      cancelled = true;
      sessionListeners.delete(handler);
    };
  }, [authSession.data]);
  const isPending = data === undefined && authSession.isPending;
  return { data: data ?? null, isPending };
}

export async function signOut() {
  await clearNostrSession();
  notifySessionChange();
  return authClient.signOut();
}

export async function signUpWithUsername(data: { email: string; password: string; name: string; username: string }) {
  return authClient.signUp.email(data as Parameters<typeof authClient.signUp.email>[0]);
}

export interface NostrSessionData {
  token: string;
  user: { id: string; name: string | null; email: string; username: string; avatarUrl: string | null; nostrPublicKey: string | null };
  expiresAt: string;
}

export async function getSession() {
  try {
    const raw = await SecureStore.getItemAsync(NOSTR_SESSION_KEY);
    if (raw) {
      const data: NostrSessionData = JSON.parse(raw);
      if (data.expiresAt && new Date(data.expiresAt) > new Date()) {
        return {
          data: {
            session: { token: data.token },
            user: data.user,
          },
        };
      }
      await SecureStore.deleteItemAsync(NOSTR_SESSION_KEY);
    }
  } catch {}
  return authClient.getSession();
}

export async function signInWithNostr(npub: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/nostr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ npub }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Nostr sign-in failed" };
    }
    if (!data.token || !data.user) {
      return { success: false, error: "Invalid response from server" };
    }
    const sessionData: NostrSessionData = {
      token: data.token,
      user: data.user,
      expiresAt: data.session?.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    await SecureStore.setItemAsync(NOSTR_SESSION_KEY, JSON.stringify(sessionData));
    notifySessionChange();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export async function clearNostrSession() {
  await SecureStore.deleteItemAsync(NOSTR_SESSION_KEY);
}
