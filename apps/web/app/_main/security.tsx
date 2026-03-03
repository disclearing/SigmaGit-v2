import { createFileRoute } from "@tanstack/react-router";
import { Eye, Key, Lock, Shield } from "lucide-react";
import { createMeta } from "@/lib/seo";

export const Route = createFileRoute("/_main/security")({
  head: () => ({ meta: createMeta({ title: "Security", description: "How Sigmagit protects your code and data. Encryption, authentication, and security practices." }) }),
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Security</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your security is our top priority. Learn how we protect your code and data.
        </p>
      </div>

      <div className="space-y-16">
        <section>
          <h2 className="text-3xl font-semibold mb-6">Security Practices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <Shield className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Encryption</h3>
              <p className="text-muted-foreground">
                All data in transit is encrypted using TLS 1.3. Data at rest is encrypted using 
                industry-standard encryption algorithms.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <Lock className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Authentication</h3>
              <p className="text-muted-foreground">
                We support multiple authentication methods including passwords, passkeys, and 
                two-factor authentication for enhanced security.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <Key className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Access Control</h3>
              <p className="text-muted-foreground">
                Fine-grained permissions allow you to control who can access your repositories 
                and what actions they can perform.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <Eye className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Monitoring</h3>
              <p className="text-muted-foreground">
                We continuously monitor our systems for security threats and respond quickly 
                to any incidents.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mb-4">Reporting Security Issues</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            If you discover a security vulnerability, please report it to us responsibly. We take 
            security seriously and will work with you to address any issues.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Please email security concerns to{" "}
            <a href="mailto:security@sigmagit.com" className="text-primary hover:underline">
              security@sigmagit.com
            </a>
            . We appreciate responsible disclosure and will acknowledge your report promptly.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mb-4">Best Practices</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-2">Use Strong Passwords</h3>
              <p className="text-sm text-muted-foreground">
                Choose unique, complex passwords and consider using a password manager.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-2">Enable Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account with 2FA or passkeys.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-2">Review Access Regularly</h3>
              <p className="text-sm text-muted-foreground">
                Periodically review who has access to your repositories and remove unnecessary access.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-2">Keep Software Updated</h3>
              <p className="text-sm text-muted-foreground">
                Ensure your Git client and related tools are kept up to date with the latest security patches.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
