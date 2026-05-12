import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, StatTile } from "@/components/PageHeader";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { formatUSD } from "@/lib/gold-price";
import { BarChart3, DollarSign, Users, ShoppingBag, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({ component: Analytics });

type Order = { created_at: string; total_usd: number; grams: number; type: string; status: string };
type Tx = { created_at: string; amount_usd: number; type: string };
type ProfileRow = { created_at: string };

function Analytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [range, setRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - range * 86400000).toISOString();
      const [{ data: o }, { data: t }, { data: p }] = await Promise.all([
        supabase.from("orders").select("created_at,total_usd,grams,type,status").gte("created_at", since),
        supabase.from("wallet_transactions").select("created_at,amount_usd,type").gte("created_at", since),
        supabase.from("profiles").select("created_at").gte("created_at", since),
      ]);
      setOrders((o ?? []) as Order[]);
      setTxs((t ?? []) as Tx[]);
      setProfiles((p ?? []) as ProfileRow[]);
    })();
  }, [range]);

  // Daily series
  const days: string[] = [];
  for (let i = range - 1; i >= 0; i--) {
    days.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  }
  const series = days.map((d) => {
    const dayOrders = orders.filter((o) => o.created_at.slice(0, 10) === d);
    const dayUsers = profiles.filter((p) => p.created_at.slice(0, 10) === d);
    return {
      date: d.slice(5),
      revenue: dayOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_usd), 0),
      grams: dayOrders.reduce((s, o) => s + Number(o.grams || 0), 0),
      orders: dayOrders.length,
      users: dayUsers.length,
    };
  });

  const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_usd), 0);
  const totalGrams = orders.reduce((s, o) => s + Number(o.grams || 0), 0);
  const newUsers = profiles.length;
  const orderCount = orders.length;
  const aov = orderCount > 0 ? totalRevenue / orderCount : 0;

  // Tx type breakdown
  const txByType: Record<string, number> = {};
  txs.forEach((t) => { txByType[t.type] = (txByType[t.type] ?? 0) + Math.abs(Number(t.amount_usd)); });
  const txData = Object.entries(txByType).map(([name, value]) => ({ name, value }));
  const COLORS = ["var(--gold)", "var(--silver)", "var(--ruby)", "oklch(0.62 0.16 250)", "oklch(0.55 0.10 150)"];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        subtitle="Real-time platform performance"
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <div className="flex gap-1 rounded-lg border border-border/60 bg-background/40 p-1">
            {([7, 30, 90] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1 text-xs ${range === r ? "bg-gradient-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {r}D
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<DollarSign className="h-4 w-4" />} label="Revenue" value={formatUSD(totalRevenue)} accent="gold" />
        <StatTile icon={<ShoppingBag className="h-4 w-4" />} label="Orders" value={String(orderCount)} accent="silver" />
        <StatTile icon={<TrendingUp className="h-4 w-4" />} label="Gold Sold" value={`${totalGrams.toFixed(1)} g`} accent="gold" />
        <StatTile icon={<Users className="h-4 w-4" />} label="New Users" value={String(newUsers)} accent="ruby" />
      </div>

      <Card className="border-border/60 bg-card">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Revenue Trend</h3>
            <span className="text-xs text-muted-foreground">Avg order: {formatUSD(aov)}</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatUSD(v)} />
                <Area type="monotone" dataKey="revenue" stroke="var(--gold)" strokeWidth={2} fill="url(#revG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Daily Orders & Users</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="orders" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="users" fill="var(--ruby)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Wallet Activity by Type</h3>
            <div className="h-64">
              {txData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={txData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2} stroke="none">
                      {txData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => formatUSD(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No wallet activity yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
