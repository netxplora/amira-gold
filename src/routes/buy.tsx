import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GoldPriceTicker } from "@/components/GoldPriceTicker";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Truck, Vault } from "lucide-react";
import goldBar from "@/assets/gold-bar-product.jpg";

type Product = { id: string; name: string; weight_grams: number; premium_pct: number };

export const Route = createFileRoute("/buy")({
  head: () => ({
    meta: [
      { title: "Buy Gold Bars — 1g to 100g | Amira Gold" },
      { name: "description", content: "Browse and buy LBMA-certified gold bars from 1g to 100g. Vault storage or insured delivery worldwide." },
      { property: "og:title", content: "Buy Gold Bars — Amira Gold" },
      { property: "og:description", content: "LBMA-certified gold bars from 1g to 100g with vault storage or delivery." },
      { property: "og:image", content: goldBar },
    ],
  }),
  component: BuyPage,
});

function BuyPage() {
  const { pricePerGram } = useGoldPrice();
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    supabase.from("gold_products").select("id,name,weight_grams,premium_pct").eq("active", true).order("weight_grams")
      .then(({ data }) => setProducts(data ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden bg-mesh-luxury py-20">
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-gold/15 blur-[120px]" />
        <div className="mx-auto max-w-4xl px-4 text-center">
          <GoldPriceTicker />
          <h1 className="mt-6 text-4xl font-bold md:text-6xl">
            Buy <span className="text-gradient-gold">physical gold</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">LBMA-certified bars from 1g to 100g. Vault storage or insured delivery.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> 999.9 fineness</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5"><Vault className="h-3.5 w-3.5 text-gold" /> Free vault year 1</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5"><Truck className="h-3.5 w-3.5 text-gold" /> Insured delivery</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        {products.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-border/60 bg-card">
                <CardContent className="p-6">
                  <div className="mx-auto h-24 w-24 animate-pulse rounded-xl bg-muted" />
                  <div className="mt-4 h-4 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-6 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {products.map((p) => {
              const price = Number(p.weight_grams) * pricePerGram * (1 + Number(p.premium_pct) / 100);
              return (
                <Card key={p.id} className="group relative overflow-hidden border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold">
                  <CardContent className="p-6 text-center">
                    <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-xl bg-gradient-to-br from-gold/15 to-card ring-1 ring-gold/30">
                      <img src={goldBar} alt={`${p.weight_grams}g gold bar`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent py-1 text-xs font-bold text-gold">{p.weight_grams}g</span>
                    </div>
                    <h3 className="mt-4 font-semibold">{p.name}</h3>
                    <div className="mt-1 text-xs text-muted-foreground">+{p.premium_pct}% premium</div>
                    <div className="mt-3 text-2xl font-bold text-gradient-gold">{formatUSD(price)}</div>
                    <Button asChild className="mt-4 w-full rounded-full bg-gradient-gold text-gold-foreground hover:opacity-90">
                      <Link to="/app/buy">Buy now</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Storage vs Delivery Comparison */}
      <section className="border-t border-border/40 bg-card/30 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">Flexibility & Security</span>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Your wealth, on your terms</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Whether you prefer the ultimate security of professional vaulting or the tangible reassurance of holding gold in your own hands, Amira Gold provides institutional-grade logistics for both.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-border/60 bg-background transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold">
              <CardContent className="p-10">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-gold text-gold-foreground shadow-gold">
                    <Vault className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold">Allocated Vault Storage</h3>
                </div>
                <p className="mt-5 leading-relaxed text-muted-foreground">
                  The choice for investors who want absolute security and immediate liquidity. Your physical gold is held under your direct legal title in independent, LBMA-approved high-security vaults located in Zurich, Dubai, Singapore, or London.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "First year of allocated storage is completely free.",
                    "Fully insured against all risks by Lloyd's of London.",
                    "Instantly liquidate and sell back to us at the live spot price.",
                    "Subject to independent, third-party quarterly audits.",
                    "Convert to physical delivery at any time."
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" /> 
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-background transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold">
              <CardContent className="p-10">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-gold text-gold-foreground shadow-gold">
                    <Truck className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold">Insured Home Delivery</h3>
                </div>
                <p className="mt-5 leading-relaxed text-muted-foreground">
                  The choice for purists who want to take physical possession. We ship your minted bars globally using the world's most trusted armored logistics networks, ensuring your assets reach your hands safely.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "Transported exclusively via Brinks, Malca-Amit, or Loomis.",
                    "100% replacement insurance active during the entire transit.",
                    "Real-time GPS tracking with strict signature-only receipt.",
                    "Packaged in discreet, tamper-evident secure parcels.",
                    "Customs clearance handled by our concierge team."
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" /> 
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
