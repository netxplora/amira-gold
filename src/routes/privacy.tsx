import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Amira Gold" },
      { name: "description", content: "How Amira Gold collects, uses, and protects your personal data." },
      { property: "og:title", content: "Privacy Policy — Amira Gold" },
      { property: "og:description", content: "How Amira Gold collects, uses, and protects your personal data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background bg-mesh-luxury">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/5 px-3 py-1 text-xs text-emerald"><ShieldCheck className="h-3.5 w-3.5" /> Last updated: January 2026</div>
        <h1 className="text-4xl font-display font-bold text-gradient-gold">Privacy Policy</h1>
        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-sm text-muted-foreground">
          <Section title="1. Introduction">
            Amira Gold ("we", "us", "our") respects your privacy. This Privacy Policy explains what personal information we collect, how we use it, how we share it, and the choices you have. By using our services, you agree to the collection and use of information in accordance with this policy.
          </Section>
          <Section title="2. Information we collect">
            We collect identity information (name, date of birth, government ID, address) for KYC/AML compliance, contact details (email, phone), transaction data (purchases, deposits, withdrawals), device data (IP address, browser, OS), and any communications you send us.
          </Section>
          <Section title="3. How we use your information">
            We use it to (a) operate, maintain and secure the Service, (b) verify your identity and meet our legal obligations, (c) process transactions, (d) detect and prevent fraud, (e) communicate with you, and (f) improve the Service.
          </Section>
          <Section title="4. Sharing">
            We share data only with: regulated KYC providers, custody and vaulting partners, payment processors, auditors, and law enforcement where required by law. We never sell your personal data.
          </Section>
          <Section title="5. Data retention">
            We retain account, transaction and KYC records for at least 5 years after account closure to comply with AML and tax legislation.
          </Section>
          <Section title="6. Security">
            All sensitive data is encrypted in transit (TLS 1.3) and at rest. KYC documents are stored in a private, access-controlled bucket. Access is limited to authorised personnel.
          </Section>
          <Section title="7. Your rights">
            You may request access, correction, export or deletion of your personal data subject to legal retention requirements. Email <a className="text-gold hover:underline" href="mailto:privacy@amiragold.com">privacy@amiragold.com</a>.
          </Section>
          <Section title="8. Cookies">
            We use only essential cookies for authentication and session management. We do not use marketing trackers without consent.
          </Section>
          <Section title="9. Changes">
            We may update this policy from time to time. Material changes will be notified by email and in-app at least 30 days in advance.
          </Section>
          <Section title="10. Contact">
            Questions? Reach the Data Protection Officer at <a className="text-gold hover:underline" href="mailto:privacy@amiragold.com">privacy@amiragold.com</a>.
          </Section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-display font-semibold text-foreground">{title}</h2>
      <p className="leading-relaxed">{children}</p>
    </section>
  );
}