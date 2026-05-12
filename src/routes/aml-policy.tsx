import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/aml-policy")({
  head: () => ({
    meta: [
      { title: "AML Policy — Amira Gold" },
      { name: "description", content: "Anti-Money Laundering and Counter-Terrorist Financing policy." },
      { property: "og:title", content: "AML Policy — Amira Gold" },
      { property: "og:description", content: "Anti-Money Laundering and Counter-Terrorist Financing policy." },
    ],
  }),
  component: AMLPolicyPage,
});

function AMLPolicyPage() {
  return (
    <div className="min-h-screen bg-background bg-mesh-luxury">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-ruby/40 bg-ruby/5 px-3 py-1 text-xs text-ruby"><ShieldAlert className="h-3.5 w-3.5" /> Compliance document</div>
        <h1 className="text-4xl font-display font-bold text-gradient-gold">AML Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Anti-Money Laundering &amp; Counter-Terrorist Financing</p>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground">
          <Section title="1. Commitment">Amira Gold has a zero-tolerance policy for money laundering, terrorist financing, sanctions evasion, fraud, and any other financial crime. We comply with FATF recommendations and applicable Swiss, EU and UAE legislation.</Section>
          <Section title="2. Customer Due Diligence (CDD)">Before any trading activity, every customer must verify identity (government-issued photo ID, selfie liveness, address). Enhanced Due Diligence (EDD) applies to PEPs, high-risk jurisdictions, and large transactions.</Section>
          <Section title="3. Ongoing monitoring">All transactions are screened in real-time against sanctions lists (OFAC, UN, EU, UK HMT) and PEP databases. Anomalous behaviour triggers manual review.</Section>
          <Section title="4. Source of funds">For deposits or single transactions exceeding USD 10,000, customers may be asked to provide documented source of funds and source of wealth.</Section>
          <Section title="5. Record keeping">All KYC records, transaction data and correspondence are retained for at least 5 years after the end of the customer relationship.</Section>
          <Section title="6. Reporting">Suspicious activity reports (SARs) are filed with the relevant Financial Intelligence Unit (FIU) without tipping off the customer.</Section>
          <Section title="7. Training">All staff receive mandatory AML/CTF training annually. The Compliance Officer reports directly to the board.</Section>
          <Section title="8. Restricted activities">We do not service customers from FATF black-listed jurisdictions, do not accept anonymous accounts, do not accept cash, and do not deal in privacy coins.</Section>
          <Section title="9. Contact">compliance@amiragold.com</Section>
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