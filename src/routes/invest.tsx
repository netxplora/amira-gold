import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoldPriceTicker } from "@/components/GoldPriceTicker";
import { TrendingUp, Zap, Wallet, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import heroGold from "@/assets/hero-gold-premium.jpg";

export const Route = createFileRoute("/invest")({
  head: () => ({
    meta: [
      { title: "Invest in Fractional Gold from $10 | Amira Gold" },
      { name: "description", content: "Start investing in fractional physical gold from $10. 100% backed by audited physical reserves. Buy and sell at live spot rates." },
      { property: "og:title", content: "Invest in Fractional Gold — Amira Gold" },
      { property: "og:description", content: "Fractional digital gold from $10. Backed 1:1 by physical vault reserves." },
      { property: "og:image", content: heroGold },
    ],
  }),
  component: InvestPage,
});

function InvestPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Header */}
      <section className="border-b border-border/40 bg-gradient-to-b from-card/30 via-background to-background py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-2 md:items-center lg:px-8">
          <div>
            <GoldPriceTicker />
            <h1 className="font-display mt-5 text-3xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Invest in Physical Gold <br /><span className="text-primary">Starting From $10</span>
            </h1>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed sm:text-sm md:text-base">
              Buy fractional digital gold at live market spot rates. Liquidate anytime with 100% backing by allocated physical bullion bars.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-xs font-semibold">
                <Link to="/app/invest">Start Fractional Plan <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border/70">
                <Link to="/buy">Browse Bullion Bars</Link>
              </Button>
            </div>
          </div>

          <div>
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
              <img src={heroGold} alt="Premium gold bullion bars" loading="lazy" className="h-full w-full object-cover aspect-[4/3]" />
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Highlights */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Advantages</span>
          <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Built for Long-Term Wealth Preservation</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Zap, t: "Instant Trading", d: "Buy and sell at wholesale spot rates 24/7 with zero waiting period." },
            { i: Wallet, t: "Low Minimum", d: "Start your gold allocation from just $10 without retail bar markups." },
            { i: TrendingUp, t: "Performance Analytics", d: "Track live valuation, gram accumulation, and historical gains in your dashboard." },
            { i: ShieldCheck, t: "100% Backed", d: "Every fraction corresponds to physical gold stored in audited depositories." },
          ].map(({ i: Icon, t, d }) => (
            <Card key={t} className="border-border/70 bg-card shadow-card p-5 transition-all hover:border-primary/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display mt-3 text-base font-semibold text-foreground">{t}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">The Process</span>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">How Fractional Gold Custody Works</h2>
            <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground leading-relaxed sm:text-sm">
              We connect physical bullion vault depositories with modern digital allocation tools.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { n: "01", t: "Fund Account", d: "Deposit via bank wire, card, or digital payment into segregated accounts." },
              { n: "02", t: "Buy Fractional Gold", d: "Purchase by exact grams (down to 0.01g) or custom USD budget at live spot price." },
              { n: "03", t: "Physical Allocation", d: "Equivalent gold is legally allocated to your name in insured depository vaults." },
              { n: "04", t: "Monitor Holdings", d: "Track live valuations, audit receipts, and market movements in your dashboard." },
              { n: "05", t: "Liquidate or Deliver", d: "Sell instantly for cash or accumulate grams and request physical bar delivery." },
            ].map((s) => (
              <Card key={s.n} className="border-border/70 bg-card shadow-card p-5 transition-all hover:border-primary/40">
                <div className="text-xs font-bold uppercase tracking-wider text-primary">Step {s.n}</div>
                <h3 className="font-display mt-2 text-sm font-semibold text-foreground sm:text-base">{s.t}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.d}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg" className="shadow-xs font-semibold">
              <Link to="/app/invest">Open Fractional Gold Account <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-primary/30 bg-card p-6 shadow-card sm:p-10 md:p-12">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Get Started</span>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Start Your Gold Allocation Today
            </h2>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed sm:text-sm">
              Open an account in minutes and begin your first fractional gold purchase backed by insured physical vault reserves.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-xs font-semibold">
                <Link to="/auth">Open Free Account <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border/70">
                <Link to="/buy">Browse Physical Bars</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
