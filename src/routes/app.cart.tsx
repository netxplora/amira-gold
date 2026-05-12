import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { calcJewelryPrice, useCart, type JewelryProduct } from "@/lib/jewelry";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ShoppingBag, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/cart")({
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const { pricePerGram } = useGoldPrice();
  const navigate = useNavigate();
  const [products, setProducts] = useState<JewelryProduct[]>([]);

  useEffect(() => {
    if (cart.items.length === 0) { setProducts([]); return; }
    const ids = cart.items.map((i) => i.product_id);
    supabase.from("jewelry_products" as never).select("*").in("id", ids)
      .then(({ data }) => setProducts((data ?? []) as unknown as JewelryProduct[]));
  }, [cart.items]);

  const lines = cart.items.map((it) => {
    const p = products.find((x) => x.id === it.product_id);
    if (!p) return null;
    const price = calcJewelryPrice(p, pricePerGram);
    const overstock = it.quantity > p.stock_quantity;
    const outOfStock = p.stock_quantity <= 0;
    return { p, qty: it.quantity, unit: price.total, subtotal: price.total * it.quantity, overstock, outOfStock };
  }).filter(Boolean) as { p: JewelryProduct; qty: number; unit: number; subtotal: number; overstock: boolean; outOfStock: boolean }[];

  const total = lines.reduce((s, l) => s + l.subtotal, 0);
  const hasIssues = lines.some((l) => l.overstock || l.outOfStock);

  return (
    <div className="space-y-6">
      <PageHeader title="Your Cart" subtitle={`${cart.count} item${cart.count === 1 ? "" : "s"}`} />

      {lines.length === 0 ? (
        <Card><CardContent className="space-y-3 p-12 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild><Link to="/app/marketplace">Browse jewelry</Link></Button>
        </CardContent></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card><CardContent className="divide-y divide-border/60 p-0">
            {lines.map(({ p, qty, unit, subtotal, overstock, outOfStock }) => (
              <div key={p.id} className={`flex gap-4 p-4 ${outOfStock ? "bg-ruby/5" : ""}`}>
                <Link to="/app/marketplace/$slug" params={{ slug: p.slug }} className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted/40">
                  {p.thumbnail_url && <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />}
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link to="/app/marketplace/$slug" params={{ slug: p.slug }} className="font-medium hover:underline">{p.name}</Link>
                    <p className="text-xs text-muted-foreground">{p.purity} · {p.weight_grams}g · {formatUSD(unit)} each</p>
                    {outOfStock && <p className="mt-1 flex items-center gap-1 text-xs text-ruby"><AlertTriangle className="h-3 w-3" /> Out of stock — please remove</p>}
                    {!outOfStock && overstock && <p className="mt-1 flex items-center gap-1 text-xs text-amber-500"><AlertTriangle className="h-3 w-3" /> Only {p.stock_quantity} available — quantity will be capped</p>}
                    {!outOfStock && !overstock && p.stock_quantity <= 5 && <p className="mt-1 text-xs text-amber-500">Only {p.stock_quantity} left in stock</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" min={1} max={Math.max(1, p.stock_quantity)} value={qty}
                      disabled={outOfStock}
                      onChange={(e) => cart.setQty(p.id, Math.max(1, Math.min(p.stock_quantity, Number(e.target.value) || 1)))}
                      className="h-8 w-20" />
                    <Button size="sm" variant="ghost" onClick={() => cart.remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="font-semibold">{formatUSD(subtotal)}</div>
              </div>
            ))}
          </CardContent></Card>

          <Card className="h-fit border-gold/40">
            <CardContent className="space-y-3 p-5">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatUSD(total)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span>Calculated at checkout</span></div>
              <div className="border-t border-border/60 pt-3 text-lg font-bold flex justify-between"><span>Total</span><span className="text-gold">{formatUSD(total)}</span></div>
              {hasIssues && (
                <div className="rounded-md border border-ruby/30 bg-ruby/5 p-2 text-xs text-ruby flex items-start gap-1.5">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>Resolve stock issues above before proceeding to checkout.</span>
                </div>
              )}
              <Button disabled={hasIssues} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90" onClick={() => navigate({ to: "/app/checkout" })}>Proceed to checkout</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}