import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { calcJewelryPrice, useCart, type JewelryProduct } from "@/lib/jewelry";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/marketplace/$slug")({
  component: ProductDetail,
  loader: async ({ params }) => {
    const { data } = await supabase.from("jewelry_products").select("*").eq("slug", params.slug).maybeSingle();
    if (!data) throw new Error("Product not found");
    return { product: data as unknown as JewelryProduct };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) return {};
    return {
      meta: [
        { title: `${product.name} — Amira Gold Marketplace` },
        { name: "description", content: product.description || `Buy ${product.name} at Amira Gold.` },
        { property: "og:title", content: product.name },
        { property: "og:description", content: product.description || undefined },
        { property: "og:image", content: product.thumbnail_url || undefined },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
});

function ProductDetail() {
  const data = Route.useLoaderData() as { product: JewelryProduct };
  const product = data?.product;
  const { pricePerGram } = useGoldPrice();
  const cart = useCart();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  if (!product) return <div className="space-y-3"><p>Product not found.</p><Button asChild variant="outline"><Link to="/app/marketplace"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button></div>;

  const price = calcJewelryPrice(product, pricePerGram);
  const images = [product.thumbnail_url, ...(product.gallery_urls || [])].filter(Boolean) as string[];
  const inStock = product.stock_quantity > 0;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/app/marketplace"><ArrowLeft className="mr-2 h-4 w-4" />Back to marketplace</Link></Button>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted/40">
            {images[active] ? <img src={images[active]} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((src, i) => (
                <button key={i} onClick={() => setActive(i)} className={`aspect-square overflow-hidden rounded-md border ${i === active ? "border-gold" : "border-border/60"}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{product.purity}</Badge>
              <span className="text-xs text-muted-foreground">SKU {product.sku}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
            {product.description && <p className="mt-2 text-muted-foreground">{product.description}</p>}
          </div>

          <Card className="border-border/60">
            <CardContent className="space-y-2 p-5">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Weight</span><span>{product.weight_grams} g</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Live gold rate</span><span>{formatUSD(pricePerGram)} / g</span></div>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gold value</span><span>{formatUSD(price.goldValue)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Making charge</span><span>{formatUSD(price.making)}</span></div>
              <Separator className="my-2" />
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-gold">{formatUSD(price.total)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="text-sm">
            {inStock
              ? <span className="text-emerald-500">In stock — {product.stock_quantity} available</span>
              : <span className="text-destructive">Out of stock</span>}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={!inStock} onClick={() => { cart.add(product.id, 1); toast.success("Added to cart"); }} variant="outline" className="gap-2"><ShoppingCart className="h-4 w-4" /> Add to cart</Button>
            <Button disabled={!inStock} onClick={() => { cart.add(product.id, 1); navigate({ to: "/app/checkout" }); }} className="gap-2 bg-gradient-gold text-gold-foreground hover:opacity-90"><Zap className="h-4 w-4" /> Buy now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}