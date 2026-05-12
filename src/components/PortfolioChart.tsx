import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { Card, CardContent } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

type Point = { date: string; value: number; label: string };

export function PortfolioChart() {
  const { user } = useAuth();
  const { pricePerGram } = useGoldPrice();
  const [data, setData] = useState<Point[]>([]);
  const [range, setRange] = useState<"7D" | "30D" | "90D" | "1Y">("30D");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const days = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 }[range];
      const since = new Date(Date.now() - days * 86400000).toISOString();

      const [{ data: orders }, { data: txs }] = await Promise.all([
        supabase.from("orders").select("created_at,grams,type,status").eq("user_id", user.id).order("created_at"),
        supabase.from("wallet_transactions").select("created_at,amount_usd,type").eq("user_id", user.id).order("created_at"),
      ]);

      // Build cumulative gram balance and cash balance over time
      const events: Array<{ at: number; dGrams: number; dCash: number }> = [];
      (orders ?? []).forEach((o: any) => {
        if (o.status === "cancelled") return;
        const sign = o.type === "sell" ? -1 : 1;
        events.push({ at: +new Date(o.created_at), dGrams: sign * Number(o.grams || 0), dCash: 0 });
      });
      (txs ?? []).forEach((t: any) => {
        const sign = ["deposit", "credit", "sale"].includes(t.type) ? 1 : -1;
        events.push({ at: +new Date(t.created_at), dGrams: 0, dCash: sign * Number(t.amount_usd || 0) });
      });
      events.sort((a, b) => a.at - b.at);

      // Build daily series
      const points: Point[] = [];
      let g = 0, c = 0;
      const start = +new Date(since);
      const end = Date.now();
      let i = 0;
      // apply pre-range events
      while (i < events.length && events[i].at < start) {
        g += events[i].dGrams; c += events[i].dCash; i++;
      }
      const step = 86400000;
      const stride = days <= 30 ? 1 : days <= 90 ? 3 : 14;
      for (let t = start; t <= end; t += step * stride) {
        while (i < events.length && events[i].at <= t + step * stride) {
          g += events[i].dGrams; c += events[i].dCash; i++;
        }
        const d = new Date(t);
        points.push({
          date: d.toISOString().slice(0, 10),
          label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: Math.max(0, g) * pricePerGram + Math.max(0, c),
        });
      }
      setData(points);
    })();
  }, [user, range, pricePerGram]);

  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const change = last - first;
  const pct = first > 0 ? (change / first) * 100 : 0;
  const positive = change >= 0;

  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm text-muted-foreground">Portfolio Value</div>
            <div className="mt-1 text-3xl font-bold tracking-tight">{formatUSD(last)}</div>
            <div className={`mt-1 flex items-center gap-1 text-sm ${positive ? "text-emerald-400" : "text-ruby"}`}>
              {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {positive ? "+" : ""}{formatUSD(change)} ({pct.toFixed(2)}%) · {range}
            </div>
          </div>
          <div className="flex gap-1 rounded-lg border border-border/60 bg-background/40 p-1">
            {(["7D", "30D", "90D", "1Y"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                  range === r ? "bg-gradient-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [formatUSD(v), "Value"]}
              />
              <Area type="monotone" dataKey="value" stroke="var(--gold)" strokeWidth={2} fill="url(#portfolioGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
