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
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-border/60">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Precious Metals Collection</span>
          <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Crafted in 18k–24k Solid Gold</h2>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-2xl">Handcrafted certified jewelry items priced live against daily market spot rates.</p>
        </div>
        <Button asChild variant="outline" className="border-border/70 shadow-xs">
          <Link to="/app/marketplace">Browse Marketplace <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((p) => {
          const price = calcJewelryPrice(p, pricePerGram);
          return (
            <Link key={p.id} to="/app/marketplace/$slug" params={{ slug: p.slug }}>
              <Card className="group h-full overflow-hidden border-border/70 bg-card/90 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover p-0">
                <div className="relative aspect-square overflow-hidden bg-muted/30">
                  {p.thumbnail_url && (
                    <img
                      src={p.thumbnail_url}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <Badge className="absolute left-3 top-3 border-border/70 bg-background/90 text-foreground text-xs font-semibold backdrop-blur" variant="outline">
                    {p.purity}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="line-clamp-1 font-display font-semibold text-foreground text-sm">{p.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{p.weight_grams} grams</div>
                  <div className="mt-2.5 font-display text-base font-bold text-primary">{formatUSD(price.total)}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {newArrivals.length > 0 && (
        <div className="mt-14">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Curated Additions</span>
              <h3 className="font-display mt-1 text-xl font-bold tracking-tight text-foreground">Recent Releases</h3>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.map((p) => {
              const price = calcJewelryPrice(p, pricePerGram);
              return (
                <Link key={p.id} to="/app/marketplace/$slug" params={{ slug: p.slug }}>
                  <Card className="group h-full overflow-hidden border-border/70 bg-card/90 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover p-0">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                      {p.thumbnail_url && (
                        <img
                          src={p.thumbnail_url}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="line-clamp-1 font-display text-sm font-semibold text-foreground">{p.name}</div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{p.purity} · {p.weight_grams}g</span>
                        <span className="font-display font-bold text-primary">{formatUSD(price.total)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}