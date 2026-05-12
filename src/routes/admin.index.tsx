import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { formatUSD } from "@/lib/gold-price";
import { Users, Truck, DollarSign, Vault, ShieldCheck, Bitcoin, Sparkles, ArrowRight, Wallet } from "lucide-react";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { useInfrastructure } from "@/lib/infrastructure/InfrastructureProvider";
import { AlertTriangle, CheckCircle, Settings } from "lucide-react";

type Order = { id: string; user_id: string; type: string; status: string; grams: number; total_usd: number; created_at: string };
type Tx = { id: string; user_id: string; type: string; amount_usd: number; description: string | null; created_at: string };
type JewelryOrder = { id: string; user_id: string; status: string; total_usd: number; created_at: string; delivery_full_name: string };

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0, orders: 0, revenue: 0, grams: 0,
    pendingKyc: 0, pendingDeps: 0, pendingWds: 0, treasury: 0, waitlist: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentTx, setRecentTx] = useState<Tx[]>([]);
  const [jewelryOrders, setJewelryOrders] = useState<JewelryOrder[]>([]);
  const { health, isVerifying } = useInfrastructure();
  
  const healthStatus = health?.status || 'healthy';
  const checks = health?.checks || [];

  useEffect(() => {
    (async () => {
      const [
        { count: users },
        { count: orders },
        { data: revData },
        { data: invData },
        { count: pendingKyc },
        { count: pendingDeps },
        { count: pendingWds },
        { data: walletSum },
        { count: waitlist },
        { data: ordersList },
        { data: txList },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total_usd"),
        supabase.from("vaults").select("capacity_grams"),
        supabase.from("kyc_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("crypto_deposits").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("crypto_withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("wallets").select("balance_usd"),
        supabase.from("card_waitlist").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*").neq("type", "jewelry").order("created_at", { ascending: false }).limit(6),
        supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(6),
      ]);
      const { data: jOrders } = await supabase
        .from("orders")
        .select("id,user_id,status,total_usd,created_at,delivery_full_name")
        .eq("type", "jewelry")
        .order("created_at", { ascending: false })
        .limit(8);
      setJewelryOrders((jOrders ?? []) as unknown as JewelryOrder[]);
      const revenue = (revData ?? []).reduce((s, o) => s + Number(o.total_usd), 0);
      const grams = (invData ?? []).reduce((s, v) => s + Number(v.capacity_grams), 0);
      const treasury = (walletSum ?? []).reduce((s, w) => s + Number(w.balance_usd), 0);
      setStats({
        users: users ?? 0, orders: orders ?? 0, revenue, grams,
        pendingKyc: pendingKyc ?? 0, pendingDeps: pendingDeps ?? 0, pendingWds: pendingWds ?? 0,
        treasury, waitlist: waitlist ?? 0,
      });
      setRecentOrders((ordersList ?? []) as Order[]);
      setRecentTx((txList ?? []) as Tx[]);
    })();
    // Realtime: refresh jewelry orders on new inserts
    const ch = supabase.channel("admin-jewelry-orders").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders", filter: "type=eq.jewelry" },
      async () => {
        const { data: jOrders } = await supabase
          .from("orders")
          .select("id,user_id,status,total_usd,created_at,delivery_full_name")
          .eq("type", "jewelry")
          .order("created_at", { ascending: false })
          .limit(8);
        setJewelryOrders((jOrders ?? []) as unknown as JewelryOrder[]);
      },
    ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Command Center"
        title="Admin overview"
        subtitle="A live view of users, orders, treasury, and pending compliance actions."
        icon={<ShieldCheck className="h-6 w-6" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Users" value={stats.users.toLocaleString()} hint="Registered clients" accent="gold" icon={<Users className="h-4 w-4" />} />
        <StatTile label="Active Orders" value={stats.orders.toLocaleString()} hint={`${formatUSD(stats.revenue)} GMV`} accent="silver" icon={<Truck className="h-4 w-4" />} />
        <StatTile label="Treasury" value={formatUSD(stats.treasury)} hint="Sum of user wallets" accent="muted" icon={<Wallet className="h-4 w-4" />} />
        <StatTile label="Vault Capacity" value={`${stats.grams.toLocaleString()} g`} hint="All locations" accent="muted" icon={<Vault className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard to="/admin/kyc" count={stats.pendingKyc} label="KYC pending" icon={<ShieldCheck className="h-4 w-4" />} accent="ruby" />
        <ActionCard to="/admin/crypto" count={stats.pendingDeps} label="Deposits awaiting review" icon={<Bitcoin className="h-4 w-4" />} accent="ruby" />
        <ActionCard to="/admin/crypto" count={stats.pendingWds} label="Withdrawals to send" icon={<Bitcoin className="h-4 w-4" />} accent="ruby" />
        <ActionCard to="/admin/waitlist" count={stats.waitlist} label="Gold Card waitlist" icon={<Sparkles className="h-4 w-4" />} accent="gold" />
        
        <Link to="/admin/configs" className={`group rounded-2xl border bg-card/80 p-5 transition-all hover:-translate-y-0.5 ${healthStatus === 'critical' ? 'border-ruby/40 shadow-ruby/10' : healthStatus === 'warning' ? 'border-amber-500/40' : 'border-emerald-500/30 hover:shadow-emerald-500/5'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">System Health</span>
            {healthStatus === 'critical' ? <AlertTriangle className="h-4 w-4 text-ruby" /> : healthStatus === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle className="h-4 w-4 text-emerald-500" />}
          </div>
          <div className={`mt-2 text-3xl font-bold ${healthStatus === 'critical' ? 'text-ruby' : healthStatus === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`}>
            {isVerifying ? 'Scanning...' : healthStatus === 'healthy' ? 'Healthy' : healthStatus === 'warning' ? 'Warning' : 'Issues'}
          </div>
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground">
            Configure Registry <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/80">
          <CardContent className="p-6">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gold">Recent gold orders</div>
                <h3 className="mt-1 text-lg font-semibold">Latest activity</h3>
              </div>
              <Link to="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
            </div>
            <ul className="space-y-2">
              {recentOrders.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No orders yet.</li>}
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 p-3 text-sm">
                  <div>
                    <div className="font-medium capitalize">{o.type} · {Number(o.grams).toFixed(2)} g</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.user_id.slice(0, 8)}…</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gold">{formatUSD(Number(o.total_usd))}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{o.status}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardContent className="p-6">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gold">Recent jewelry orders</div>
                <h3 className="mt-1 text-lg font-semibold">Marketplace pipeline</h3>
              </div>
              <Link to="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground">Manage →</Link>
            </div>
            <ul className="space-y-2">
              {jewelryOrders.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No jewelry orders yet.</li>}
              {jewelryOrders.map((o) => (
                <Link key={o.id} to="/admin/orders" className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 p-3 text-sm transition-colors hover:border-gold/40">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{o.delivery_full_name || o.user_id.slice(0, 8)}</div>
                    <div className="text-[11px] text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gold">{formatUSD(Number(o.total_usd))}</div>
                    <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${jewelryStatusClass(o.status)}`}>{o.status}</span>
                  </div>
                </Link>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardContent className="p-6">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gold">Treasury flow</div>
                <h3 className="mt-1 text-lg font-semibold">Wallet transactions</h3>
              </div>
              <Link to="/admin/users" className="text-xs text-muted-foreground hover:text-foreground">Users →</Link>
            </div>
            <ul className="space-y-2">
              {recentTx.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No transactions yet.</li>}
              {recentTx.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 p-3 text-sm">
                  <div>
                    <div className="font-medium capitalize">{t.type}</div>
                    <div className="text-[11px] text-muted-foreground">{t.description ?? "—"}</div>
                  </div>
                  <div className={`font-semibold ${Number(t.amount_usd) >= 0 ? "text-emerald-400" : "text-ruby"}`}>
                    {Number(t.amount_usd) >= 0 ? "+" : ""}{formatUSD(Number(t.amount_usd))}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function jewelryStatusClass(status: string): string {
  switch (status) {
    case "pending": return "bg-amber-500/15 text-amber-400";
    case "paid": return "bg-blue-500/15 text-blue-400";
    case "processing": return "bg-violet-500/15 text-violet-400";
    case "shipped": return "bg-emerald-500/15 text-emerald-400";
    case "delivered": return "bg-gold/15 text-gold";
    case "cancelled": return "bg-ruby/15 text-ruby";
    default: return "bg-muted text-muted-foreground";
  }
}

function ActionCard({ to, count, label, icon, accent }: { to: "/admin/kyc" | "/admin/crypto" | "/admin/waitlist"; count: number; label: string; icon: React.ReactNode; accent: "ruby" | "gold" }) {
  const ring = accent === "ruby" ? "border-ruby/40 hover:shadow-ruby" : "border-gold/30 hover:shadow-gold";
  const valueClass = accent === "ruby" ? "text-ruby" : "text-gradient-gold";
  return (
    <Link to={to} className={`group rounded-2xl border bg-card/80 p-5 transition-all hover:-translate-y-0.5 ${ring}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/70">{icon}</span>
      </div>
      <div className={`mt-2 text-3xl font-bold ${valueClass}`}>{count}</div>
      <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground">
        Review <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}
