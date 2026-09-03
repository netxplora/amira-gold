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

      const points: Point[] = [];
      let g = 0, c = 0;
      const start = +new Date(since);
      const end = Date.now();
      let i = 0;
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
    <Card className="border-border/70 bg-card/90 shadow-card">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portfolio Valuation</div>
            <div className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">{formatUSD(last)}</div>
            <div className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold ${positive ? "text-emerald-500" : "text-destructive"}`}>
              {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>{positive ? "+" : ""}{formatUSD(change)} ({pct.toFixed(2)}%) · {range}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-muted/40 p-1">
            {(["7D", "30D", "90D", "1Y"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  range === r
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
                formatter={(v: number) => [formatUSD(v), "Value"]}
              />
              <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} fill="url(#portfolioGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
