import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { ShoppingCart, Sparkles } from "lucide-react";

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
      { name: "description", content: "Shop curated 18k, 22k, and 24k gold jewelry. Transparent pricing updated with live gold rates." },
      { property: "og:title", content: "Amira Gold Jewelry Marketplace" },
      { property: "og:description", content: "Exquisite gold jewelry with real-time pricing and secure global delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }
    ]
  }),
});

function MarketplacePage() {
  const data = Route.useLoaderData() as { categories: JewelryCategory[]; products: JewelryProduct[] };
  const categories = data?.categories || [];
  const products = data?.products || [];
  const { pricePerGram } = useGoldPrice();
  const cart = useCart();
  const [loading, setLoading] = useState(false);

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
        title="Jewelry Marketplace"
        subtitle="Curated 18k–24k gold jewelry. Prices update with the live gold rate."
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link to="/app/cart"><ShoppingCart className="h-4 w-4" /> Cart {cart.count > 0 && <Badge className="ml-1">{cart.count}</Badge>}</Link>
          </Button>
        }
      />

      <Card className="border-border/60">
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Purity</Label>
            <Select value={purity} onValueChange={setPurity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All purities</SelectItem>
                <SelectItem value="18k">18k</SelectItem>
                <SelectItem value="22k">22k</SelectItem>
                <SelectItem value="24k">24k</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Min price</Label>
            <Input type="number" inputMode="decimal" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="$0" />
          </div>
          <div>
            <Label className="text-xs">Max price</Label>
            <Input type="number" inputMode="decimal" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="No limit" />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-xl border border-border/40 bg-muted/30" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground"><Sparkles className="mx-auto mb-2 h-8 w-8 opacity-40" />No products match your filters.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const price = calcJewelryPrice(p, pricePerGram);
            return (
              <Link key={p.id} to="/app/marketplace/$slug" params={{ slug: p.slug }} className="group">
                <Card className="overflow-hidden border-border/60 transition-all hover:border-gold/60 hover:shadow-gold">
                  <div className="relative aspect-square overflow-hidden bg-muted/40">
                    {p.thumbnail_url
                      ? <img src={p.thumbnail_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      : <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>}
                    <Badge className="absolute right-2 top-2 bg-background/80 text-foreground backdrop-blur">{p.purity}</Badge>
                    {p.stock_quantity === 0 && <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-semibold">Out of stock</div>}
                  </div>
                  <CardContent className="space-y-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 font-semibold">{p.name}</h3>
                      <span className="shrink-0 text-xs text-muted-foreground">{p.weight_grams}g</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gold">{formatUSD(price.total)}</span>
                      <span className="text-[11px] text-muted-foreground">incl. making</span>
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