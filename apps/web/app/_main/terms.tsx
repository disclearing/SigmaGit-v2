import { createFileRoute } from "@tanstack/react-router";
import { createMeta } from "@/lib/seo";

export const Route = createFileRoute("/_main/terms")({
  head: () => ({ meta: createMeta({ title: "Terms of Service", description: "Sigmagit terms of service. Rules and guidelines for using the platform." }) }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing and using sigmagit, you accept and agree to be bound by the terms and 
            provision of this agreement. If you do not agree to abide by the above, please do not 
            use this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Permission is granted to temporarily use sigmagit for personal and commercial purposes. 
            This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose without explicit permission</li>
            <li>Attempt to reverse engineer any software contained on sigmagit</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p className="text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your account and password. 
            You agree to accept responsibility for all activities that occur under your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Content and Conduct</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            You agree not to use sigmagit to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Upload, post, or transmit any content that is illegal, harmful, or violates any laws</li>
            <li>Infringe upon the intellectual property rights of others</li>
            <li>Transmit any viruses, malware, or malicious code</li>
            <li>Interfere with or disrupt the service or servers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Service Availability</h2>
          <p className="text-muted-foreground leading-relaxed">
            We strive to maintain high availability but do not guarantee uninterrupted access. 
            We reserve the right to modify, suspend, or discontinue any part of the service at any time.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            sigmagit shall not be liable for any indirect, incidental, special, consequential, or 
            punitive damages resulting from your use or inability to use the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to modify these terms at any time. Your continued use of the service 
            after changes are posted constitutes acceptance of the modified terms.
          </p>
        </section>
      </div>
    </div>
  );
}
