import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { calcJewelryPrice, type JewelryProduct } from "@/lib/jewelry";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

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
  const newArrivals = products.slice(4, 8);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-border/60">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Precious Metals Collection</span>
          <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Crafted in 18k–24k Solid Gold</h2>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed sm:text-sm max-w-2xl">Handcrafted certified jewelry items priced live against daily market spot rates.</p>
        </div>
        <Button asChild variant="outline" className="border-border/70 shadow-2xs">
          <Link to="/app/marketplace">Browse Marketplace <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((p) => {
          const price = calcJewelryPrice(p, pricePerGram);
          return (
            <Link key={p.id} to="/app/marketplace/$slug" params={{ slug: p.slug }}>
              <Card className="card-3d group h-full overflow-hidden border-border/70 bg-card p-0 flex flex-col justify-between">
                <div className="relative aspect-square overflow-hidden bg-muted/30">
                  {p.thumbnail_url && (
                    <img
                      src={p.thumbnail_url}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <Badge className="absolute left-2.5 top-2.5 border-border/70 bg-background/90 text-foreground text-[10px] font-semibold backdrop-blur" variant="outline">
                    {p.purity}
                  </Badge>
                </div>
                <CardContent className="p-3 sm:p-4">
                  <div className="line-clamp-1 font-display font-semibold text-foreground text-xs sm:text-sm">{p.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{p.weight_grams} grams</div>
                  <div className="mt-2 font-display text-sm font-bold text-primary sm:text-base">{formatUSD(price.total)}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {newArrivals.length > 0 && (
        <div className="mt-12 sm:mt-16">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Curated Additions</span>
              <h3 className="font-display mt-1 text-xl font-bold tracking-tight text-foreground">Recent Releases</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.map((p) => {
              const price = calcJewelryPrice(p, pricePerGram);
              return (
                <Link key={p.id} to="/app/marketplace/$slug" params={{ slug: p.slug }}>
                  <Card className="card-3d group h-full overflow-hidden border-border/70 bg-card p-0 flex flex-col justify-between">
                    <div className="relative aspect-square overflow-hidden bg-muted/30">
                      {p.thumbnail_url && (
                        <img
                          src={p.thumbnail_url}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <CardContent className="p-3 sm:p-4">
                      <div className="line-clamp-1 font-display text-xs font-semibold text-foreground sm:text-sm">{p.name}</div>
                      <div className="mt-1 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{p.purity}</span>
                        <span className="font-display font-semibold text-primary">{formatUSD(price.total)}</span>
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