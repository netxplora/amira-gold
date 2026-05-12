import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Scale } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Amira Gold" },
      { name: "description", content: "Terms of Service governing your use of Amira Gold." },
      { property: "og:title", content: "Terms & Conditions — Amira Gold" },
      { property: "og:description", content: "Terms of Service governing your use of Amira Gold." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background bg-mesh-luxury">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs text-gold"><Scale className="h-3.5 w-3.5" /> Effective: January 2026</div>
        <h1 className="text-4xl font-display font-bold text-gradient-gold">Terms &amp; Conditions</h1>
        <div className="mt-8 space-y-6 text-sm text-muted-foreground">
          <Section title="1. Acceptance">By creating an account or using Amira Gold services, you agree to be bound by these Terms.</Section>
          <Section title="2. Eligibility">You must be at least 18, legally able to contract, and not located in a sanctioned jurisdiction. You must complete identity verification before withdrawals or insured delivery.</Section>
          <Section title="3. Services">Amira Gold offers (a) the purchase of allocated, segregated physical gold stored in LBMA-certified vaults, (b) insured delivery, and (c) crypto deposits/withdrawals to fund your USD wallet.</Section>
          <Section title="4. Allocation">All gold purchased is fully allocated to you. Bars are serial-numbered and segregated. Title transfers to you at the moment of order confirmation.</Section>
          <Section title="5. Pricing &amp; fees">Prices include the live spot rate plus a refining premium displayed at checkout. Storage is free for the first 12 months. Insured delivery is a flat $75 worldwide.</Section>
          <Section title="6. Crypto risk">Cryptocurrency values are volatile. Send only the asset and network shown — wrong-network transfers are typically unrecoverable.</Section>
          <Section title="7. Withdrawals">Withdrawals are subject to KYC verification, AML screening, and may be delayed if our compliance team requires additional information.</Section>
          <Section title="8. Suspension">We may suspend or close accounts that violate these Terms, our AML policy, or applicable law. Funds will be returned subject to investigation.</Section>
          <Section title="9. Liability">To the fullest extent permitted by law, Amira Gold's aggregate liability is limited to the value of the gold you have allocated with us. Insurance covers physical loss in vault and in transit.</Section>
          <Section title="10. Governing law">These Terms are governed by the laws of Switzerland. Disputes will be resolved in the courts of Zurich.</Section>
          <Section title="11. Contact">legal@amiragold.com</Section>
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