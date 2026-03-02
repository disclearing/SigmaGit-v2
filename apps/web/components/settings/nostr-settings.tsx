"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Link2, Loader2, Unlink, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiUrl } from "@/lib/utils";

// Nostr window extension type
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: unknown): Promise<unknown>;
    };
  }
}


interface NostrSettingsProps {
  user: {
    id: string;
    nostrPublicKey?: string | null;
    nostrLinkedAt?: Date | null;
  };
}

export function NostrSettings({ user }: NostrSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [hasExtension, setHasExtension] = useState(false);
  const [nostrStatus, setNostrStatus] = useState<{
    linked: boolean;
    nostrPublicKey: string | null;
    linkedAt: Date | null;
  }>({
    linked: !!user.nostrPublicKey,
    nostrPublicKey: user.nostrPublicKey || null,
    linkedAt: user.nostrLinkedAt || null,
  });

  useEffect(() => {
    setHasExtension(typeof window !== "undefined" && !!window.nostr);
  }, []);

  async function handleLinkNostr() {
    if (!window.nostr) {
      toast.error("Nostr extension not found. Please install Alby or nos2x.");
      return;
    }

    setLoading(true);

    try {
      const pubkey = await window.nostr.getPublicKey();

      if (!pubkey) {
        throw new Error("No public key returned from extension");
      }

      const response = await fetch(`${getApiUrl()}/api/auth/nostr/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          npub: pubkey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to link Nostr identity");
      }

      setNostrStatus({
        linked: true,
        nostrPublicKey: pubkey,
        linkedAt: new Date(),
      });

      toast.success("Nostr identity linked successfully!");
    } catch (error) {
      console.error("[Nostr Link] Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to link Nostr identity");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlinkNostr() {
    setUnlinking(true);

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/nostr/link`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unlink Nostr identity");
      }

      setNostrStatus({
        linked: false,
        nostrPublicKey: null,
        linkedAt: null,
      });

      toast.success("Nostr identity unlinked successfully");
    } catch (error) {
      console.error("[Nostr Unlink] Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to unlink Nostr identity");
    } finally {
      setUnlinking(false);
    }
  }

  function formatNpub(npub: string): string {
    if (npub.length <= 20) return npub;
    return `${npub.slice(0, 12)}...${npub.slice(-8)}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-5 text-yellow-500" />
          Nostr Identity
        </CardTitle>
        <CardDescription>
          Link your Nostr identity to sign in with your Nostr extension and display your Nostr profile.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasExtension && (
          <div className="flex gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="size-5 text-yellow-500 shrink-0" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              No Nostr extension detected. Install{" "}
              <a
                href="https://getalby.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Alby
              </a>{" "}
              or{" "}
              <a
                href="https://chromewebstore.google.com/detail/nos2x/pbdahnlgabhdjlglnipnlalgpflbaggl"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                nos2x
              </a>{" "}
              to use Nostr authentication.
            </p>
          </div>
        )}

        {nostrStatus.linked ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="size-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="size-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-700 dark:text-green-400">
                  Nostr Identity Linked
                </p>
                <p className="text-sm text-green-600/80 dark:text-green-400/80 font-mono truncate">
                  {nostrStatus.nostrPublicKey
                    ? formatNpub(nostrStatus.nostrPublicKey)
                    : "Unknown"}
                </p>
                {nostrStatus.linkedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Linked on {new Date(nostrStatus.linkedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleUnlinkNostr}
              disabled={unlinking}
              className="w-full"
            >
              {unlinking ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Unlinking...
                </>
              ) : (
                <>
                  <Unlink className="size-4 mr-2" />
                  Unlink Nostr Identity
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                Linking your Nostr identity allows you to:
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="size-3 text-green-500" />
                  Sign in with your Nostr extension
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3 text-green-500" />
                  Display your Nostr profile picture and bio
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3 text-green-500" />
                  Use Lightning Network payments via NWC
                </li>
              </ul>
            </div>

            <Button
              onClick={handleLinkNostr}
              disabled={loading || !hasExtension}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Link2 className="size-4 mr-2" />
                  Link Nostr Identity
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
