import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatUSD } from "@/lib/gold-price";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { Gem, Receipt, Truck, CheckCircle2, Clock, XCircle, Download, Eye, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { downloadJewelryReceiptPDF } from "@/lib/pdf-jewelry-receipt";

export const Route = createFileRoute("/app/jewelry-orders")({
  component: JewelryOrdersPage,
});

type JewelryOrder = {
  id: string;
  created_at: string;
  status: string;
  subtotal_usd: number;
  shipping_usd: number;
  total_usd: number;
  gold_rate_usd_per_gram: number;
  delivery_full_name: string;
  delivery_phone: string | null;
  delivery_address: string;
  delivery_country: string | null;
  tracking_number: string | null;
  notes: string | null;
  courier?: { name: string } | null;
};

type OrderItem = {
  id: string;
  product_name: string;
  product_sku: string;
  weight_grams: number;
  purity: string;
  unit_price_usd: number;
  quantity: number;
  thumbnail_url: string | null;
};

const STATUS_STEPS = ["pending", "processing", "shipped", "delivered"] as const;

function JewelryOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<JewelryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [active, setActive] = useState<JewelryOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("orders")
      .select("*, courier:couriers(name)")
      .eq("user_id", user.id)
      .eq("type", "jewelry")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as unknown as JewelryOrder[]);
        setLoading(false);
      });
  }, [user]);

  const openOrder = async (o: JewelryOrder) => {
    setActive(o);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id);
    setItems((data ?? []) as unknown as OrderItem[]);
  };

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*, courier:couriers(name)")
      .eq("user_id", user.id)
      .eq("type", "jewelry")
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as unknown as JewelryOrder[]);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      const { error } = await supabase.rpc("cancel_jewelry_order", { _order_id: id });
      if (error) throw error;
      toast.success("Order cancelled");
      setActive(null);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order");
    }
  };

  const handlePayWallet = async (id: string) => {
    try {
      const { error } = await supabase.rpc("pay_jewelry_order_with_wallet", { _order_id: id });
      if (error) throw error;
      toast.success("Order paid successfully");
      setActive(null);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    }
  };

  const filtered = useMemo(
    () => orders.filter((o) => statusFilter === "all" || o.status === statusFilter),
    [orders, statusFilter]
  );

  const totalSpent = orders.reduce((s, o) => s + Number(o.total_usd), 0);
  const inTransit = orders.filter((o) => o.status === "shipped" || o.status === "processing").length;
  const delivered = orders.filter((o) => o.status === "delivered").length;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/15 text-amber-500 border-amber-500/30",
      processing: "bg-blue-500/15 text-blue-500 border-blue-500/30",
      shipped: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
      delivered: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
      cancelled: "bg-ruby/15 text-ruby border-ruby/40",
    };
    return map[s] ?? "bg-muted text-muted-foreground border-border/60";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jewelry Marketplace"
        title="My Jewelry Orders"
        subtitle="Track every jewelry purchase, view receipts, and follow shipments end-to-end."
        icon={<Gem className="h-6 w-6" />}
        actions={
          <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90">
            <Link to="/app/marketplace"><ShoppingBag className="mr-2 h-4 w-4" /> Shop jewelry</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="Total Orders" value={orders.length} hint={`${delivered} delivered`} accent="gold" />
        <StatTile label="Lifetime Spend" value={formatUSD(totalSpent)} hint="Across all orders" accent="silver" />
        <StatTile label="In Transit" value={inTransit} hint="Processing or shipped" accent="muted" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading orders…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <Gem className="h-10 w-10 opacity-40" />
              <p className="text-lg">No jewelry orders yet</p>
              <Button asChild variant="outline" className="mt-2"><Link to="/app/marketplace">Browse marketplace</Link></Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-accent/30" onClick={() => navigate({ to: "/app/jewelry-orders/$id", params: { id: o.id } })}>
                    <TableCell className="font-mono text-xs">#{o.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{o.courier?.name ?? "—"}</TableCell>
                    <TableCell className="font-semibold text-gold">{formatUSD(Number(o.total_usd))}</TableCell>
                    <TableCell><Badge variant="outline" className={statusBadge(o.status)}>{o.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openOrder(o); }} title="Quick view">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/app/jewelry-orders/$id" params={{ id: o.id }} onClick={(e) => e.stopPropagation()}>Track</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) setActive(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-gold" /> Order #{active?.id.slice(0, 8).toUpperCase()}</DialogTitle>
          </DialogHeader>
          {active && (
            <OrderDetail 
              order={active} 
              items={items} 
              onCancel={() => handleCancel(active.id)}
              onPayWallet={() => handlePayWallet(active.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderDetail({ 
  order, 
  items, 
  onCancel, 
  onPayWallet 
}: { 
  order: JewelryOrder; 
  items: OrderItem[];
  onCancel: () => void;
  onPayWallet: () => void;
}) {
  const stepIndex = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);
  const cancelled = order.status === "cancelled";

  const downloadReceipt = () => {
    downloadJewelryReceiptPDF({
      orderId: order.id,
      createdAt: order.created_at,
      status: order.status,
      goldRatePerGram: Number(order.gold_rate_usd_per_gram),
      subtotal: Number(order.subtotal_usd),
      shipping: Number(order.shipping_usd),
      total: Number(order.total_usd),
      courier: order.courier?.name ?? null,
      delivery: {
        name: order.delivery_full_name,
        phone: order.delivery_phone,
        address: order.delivery_address,
        country: order.delivery_country,
        tracking: order.tracking_number,
      },
      items: items.map((it) => ({
        name: it.product_name, sku: it.product_sku, purity: it.purity,
        weight: Number(it.weight_grams), qty: it.quantity, unit: Number(it.unit_price_usd),
      })),
    });
    toast.success("Receipt downloaded");
  };

  return (
    <div className="space-y-5">
      {/* Tracker */}
      <div className="rounded-xl border border-border/60 bg-background/40 p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order timeline</div>
        {cancelled ? (
          <div className="flex items-center gap-2 text-ruby"><XCircle className="h-5 w-5" /> Order cancelled</div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            {STATUS_STEPS.map((s, i) => {
              const reached = i <= stepIndex;
              const Icon = i === 0 ? Clock : i === 1 ? Receipt : i === 2 ? Truck : CheckCircle2;
              return (
                <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${reached ? "border-gold bg-gradient-gold text-gold-foreground" : "border-border/60 bg-card text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] uppercase tracking-wide ${reached ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{s}</span>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`absolute mt-4 hidden h-0.5 w-12 ${reached ? "bg-gold" : "bg-border/60"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
        {order.tracking_number && (
          <div className="mt-3 rounded-lg bg-card/60 p-3 text-xs">
            <span className="text-muted-foreground">Tracking number: </span>
            <span className="font-mono font-semibold">{order.tracking_number}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</div>
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-3">
              <div className="h-12 w-12 overflow-hidden rounded bg-muted/40">
                {it.thumbnail_url && <img src={it.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{it.product_name}</div>
                <div className="text-xs text-muted-foreground">{it.purity} · {it.weight_grams}g · qty {it.quantity}</div>
              </div>
              <div className="font-semibold text-gold">{formatUSD(Number(it.unit_price_usd) * it.quantity)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery */}
      <div className="rounded-lg border border-border/60 bg-card/60 p-3 text-sm">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery to</div>
        <div className="font-medium">{order.delivery_full_name}</div>
        <div className="text-muted-foreground">{order.delivery_address}</div>
        {order.delivery_country && <div className="text-muted-foreground">{order.delivery_country}</div>}
        {order.delivery_phone && <div className="text-muted-foreground">Phone: {order.delivery_phone}</div>}
      </div>

      {/* Totals */}
      <div className="space-y-1 rounded-lg border border-gold/30 bg-gold/5 p-3 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatUSD(Number(order.subtotal_usd))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatUSD(Number(order.shipping_usd))}</span></div>
        <div className="flex justify-between border-t border-border/40 pt-1 font-bold"><span>Total</span><span className="text-gold">{formatUSD(Number(order.total_usd))}</span></div>
      </div>

      {order.status === "pending" && (
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={onPayWallet} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
            Pay with Wallet
          </Button>
          <Button variant="outline" onClick={onCancel} className="border-ruby text-ruby hover:bg-ruby/10">
            Cancel Order
          </Button>
        </div>
      )}

      <Button onClick={downloadReceipt} className="w-full bg-card border border-border/60 text-foreground hover:bg-accent/50">
        <Download className="mr-2 h-4 w-4" /> Download receipt
      </Button>
    </div>
  );
}