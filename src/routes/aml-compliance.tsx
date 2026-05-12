import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, FileText, UserCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/aml-compliance")({
  head: () => ({
    meta: [
      { title: "AML & Compliance | Amira Gold" },
      { name: "description", content: "Amira Gold's Anti-Money Laundering policy, KYC requirements, and global regulatory compliance framework." },
      { property: "og:title", content: "AML & Compliance — Amira Gold" },
      { property: "og:description", content: "Our anti-money-laundering and KYC framework, aligned with FATF, FinCEN, FCA, and DMCC standards." },
    ],
  }),
  component: AMLPage,
});

function AMLPage() {
  const pillars = [
    { i: UserCheck, t: "Know Your Customer", d: "Government ID + selfie + address verification before any transaction over $1,000." },
    { i: FileText, t: "Source of Funds", d: "Enhanced due diligence for deposits over $50,000 — supporting documents required." },
    { i: AlertTriangle, t: "Sanctions Screening", d: "Real-time screening against OFAC, UN, EU, UK and HMT sanctions lists." },
    { i: ShieldCheck, t: "Transaction Monitoring", d: "Behavioural analytics flag suspicious activity for human review." },
  ];
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-mesh-luxury py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-card/60 px-3 py-1 text-xs uppercase tracking-widest text-gold">
            <ShieldCheck className="h-3.5 w-3.5" /> Regulated & audited
          </span>
          <h1 className="mt-4 text-4xl font-bold md:text-6xl">AML & <span className="text-gradient-gold">Compliance</span></h1>
          <p className="mt-4 text-muted-foreground">
            Amira Gold operates a fully documented Anti-Money-Laundering programme aligned with FATF, FinCEN, FCA and DMCC standards.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-2">
          {pillars.map(({ i: Icon, t, d }) => (
            <Card key={t} className="border-border/60 bg-card transition-colors hover:border-gold/40">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground shadow-gold">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-10 border-gold/30 bg-card/80 shadow-gold">
          <CardContent className="space-y-4 p-8">
            <h2 className="text-2xl font-bold">Reporting & escalation</h2>
            <p className="text-sm text-muted-foreground">
              Suspicious Activity Reports (SARs) are filed with the relevant Financial Intelligence Unit within 24 hours of detection.
              All transaction records are retained for a minimum of 7 years.
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Designated Money Laundering Reporting Officer (MLRO)</li>
              <li>Annual independent compliance audit</li>
              <li>Mandatory AML training for all staff</li>
              <li>Whistleblower channel for confidential reporting</li>
            </ul>
          </CardContent>
        </Card>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/60 p-6">
          <div>
            <div className="font-semibold">Need our compliance pack?</div>
            <div className="text-sm text-muted-foreground">Available to institutional partners on request.</div>
          </div>
          <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90 rounded-full">
            <Link to="/contact">Request documents <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}