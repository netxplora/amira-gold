import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUSD } from "@/lib/gold-price";
import { downloadJewelryReceiptPDF } from "@/lib/pdf-jewelry-receipt";
import { ArrowLeft, Clock, Bitcoin, CreditCard, Download, FileImage, Receipt, Truck, XCircle, AlertCircle, Package, CheckCircle2, Copy } from "lucide-react";
import { JewelryPaymentDialog } from "@/components/JewelryPaymentDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/jewelry-orders/$id")({
  component: OrderDetailsPage,
});

type JOrder = {
  id: string; created_at: string; updated_at: string; status: string;
  subtotal_usd: number; shipping_usd: number; total_usd: number; gold_rate_usd_per_gram: number;
  delivery_full_name: string; delivery_phone: string | null; delivery_address: string; delivery_country: string | null;
  tracking_number: string | null; notes: string | null;
  payment_method: string; payment_proof_url: string | null; payment_proof_status: string;
  courier?: { name: string; logo_url: string | null } | null;
};
type JItem = { id: string; product_name: string; product_sku: string; weight_grams: number; purity: string; unit_price_usd: number; quantity: number; thumbnail_url: string | null };

const TIMELINE = [
  { key: "pending", label: "Order placed", icon: Clock, desc: "We received your order and are preparing it." },
  { key: "paid", label: "Payment confirmed", icon: Receipt, desc: "Payment verified. Awaiting fulfilment." },
  { key: "processing", label: "Processing", icon: Package, desc: "Your jewelry is being prepared and quality-checked." },
  { key: "shipped", label: "Shipped", icon: Truck, desc: "Your order is on its way." },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, desc: "Your order has been delivered." },
] as const;

