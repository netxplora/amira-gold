import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatUSD } from "@/lib/gold-price";
import { Receipt, ShoppingBag, Truck, Coins } from "lucide-react";
import { PageHeader, StatTile } from "@/components/PageHeader";

export const Route = createFileRoute("/app/orders")({
  component: OrdersPage,
});

type Order = {
  id: string;
  created_at: string;
  type: "vault" | "delivery" | "digital";
  status: string;
  grams: number;
  quantity: number;
  total_usd: number;
  delivery_address: string | null;
};

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("orders")
      .select("id,created_at,type,status,grams,quantity,total_usd,delivery_address")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as Order[]);
        setLoading(false);
      });
  }, [user]);

  const filtered = orders.filter(
    (o) => (statusFilter === "all" || o.status === statusFilter) && (typeFilter === "all" || o.type === typeFilter)
  );

  const totalSpent = orders.reduce((s, o) => s + Number(o.total_usd), 0);
  const totalGrams = orders.reduce((s, o) => s + Number(o.grams), 0);
  const inTransit = orders.filter((o) => o.status === "shipped" || o.status === "confirmed").length;

  const statusColor = (s: string) => {
    if (s === "allocated" || s === "delivered") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (s === "shipped" || s === "confirmed") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    if (s === "cancelled") return "bg-ruby/15 text-ruby border-ruby/40";
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  };

  const typeIcon = (t: string) => {
    if (t === "delivery") return <Truck className="h-3.5 w-3.5" />;
    if (t === "digital") return <Coins className="h-3.5 w-3.5" />;
    return <ShoppingBag className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Purchase History"
        title="Orders"
        subtitle="Every gold purchase, delivery, and digital trade — fully tracked."
        icon={<Receipt className="h-6 w-6" />}
        actions={
          <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90">
            <Link to="/app/buy"><ShoppingBag className="mr-2 h-4 w-4" /> New order</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="Total Orders" value={orders.length} hint={`${totalGrams.toFixed(4)} g lifetime`} accent="gold" />
        <StatTile label="Total Spent" value={formatUSD(totalSpent)} hint="All-time" accent="silver" />
        <StatTile label="In Transit" value={inTransit} hint="Confirmed or shipped" accent="muted" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="allocated">Allocated</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="vault">Vault</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading orders…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <Receipt className="h-10 w-10 opacity-40" />
              <p className="text-lg">No orders match your filters</p>
              <p className="text-sm">Try adjusting the filters above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Grams</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[11px] capitalize">
                        {typeIcon(o.type)} {o.type}
                      </span>
                    </TableCell>
                    <TableCell>{Number(o.grams).toFixed(4)}g</TableCell>
                    <TableCell>{o.quantity}</TableCell>
                    <TableCell className="font-semibold text-gold">{formatUSD(Number(o.total_usd))}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(o.status)}>{o.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
