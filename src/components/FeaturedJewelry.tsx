import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { calcJewelryPrice, type JewelryProduct } from "@/lib/jewelry";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";

export function FeaturedJewelry() {
  const { pricePerGram } = useGoldPrice();
  const [products, setProducts] = useState<JewelryProduct[]>([]);

  useEffect(() => {
    supabase.from("jewelry_products" as never)
      .select("*")
      .eq("active", true)
      .is("deleted_at", null)
      .gt("stock_quantity", 0)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setProducts((data ?? []) as unknown as JewelryProduct[]));
  }, []);

  if (products.length === 0) return null;
  const featured = products.slice(0, 4);
  const newArrivals = products.slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-card/20 to-background py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-gold">
              <Sparkles className="h-3 w-3" /> Featured Jewelry
            </span>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Crafted in 18k–24k gold</h2>
            <p className="mt-2 text-muted-foreground">Handpicked pieces priced live against today's gold rate.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full border-gold/40">
            <Link to="/app/marketplace">Shop the marketplace <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => {
            const price = calcJewelryPrice(p, pricePerGram);
            return (
              <Link key={p.id} to="/app/marketplace/$slug" params={{ slug: p.slug }}>
                <Card className="group h-full overflow-hidden border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold">
                  <div className="relative aspect-square overflow-hidden bg-muted/40">
                    {p.thumbnail_url && (
                      <img src={p.thumbnail_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    )}
                    <Badge className="absolute left-3 top-3 bg-background/80 text-foreground backdrop-blur" variant="outline">{p.purity}</Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="line-clamp-1 font-semibold">{p.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{p.weight_grams}g</div>
                    <div className="mt-2 text-lg font-bold text-gradient-gold">{formatUSD(price.total)}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {newArrivals.length > 0 && (
          <div className="mt-14">
            <div className="mb-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald">New Arrivals</span>
              <h3 className="mt-1 text-xl font-bold md:text-2xl">Fresh additions to the collection</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.map((p) => {
                const price = calcJewelryPrice(p, pricePerGram);
                return (
                  <Link key={p.id} to="/app/marketplace/$slug" params={{ slug: p.slug }}>
                    <Card className="group h-full overflow-hidden border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-emerald/40">
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted/40">
                        {p.thumbnail_url && (
                          <img src={p.thumbnail_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="line-clamp-1 text-sm font-semibold">{p.name}</div>
                        <div className="mt-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{p.purity} · {p.weight_grams}g</span>
                          <span className="font-bold text-gold">{formatUSD(price.total)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}