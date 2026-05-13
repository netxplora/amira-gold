import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GoldPriceTicker } from "@/components/GoldPriceTicker";
import { TrendingUp, Zap, Wallet, ShieldCheck, ArrowRight } from "lucide-react";
import heroGold from "@/assets/hero-gold-premium.jpg";

export const Route = createFileRoute("/invest")({
  head: () => ({
    meta: [
      { title: "Invest in Gold from $10 — Fractional Digital Gold | Amira Gold" },
      { name: "description", content: "Start investing in gold from $10. Fractional digital gold backed 1:1 by physical reserves. Buy and sell at live spot price." },
      { property: "og:title", content: "Invest in Gold — Amira Gold" },
      { property: "og:description", content: "Fractional digital gold from $10. Backed 1:1 by physical reserves." },
      { property: "og:image", content: heroGold },
    ],
  }),
  component: InvestPage,
});

function InvestPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden bg-mesh-luxury py-24">
        <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-ruby/15 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 -top-20 h-96 w-96 rounded-full bg-gold/20 blur-[120px]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-2 md:items-center">
          <div>
            <GoldPriceTicker />
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] md:text-6xl">
              Invest in <br /><span className="text-gradient-gold">gold from $10</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Buy fractional digital gold at the live spot price. Sell anytime. Backed 1:1 by allocated physical bullion.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
                <Link to="/app/invest">Start investing <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-border/60 bg-card/40 backdrop-blur">
                <Link to="/buy">Buy Bars Instead</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-gold opacity-15 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border/60 ring-gold-soft">
              <img src={heroGold} alt="Premium gold bars" loading="lazy" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Why Amira</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Built for serious investors</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { i: Zap, t: "Instant trading", d: "Buy and sell at the live spot price 24/7." },
            { i: Wallet, t: "Low minimum", d: "Start with as little as $10." },
            { i: TrendingUp, t: "Track performance", d: "Real-time portfolio analytics." },
            { i: ShieldCheck, t: "Fully backed", d: "1:1 by physical, audited gold." },
          ].map(({ i: Icon, t, d }) => (
            <Card key={t} className="group border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground shadow-gold">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-border/40 bg-card/30 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">The Process</span>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">How digital fractional gold works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              We bridge the gap between traditional physical gold markets and modern fintech. Here is exactly what happens when you invest through Amira Gold.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
             {[
               { n: "01", t: "Fund Your Account", d: "Deposit funds easily via international wire transfer, credit card, or supported digital currencies. Your uninvested funds are held securely in segregated, top-tier banking institutions." },
               { n: "02", t: "Buy Fractional Gold", d: "Purchase gold based on exact weight (down to 0.01g) or a specific dollar amount. Your order is instantly executed against the live global spot price, completely bypassing expensive retail premiums." },
               { n: "03", t: "Physical Allocation", d: "The moment your trade settles, physical gold bullion of the exact equivalent weight is legally allocated to your name in our LBMA-certified, fully insured vaults." },
               { n: "04", t: "Monitor Portfolio", d: "Track your gold's performance in real-time. View daily valuation changes, historical trends, and comprehensive market analytics right from your private dashboard." },
               { n: "05", t: "Liquidate or Redeem", d: "Sell your holdings instantly back to the market for cash 24/7. Alternatively, accumulate enough weight and request insured physical delivery of minted bars directly to your door." }
             ].map(s => (
               <Card key={s.n} className="group relative overflow-hidden border-border/60 bg-background transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold">
                 <div className="absolute right-4 top-4 text-5xl font-bold text-gold/10 transition-colors group-hover:text-gold/20">{s.n}</div>
                 <CardContent className="relative p-8">
                   <h3 className="mt-4 text-xl font-semibold text-foreground">{s.t}</h3>
                   <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                 </CardContent>
               </Card>
             ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-card to-background p-12 text-center">
          <div className="absolute inset-0 bg-mesh-luxury opacity-30" />
          <div className="relative">
            <h2 className="text-3xl font-bold">Start building your gold portfolio today</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Join thousands of investors securing their wealth with Amira Gold. Create your account in minutes.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Link to="/auth">Open Free Account <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
