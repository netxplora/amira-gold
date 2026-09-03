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
import { Receipt, ShoppingBag, Truck, Coins, Vault } from "lucide-react";
import { PageHeader, StatTile } from "@/components/PageHeader";

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

export const Route = createFileRoute("/app/orders")({
  component: OrdersPage,
});

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
    if (s === "allocated" || s === "delivered") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (s === "shipped" || s === "confirmed") return "border-primary/30 bg-primary/10 text-primary";
    if (s === "cancelled") return "border-destructive/30 bg-destructive/10 text-destructive";
    return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
  };

  const typeIcon = (t: string) => {
    if (t === "delivery") return <Truck className="h-3.5 w-3.5" />;
    if (t === "digital") return <Coins className="h-3.5 w-3.5" />;
    return <Vault className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Order Activity"
        title="Order History"
        subtitle="Complete record of your physical bullion purchases, vault allocations, and deliveries."
        icon={<Receipt className="h-6 w-6" />}
        actions={
          <Button asChild className="shadow-xs font-semibold">
            <Link to="/app/buy"><ShoppingBag className="mr-1.5 h-4 w-4" /> New Purchase</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total Orders" value={orders.length} hint={`${totalGrams.toFixed(4)} g acquired`} accent="gold" />
        <StatTile label="Total Capital Settled" value={formatUSD(totalSpent)} hint="Lifetime volume" accent="silver" />
        <StatTile label="In Transit / Processing" value={inTransit} hint="Awaiting delivery/allocation" accent="muted" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9 text-xs border-border/70"><SelectValue placeholder="Filter by status" /></SelectTrigger>
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
          <SelectTrigger className="w-44 h-9 text-xs border-border/70"><SelectValue placeholder="Filter by type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All custody types</SelectItem>
            <SelectItem value="vault">Vault Storage</SelectItem>
            <SelectItem value="delivery">Armored Delivery</SelectItem>
            <SelectItem value="digital">Digital Allocation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/70 bg-card shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Loading orders…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <Receipt className="h-10 w-10 opacity-30" />
              <p className="font-display text-sm font-semibold text-foreground">No matching orders found</p>
              <p className="text-xs">Try selecting a different status or filter above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Custody Mode</TableHead>
                    <TableHead className="text-xs">Gold Weight</TableHead>
                    <TableHead className="text-xs">Quantity</TableHead>
                    <TableHead className="text-xs">Total (USD)</TableHead>
                    <TableHead className="text-right text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow key={o.id} className="border-border/40 hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(o.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium capitalize text-foreground">
                          {typeIcon(o.type)} {o.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-display font-medium text-xs">{Number(o.grams).toFixed(4)} g</TableCell>
                      <TableCell className="text-xs">{o.quantity}</TableCell>
                      <TableCell className="font-display font-semibold text-xs text-foreground">
                        {formatUSD(Number(o.total_usd))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={`capitalize font-medium text-[11px] ${statusColor(o.status)}`}>
                          {o.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
