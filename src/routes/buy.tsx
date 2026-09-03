import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GoldPriceTicker } from "@/components/GoldPriceTicker";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Truck, Vault, CheckCircle2, ArrowRight } from "lucide-react";
import goldBar from "@/assets/gold-bar-product.jpg";

type Product = { id: string; name: string; weight_grams: number; premium_pct: number };

export const Route = createFileRoute("/buy")({
  head: () => ({
    meta: [
      { title: "Buy Physical Gold Bars — 1g to 100g | Amira Gold" },
      { name: "description", content: "Browse and purchase LBMA-certified physical gold bars from 1g to 100g. Insured global depository vault storage or secure courier delivery." },
      { property: "og:title", content: "Buy Gold Bars — Amira Gold" },
      { property: "og:description", content: "LBMA-certified physical gold bars with global vault storage or insured courier delivery." },
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

      {/* Hero Header */}
      <section className="border-b border-border/40 bg-gradient-to-b from-card/30 via-background to-background py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <GoldPriceTicker />
          <h1 className="font-display mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Buy <span className="text-primary">Physical Gold Bars</span>
          </h1>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed sm:text-sm md:text-base max-w-2xl mx-auto">
            LBMA-certified Good Delivery bullion bars from 1g to 100g. Choose insured custody in bonded vaults or armored home delivery.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 text-foreground font-medium shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> 999.9 Fine Gold
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 text-foreground font-medium shadow-2xs">
              <Vault className="h-3.5 w-3.5 text-primary" /> Free Year 1 Vault Storage
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 text-foreground font-medium shadow-2xs">
              <Truck className="h-3.5 w-3.5 text-primary" /> Insured Courier Delivery
            </span>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">Certified Mint Bullion Bars</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Live quotes updated every 15 seconds against market spot rates</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-border/70 bg-card shadow-card">
                <CardContent className="p-5">
                  <div className="mx-auto h-24 w-24 animate-pulse rounded-xl bg-muted/40" />
                  <div className="mt-4 h-4 animate-pulse rounded bg-muted/40" />
                  <div className="mt-2 h-6 animate-pulse rounded bg-muted/40" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {products.map((p) => {
              const price = Number(p.weight_grams) * pricePerGram * (1 + Number(p.premium_pct) / 100);
              return (
                <Card key={p.id} className="group overflow-hidden border-border/70 bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover p-0 flex flex-col justify-between">
                  <div className="p-5 text-center">
                    <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                      <img
                        src={goldBar}
                        alt={`${p.weight_grams}g gold bar`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-1 right-1 rounded-sm border border-border/60 bg-background/90 px-1.5 py-0.5 text-[10px] font-bold text-foreground backdrop-blur">
                        {p.weight_grams}g
                      </span>
                    </div>
                    <h3 className="font-display mt-4 text-sm font-semibold text-foreground">{p.name}</h3>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{p.premium_pct}% mint premium</div>
                    <div className="font-display mt-2 text-xl font-bold text-primary">{formatUSD(price)}</div>
                  </div>
                  <div className="p-4 pt-0">
                    <Button asChild className="w-full shadow-xs font-semibold" size="sm">
                      <Link to="/app/buy">Buy Bullion Bar</Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Storage vs Delivery Comparison */}
      <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Custody Options</span>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Secure Depository or Direct Delivery</h2>
            <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground leading-relaxed sm:text-sm">
              Amira Gold provides complete flexibility to manage, store, or physically redeem your gold bullion assets at any time.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/70 bg-card shadow-card p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Vault className="h-5 w-5" />
                </div>
                <h3 className="font-display mt-4 text-xl font-bold text-foreground">Global Vault Depository Storage</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed sm:text-sm">
                  Store in insured, high-security bonded depositories in Zurich, Dubai, Singapore, and London with direct legal title.
                </p>
                <ul className="mt-5 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Free custody storage for the first 12 months</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 100% underwritten by Lloyd's of London</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Instant 24/7 sell-back liquidity with zero delay</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Regular third-party audit reports &amp; assay certificates</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-border/50">
                <Button asChild variant="outline" className="w-full border-border/70">
                  <Link to="/proof-of-reserves">Learn About Vault Reserves →</Link>
                </Button>
              </div>
            </Card>

            <Card className="border-border/70 bg-card shadow-card p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Truck className="h-5 w-5" />
                </div>
                <h3 className="font-display mt-4 text-xl font-bold text-foreground">Insured Armored Home Delivery</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed sm:text-sm">
                  Take physical possession of your serialized bullion bars delivered directly to your doorstep with discrete security packaging.
                </p>
                <ul className="mt-5 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Dispatched via Brinks, Loomis, and Malca-Amit</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Full transit insurance covering replacement value</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Tamper-evident serialized blister packaging</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Signature-required secure handover verification</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-border/50">
                <Button asChild className="w-full shadow-xs font-semibold">
                  <Link to="/app/buy">Start Purchase Flow <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