function OrderDetailsPage() {
  const { id } = useParams({ from: "/app/jewelry-orders/$id" });
  const { user } = useAuth();
  const [order, setOrder] = useState<JOrder | null>(null);
  const [items, setItems] = useState<JItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayDialog, setShowPayDialog] = useState(false);

  const load = () => {
    supabase.from("orders").select("*, courier:couriers(name, logo_url)").eq("id", id).maybeSingle()
      .then(({ data }) => setOrder((data ?? null) as unknown as JOrder | null));
    supabase.from("order_items").select("*").eq("order_id", id)
      .then(({ data }) => { setItems((data ?? []) as unknown as JItem[]); setLoading(false); });
  };

  useEffect(() => {
    load();
    const ch = supabase.channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!order) return (
    <div className="space-y-3">
      <p>Order not found.</p>
      <Button asChild variant="outline"><Link to="/app/jewelry-orders"><ArrowLeft className="mr-2 h-4 w-4" />Back to orders</Link></Button>
    </div>
  );

  const cancelled = order.status === "cancelled";
  const stepIdx = TIMELINE.findIndex((s) => s.key === order.status);

  const downloadReceipt = () => {
    downloadJewelryReceiptPDF({
      orderId: order.id, createdAt: order.created_at, status: order.status,
      goldRatePerGram: Number(order.gold_rate_usd_per_gram),
      subtotal: Number(order.subtotal_usd), shipping: Number(order.shipping_usd), total: Number(order.total_usd),
      courier: order.courier?.name ?? null,
      delivery: { name: order.delivery_full_name, phone: order.delivery_phone, address: order.delivery_address, country: order.delivery_country, tracking: order.tracking_number },
      items: items.map((it) => ({ name: it.product_name, sku: it.product_sku, purity: it.purity, weight: Number(it.weight_grams), qty: it.quantity, unit: Number(it.unit_price_usd) })),
    });
    toast.success("Receipt downloaded");
  };

  const copyTracking = () => {
    if (!order.tracking_number) return;
    navigator.clipboard.writeText(order.tracking_number);
    toast.success("Tracking number copied");
  };

  const switchPaymentToCrypto = async () => {
    if (!order) return;
    const { error } = await supabase.rpc("set_jewelry_payment_method", { _order_id: order.id, _method: "crypto" });
    if (error) { toast.error(error.message); return; }
    load();
  };

  const handlePayWallet = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("pay_jewelry_order_with_wallet", { _order_id: order.id });
      if (error) throw error;
      toast.success("Payment successful!");
      load();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order || !confirm("Are you sure you want to cancel this order? This will release the reserved items.")) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("cancel_jewelry_order", { _order_id: order.id });
      if (error) throw error;
      toast.success("Order cancelled");
      load();
    } catch (err: any) {
      toast.error(err.message || "Cancellation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/app/jewelry-orders"><ArrowLeft className="mr-2 h-4 w-4" />All orders</Link></Button>

      <PageHeader
        eyebrow={`Order #${order.id.slice(0, 8).toUpperCase()}`}
        title={cancelled ? "Order cancelled" : (TIMELINE[stepIdx]?.label ?? "In progress")}
        subtitle={`Placed ${new Date(order.created_at).toLocaleString()}`}
        icon={<Receipt className="h-6 w-6" />}
        actions={
          <Button onClick={downloadReceipt} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
            <Download className="mr-2 h-4 w-4" /> Receipt PDF
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Action Required: Wallet Payment Failed */}
          {order.status === "pending" && order.payment_method === "wallet" && (
            <Card className="border-ruby/50 bg-ruby/5"><CardContent className="p-5 space-y-3">
              <h2 className="font-semibold text-ruby flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Action Required</h2>
              <p className="text-sm">Your order is reserved but not yet paid. Please ensure your wallet has sufficient funds, then click <strong>Pay Now</strong>.</p>
              <div className="flex flex-wrap items-center gap-3">
                 <Button onClick={handlePayWallet} className="bg-ruby text-white hover:bg-ruby/90" disabled={loading}>
                   {loading ? "Processing..." : "Pay Now"}
                 </Button>
                 <Button variant="outline" onClick={switchPaymentToCrypto}>Switch to Crypto</Button>
                 <Button variant="ghost" className="text-ruby hover:bg-ruby/10 hover:text-ruby" onClick={handleCancel}>Cancel Order</Button>
              </div>
            </CardContent></Card>
          )}

          {/* Action Required: Crypto Payment */}
          {order.status === "pending" && order.payment_method === "crypto" && (
            <Card className="border-gold bg-gold/5"><CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold text-gold flex items-center gap-2"><Bitcoin className="h-5 w-5" /> Crypto Payment Required</h2>
                <Button variant="ghost" size="sm" className="h-8 text-ruby hover:bg-ruby/10 hover:text-ruby" onClick={handleCancel}>Cancel Order</Button>
              </div>
              {order.payment_proof_status === "none" || order.payment_proof_status === "rejected" ? (
                <>
                  {order.payment_proof_status === "rejected" && (
                    <div className="text-ruby text-sm font-medium">Your previous payment proof was rejected. Please upload a valid receipt.</div>
                  )}
                  <p className="text-sm">To complete your order, please send <strong>{formatUSD(Number(order.total_usd))}</strong> in cryptocurrency and upload a screenshot of your transaction receipt.</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button 
                      className="bg-gradient-gold text-gold-foreground font-semibold" 
                      onClick={() => setShowPayDialog(true)}
                    >
                      Pay Now
                    </Button>
                  </div>
                </>
              ) : order.payment_proof_status === "submitted" ? (
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded bg-gold/20 flex items-center justify-center text-gold"><FileImage className="h-5 w-5" /></div>
                   <div>
                     <div className="font-medium text-sm">Proof submitted</div>
                     <div className="text-xs text-muted-foreground">Awaiting admin verification</div>
                   </div>
                </div>
              ) : null}
            </CardContent></Card>
          )}

          {/* Timeline */}
          <Card><CardContent className="p-5">
            <h2 className="mb-4 font-semibold">Tracking timeline</h2>
            {cancelled ? (
              <div className="flex items-center gap-2 rounded-lg border border-ruby/30 bg-ruby/5 p-3 text-ruby">
                <XCircle className="h-5 w-5" /> This order was cancelled.
              </div>
            ) : (
              <ol className="relative space-y-5 border-l border-border/60 pl-6">
                {TIMELINE.map((step, i) => {
                  const reached = i <= stepIdx;
                  const current = i === stepIdx;
                  const Icon = step.icon;
                  return (
                    <li key={step.key} className="relative">
                      <span className={`absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full border-2 ${reached ? "border-gold bg-gradient-gold text-gold-foreground" : "border-border bg-card text-muted-foreground"}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className={`text-sm font-semibold ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                        {current && <Badge variant="outline" className="ml-2 border-gold/40 bg-gold/10 text-gold">Current</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{step.desc}</div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent></Card>

          {/* Courier & tracking */}
          {(order.courier || order.tracking_number) && (
            <Card><CardContent className="p-5 space-y-3">
              <h2 className="font-semibold">Shipment</h2>
              {order.courier && (
                <div className="flex items-center gap-3">
                  {order.courier.logo_url ? (
                    <img src={order.courier.logo_url} alt={order.courier.name} className="h-10 w-10 rounded object-contain" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-gold/10 text-gold"><Truck className="h-5 w-5" /></div>
                  )}
                  <div>
                    <div className="font-medium">{order.courier.name}</div>
                    <div className="text-xs text-muted-foreground">Courier service</div>
                  </div>
                </div>
              )}
              {order.tracking_number ? (
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Tracking number</div>
                    <div className="font-mono text-sm font-semibold">{order.tracking_number}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyTracking}><Copy className="h-3 w-3" /></Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Tracking number will appear once your order ships.</p>
              )}
            </CardContent></Card>
          )}

          {/* Items */}
          <Card><CardContent className="p-5 space-y-3">
            <h2 className="font-semibold">Items ({items.length})</h2>
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-3">
                  <div className="h-14 w-14 overflow-hidden rounded bg-muted/40">
                    {it.thumbnail_url && <img src={it.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{it.product_name}</div>
                    <div className="text-xs text-muted-foreground">{it.purity} · {it.weight_grams}g · {it.product_sku} · qty {it.quantity}</div>
                    <div className="text-xs text-muted-foreground">{formatUSD(Number(it.unit_price_usd))} each</div>
                  </div>
                  <div className="font-semibold text-gold">{formatUSD(Number(it.unit_price_usd) * it.quantity)}</div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </div>

        <div className="space-y-6">
          {/* Totals */}
          <Card className="border-gold/40"><CardContent className="space-y-2 p-5">
            <h2 className="font-semibold">Summary</h2>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatUSD(Number(order.subtotal_usd))}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span>{formatUSD(Number(order.shipping_usd))}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gold rate</span><span>{formatUSD(Number(order.gold_rate_usd_per_gram))}/g</span></div>
            <div className="border-t border-border/60 pt-2 text-base font-bold flex justify-between"><span>Total</span><span className="text-gold">{formatUSD(Number(order.total_usd))}</span></div>
          </CardContent></Card>

          {/* Delivery */}
          <Card><CardContent className="p-5 space-y-1">
            <h2 className="font-semibold mb-2">Delivery address</h2>
            <div className="font-medium">{order.delivery_full_name}</div>
            <div className="text-sm text-muted-foreground">{order.delivery_address}</div>
            {order.delivery_country && <div className="text-sm text-muted-foreground">{order.delivery_country}</div>}
            {order.delivery_phone && <div className="text-sm text-muted-foreground">Phone: {order.delivery_phone}</div>}
            {order.notes && <div className="mt-2 text-xs italic text-muted-foreground">Note: {order.notes}</div>}
          </CardContent></Card>
        </div>
      </div>

      {order && (
        <JewelryPaymentDialog
          open={showPayDialog}
          onOpenChange={setShowPayDialog}
          orderId={order.id}
          totalAmount={Number(order.total_usd)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
