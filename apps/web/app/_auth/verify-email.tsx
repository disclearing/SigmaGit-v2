import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { getApiUrl } from "@/lib/utils";
import { createMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/verify-email")({
  head: () => ({ meta: createMeta({ title: "Verify email", description: "Verify your email address.", noIndex: true }) }),
  component: VerifyEmailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
});

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    async function verifyEmail() {
      try {
        const res = await fetch(`${getApiUrl()}/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setErrorMessage(data.error || "Failed to verify email");
          return;
        }

        setStatus("success");
      } catch {
        setStatus("error");
        setErrorMessage("Something went wrong");
      }
    }

    verifyEmail();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="w-full">
        <div className="border border-border rounded-lg bg-card p-8 shadow-sm">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="size-8 text-muted-foreground animate-spin" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Verifying your email</h1>
            <p className="text-muted-foreground text-sm">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "no-token") {
    return (
      <div className="w-full">
        <div className="border border-border rounded-lg bg-card p-8 shadow-sm">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-muted">
                <Mail className="size-8 text-muted-foreground" />
              </div>
            </div>
            <h1 className="text-xl font-semibold mb-2">Verify your email</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Check your inbox for a verification link to complete your registration.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="w-full">
        <div className="border border-border rounded-lg bg-card p-8 shadow-sm">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-500/10">
                <CheckCircle2 className="size-8 text-green-500" />
              </div>
            </div>
            <h1 className="text-xl font-semibold mb-2">Email verified</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Your email has been verified successfully. You can now access all features.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="border border-border rounded-lg bg-card p-8 shadow-sm">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10">
              <AlertCircle className="size-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-xl font-semibold mb-2">Verification failed</h1>
          <p className="text-muted-foreground text-sm mb-6">{errorMessage}</p>
          <Button asChild className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
