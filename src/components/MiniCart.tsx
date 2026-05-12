import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { calcJewelryPrice, useCart, type JewelryProduct } from "@/lib/jewelry";

export function MiniCart() {
  const cart = useCart();
  const { pricePerGram } = useGoldPrice();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<JewelryProduct[]>([]);

  useEffect(() => {
    if (!open || cart.items.length === 0) return;
    const ids = cart.items.map((i) => i.product_id);
    supabase.from("jewelry_products" as never).select("*").in("id", ids)
      .then(({ data }) => setProducts((data ?? []) as unknown as JewelryProduct[]));
  }, [open, cart.items]);

  const lines = cart.items.map((it) => {
    const p = products.find((x) => x.id === it.product_id);
    if (!p) return null;
    const price = calcJewelryPrice(p, pricePerGram);
    return { p, qty: it.quantity, subtotal: price.total * it.quantity };
  }).filter(Boolean) as { p: JewelryProduct; qty: number; subtotal: number }[];
  const total = lines.reduce((s, l) => s + l.subtotal, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button aria-label="Cart" className="relative rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
          <ShoppingCart className="h-4 w-4" />
          {cart.count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-gold-foreground">
              {cart.count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader><SheetTitle>Your cart ({cart.count})</SheetTitle></SheetHeader>
        <div className="-mx-6 mt-4 flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Your cart is empty.
              <div className="mt-4">
                <Button asChild variant="outline" onClick={() => setOpen(false)}><Link to="/app/marketplace">Browse jewelry</Link></Button>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {lines.map(({ p, qty, subtotal }) => (
                <li key={p.id} className="flex gap-3 rounded-lg border border-border/60 bg-card/40 p-3">
                  <Link to="/app/marketplace/$slug" params={{ slug: p.slug }} onClick={() => setOpen(false)} className="h-14 w-14 shrink-0 overflow-hidden rounded bg-muted/40">
                    {p.thumbnail_url && <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to="/app/marketplace/$slug" params={{ slug: p.slug }} onClick={() => setOpen(false)} className="line-clamp-1 text-sm font-medium hover:underline">{p.name}</Link>
                    <div className="text-xs text-muted-foreground">{p.purity} · qty {qty}</div>
                    <div className="text-sm font-semibold text-gold">{formatUSD(subtotal)}</div>
                  </div>
                  <button onClick={() => cart.remove(p.id)} className="self-start rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {lines.length > 0 && (
          <div className="border-t border-border/60 pt-4">
            <div className="mb-3 flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-bold text-gold">{formatUSD(total)}</span></div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild onClick={() => setOpen(false)}><Link to="/app/cart">View cart</Link></Button>
              <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90" onClick={() => setOpen(false)}><Link to="/app/checkout">Checkout</Link></Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}