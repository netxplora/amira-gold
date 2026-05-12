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

      <SiteFooter />
    </div>
  );
}
