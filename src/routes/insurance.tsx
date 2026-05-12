import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Check } from "lucide-react";

export const Route = createFileRoute("/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance Tiers | Amira Gold" },
      { name: "description", content: "Insurance coverage tiers for vault storage and physical delivery — underwritten by Lloyd's of London." },
      { property: "og:title", content: "Insurance Tiers — Amira Gold" },
      { property: "og:description", content: "Standard, Premium and Sovereign coverage underwritten by Lloyd's of London." },
    ],
  }),
  component: InsurancePage,
});

function InsurancePage() {
  const tiers = [
    {
      name: "Standard",
      price: "Included",
      max: "$50,000",
      perks: ["Vault storage coverage", "Insured delivery (Brink's)", "Basic claims handling", "10-day claim window"],
      accent: "border-border/60",
    },
    {
      name: "Premium",
      price: "0.25% / yr",
      max: "$500,000",
      perks: ["Everything in Standard", "Same-day claim review", "All-risk coverage", "30-day claim window", "Loomis or Malca-Amit"],
      accent: "border-gold/40 shadow-gold",
      featured: true,
    },
    {
      name: "Sovereign",
      price: "0.45% / yr",
      max: "Unlimited",
      perks: ["Everything in Premium", "Dedicated account officer", "Bespoke vault arrangements", "Coverage for transit & storage simultaneously", "Lloyd's lead syndicate"],
      accent: "border-ruby/40 shadow-ruby",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-mesh-luxury py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-card/60 px-3 py-1 text-xs uppercase tracking-widest text-gold">
            <Shield className="h-3.5 w-3.5" /> Underwritten by Lloyd's of London
          </span>
          <h1 className="mt-4 text-4xl font-bold md:text-6xl">Insurance <span className="text-gradient-gold">Tiers</span></h1>
          <p className="mt-4 text-muted-foreground">
            Every gram in our vaults and in transit is insured. Choose the coverage that matches your portfolio.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <Card key={t.name} className={`relative bg-card/80 ${t.accent}`}>
              {t.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold-foreground shadow-gold">
                  Most popular
                </div>
              )}
              <CardContent className="p-8">
                <div className="text-xs uppercase tracking-widest text-gold">{t.name}</div>
                <div className="mt-2 text-3xl font-bold text-gradient-gold">{t.price}</div>
                <div className="mt-1 text-xs text-muted-foreground">Coverage up to {t.max}</div>
                <ul className="mt-6 space-y-2 text-sm">
                  {t.perks.map((p) => (
                    <li key={p} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-gold" /> {p}</li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
                  <Link to="/app/buy">Choose {t.name}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Coverage details and certificates available on request. Premiums billed monthly against your wallet balance.
        </p>
      </section>
      <SiteFooter />
    </div>
  );
}