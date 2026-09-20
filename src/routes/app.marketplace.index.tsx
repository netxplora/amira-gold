import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { calcJewelryPrice, useCart, type JewelryCategory, type JewelryProduct } from "@/lib/jewelry";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Gem } from "lucide-react";

export const Route = createFileRoute("/app/marketplace/")({
  component: MarketplacePage,
  loader: async () => {
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("jewelry_categories").select("*").eq("active", true).order("sort_order"),
      supabase.from("jewelry_products").select("*").eq("active", true).is("deleted_at", null).order("created_at", { ascending: false }),
    ]);
    return {
      categories: (cats ?? []) as unknown as JewelryCategory[],
      products: (prods ?? []) as unknown as JewelryProduct[]
    };
  },
  head: () => ({
    meta: [
      { title: "Jewelry Marketplace — Amira Gold" },
      { name: "description", content: "Curated 18k, 22k, and 24k solid gold jewelry priced against live market rates." },
    ]
  }),
});

function MarketplacePage() {
  const data = Route.useLoaderData() as { categories: JewelryCategory[]; products: JewelryProduct[] };
  const categories = data?.categories || [];
  const products = data?.products || [];
  const { pricePerGram } = useGoldPrice();
  const cart = useCart();

  const [cat, setCat] = useState<string>("all");
  const [purity, setPurity] = useState<string>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (cat !== "all" && p.category_id !== cat) return false;
      if (purity !== "all" && p.purity !== purity) return false;
      const price = calcJewelryPrice(p, pricePerGram).total;
      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;
      return true;
    });
  }, [products, cat, purity, minPrice, maxPrice, pricePerGram]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fine Jewelry Collection"
        title="Jewelry Marketplace"
        subtitle="Solid 18k–24k gold jewelry items with live pricing calculated against precious metal market rates."
        icon={<Gem className="h-6 w-6" />}
        actions={
          <Button asChild variant="outline" className="border-border/70 shadow-xs font-semibold gap-2">
            <Link to="/app/cart"><ShoppingCart className="h-4 w-4" /> Cart {cart.count > 0 && <Badge className="ml-1 px-1.5 py-0.2 text-[10px]">{cart.count}</Badge>}</Link>
          </Button>
        }
      />

      <Card className="border-border/70 bg-card shadow-card">
        <CardContent className="grid gap-3 p-4 sm:p-5 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Category</Label>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="h-9 text-xs border-border/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Gold Karat Purity</Label>
            <Select value={purity} onValueChange={setPurity}>
              <SelectTrigger className="h-9 text-xs border-border/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purities</SelectItem>
                <SelectItem value="18k">18k (750 Fine)</SelectItem>
                <SelectItem value="21k">21k (875 Fine)</SelectItem>
                <SelectItem value="22k">22k (916 Fine)</SelectItem>
                <SelectItem value="24k">24k (999.9 Pure)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Min Price (USD)</Label>
            <Input type="number" inputMode="decimal" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="$0" className="h-9 text-xs border-border/70" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Max Price (USD)</Label>
            <Input type="number" inputMode="decimal" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="No limit" className="h-9 text-xs border-border/70" />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-border/70 bg-card shadow-card">
          <CardContent className="p-12 text-center text-xs text-muted-foreground">
            <Gem className="mx-auto mb-2 h-8 w-8 opacity-30" />
            <p className="font-display text-sm font-semibold text-foreground">No jewelry items match your filter selection.</p>
            <p className="mt-1">Try selecting a different category or adjusting the price range.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const price = calcJewelryPrice(p, pricePerGram);
            return (
              <Link key={p.id} to="/app/marketplace/$slug" params={{ slug: p.slug }} className="group">
                <Card className="card-3d h-full overflow-hidden border-border/70 bg-card p-0 flex flex-col justify-between">
                  <div className="relative aspect-square overflow-hidden bg-muted/30">
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
                    )}
                    <Badge className="absolute right-2 top-2 border-border/70 bg-background/90 text-foreground text-[10px] font-semibold backdrop-blur" variant="outline">
                      {p.purity}
                    </Badge>
                    {p.stock_quantity === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-xs font-semibold">Out of stock</div>
                    )}
                  </div>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="line-clamp-1 font-display text-xs font-semibold text-foreground sm:text-sm">{p.name}</h3>
                      <span className="shrink-0 text-[10px] text-muted-foreground sm:text-xs">{p.weight_grams}g</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between border-t border-border/40 pt-2">
                      <span className="font-display text-xs font-bold text-primary sm:text-base">{formatUSD(price.total)}</span>
                      <span className="text-[10px] text-muted-foreground">live rate</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}