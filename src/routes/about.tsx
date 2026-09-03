import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Target, Users, Globe2, ShieldCheck, Scale, FileCheck } from "lucide-react";
import ceoPortrait from "@/assets/ceo-portrait.jpg";
import vaultInterior from "@/assets/vault-interior.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Amira Gold — Physical Gold Custody Platform" },
      { name: "description", content: "Amira Gold provides secure, insured, and transparent physical gold custody for individual investors and institutions worldwide." },
      { property: "og:title", content: "About Amira Gold" },
      { property: "og:description", content: "Secure, insured, and transparent physical gold custody for investors worldwide." },
      { property: "og:image", content: vaultInterior },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border/40 bg-gradient-to-b from-card/30 via-background to-background py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">About Amira Gold</span>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Physical Gold Ownership,<br /><span className="text-primary">Simple and Secure</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-xs text-muted-foreground leading-relaxed sm:text-sm md:text-base">
            Amira Gold is a gold custody platform that lets individuals and institutions buy, store, invest in, and transact with physical precious metals through a direct allocation model.
          </p>
        </div>
      </section>

      {/* Stats / Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Target, t: "Our Mission", d: "Make physical gold ownership simple, secure, and accessible to everyone globally." },
            { i: Award, t: "LBMA-Certified", d: "Every bar meets London Bullion Market Association Good Delivery standards." },
            { i: Users, t: "12,400+ Clients", d: "Trusted by individual investors and institutions across 40+ countries." },
            { i: Globe2, t: "6 Depository Vaults", d: "Zurich, Dubai, Singapore, London, Toronto, and Riyadh — all fully insured." },
          ].map(({ i: Icon, t, d }) => (
            <Card key={t} className="border-border/70 bg-card shadow-card p-5 transition-all hover:border-primary/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display mt-3 text-sm font-semibold text-foreground sm:text-base">{t}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CEO Quote */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-2xl border border-border/70 bg-card p-6 shadow-card sm:p-8 md:grid-cols-[auto_1fr] md:items-center md:p-10">
          <div className="mx-auto">
            <div className="h-36 w-36 overflow-hidden rounded-full border-2 border-border/70 shadow-card">
              <img src={ceoPortrait} alt="Amira Aldahab, Founder & CEO" loading="lazy" className="h-full w-full object-cover" />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Leadership</span>
            <h2 className="font-display mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">Founded by Amira Aldahab</h2>
            <blockquote className="mt-3 text-sm italic leading-relaxed text-foreground/90 sm:text-base">
              "Gold has safeguarded wealth through centuries of economic cycles. Our commitment is to provide transparent, direct, and secure physical gold custody for modern investors."
            </blockquote>
            <div className="mt-3 font-display text-sm font-semibold text-foreground">Amira Aldahab</div>
            <div className="text-xs text-muted-foreground">Founder &amp; Chief Executive Officer</div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center sm:mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Principles</span>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Core Values</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">The principles that guide how we operate and serve clients.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: FileCheck,
                title: "Absolute Transparency",
                desc: "No hidden fees, transparent spot pricing, and published proof of reserves. Trust is built on factual openness, not promises.",
              },
              {
                icon: ShieldCheck,
                title: "Uncompromising Security",
                desc: "Client assets are protected by independent audits, strict access protocols, and full insurance underwritten by Lloyd's of London.",
              },
              {
                icon: Scale,
                title: "Direct Legal Ownership",
                desc: "Gold is held in your name under direct bailment title — never co-mingled with company assets or exposed to third-party credit risk.",
              },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <Card key={v.title} className="border-border/70 bg-card shadow-card p-5 sm:p-6 transition-all hover:border-primary/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display mt-3 text-base font-semibold text-foreground">{v.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Global Presence</span>
          <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Corporate Offices</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="border-border/70 bg-card shadow-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Globe2 className="h-4 w-4" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Global Headquarters</h3>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Amira Gold Ltd.<br />
              Level 42, Dubai International Financial Centre (DIFC)<br />
              Dubai, United Arab Emirates
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-500">
              <ShieldCheck className="h-3.5 w-3.5" /> Regulated Financial Entity
            </div>
          </Card>

          <Card className="border-border/70 bg-card shadow-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Globe2 className="h-4 w-4" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">European Office</h3>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Amira Gold AG<br />
              Bahnhofstrasse 100<br />
              8001 Zurich, Switzerland
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-500">
              <Award className="h-3.5 w-3.5" /> LBMA Associate Member
            </div>
          </Card>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}


