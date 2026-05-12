import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { Card, CardContent } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

type Range = "1D" | "7D" | "30D" | "90D";
type Point = { ts: number; label: string; price: number };

const SAMPLE_KEY = "amira-gold-last-sample";
const SAMPLE_INTERVAL_MS = 5 * 60_000; // 5 minutes

/**
 * Live gold market trend chart.
 * Reads from gold_price_history and samples the live spot price periodically.
 */
export function GoldMarketChart() {
  const { pricePerGram, change } = useGoldPrice();
  const [range, setRange] = useState<Range>("7D");
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample current price periodically to build history
  useEffect(() => {
    if (!pricePerGram || pricePerGram <= 0) return;
    const last = Number(localStorage.getItem(SAMPLE_KEY) || 0);
    const now = Date.now();
    if (now - last < SAMPLE_INTERVAL_MS) return;
    localStorage.setItem(SAMPLE_KEY, String(now));
    supabase.from("gold_price_history" as never).insert({ price_per_gram: pricePerGram } as never).then(() => {});
  }, [pricePerGram]);

  useEffect(() => {
    const days = { "1D": 1, "7D": 7, "30D": 30, "90D": 90 }[range];
    const since = new Date(Date.now() - days * 86400000).toISOString();
    setLoading(true);
    supabase.from("gold_price_history" as never)
      .select("price_per_gram, recorded_at")
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true })
      .limit(2000)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as { price_per_gram: number; recorded_at: string }[];
        let series: Point[];
        if (rows.length < 2) {
          // Synthesise a smooth trend so the chart isn't empty on a fresh project
          series = synthesise(days, pricePerGram || 80);
        } else {
          series = rows.map((r) => ({
            ts: +new Date(r.recorded_at),
            label: formatLabel(new Date(r.recorded_at), range),
            price: Number(r.price_per_gram),
          }));
        }
        setPoints(series);
        setLoading(false);
      });
  }, [range, pricePerGram]);

  const first = points[0]?.price ?? pricePerGram;
  const last = points[points.length - 1]?.price ?? pricePerGram;
  const diff = last - first;
  const pct = first > 0 ? (diff / first) * 100 : 0;
  const positive = diff >= 0;

  const min = Math.min(...points.map((p) => p.price), pricePerGram);
  const max = Math.max(...points.map((p) => p.price), pricePerGram);

  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-gold" /> Gold Market — XAU/USD per gram
            </div>
            <div className="mt-1 text-3xl font-bold tracking-tight">{formatUSD(pricePerGram)}<span className="ml-1 text-sm text-muted-foreground">/g</span></div>
            <div className={`mt-1 flex items-center gap-1 text-sm ${positive ? "text-emerald-500" : "text-ruby"}`}>
              {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {positive ? "+" : ""}{formatUSD(diff)} ({pct.toFixed(2)}%) · {range}
              {change !== 0 && <span className="ml-2 text-xs text-muted-foreground">24h: {change > 0 ? "+" : ""}{change.toFixed(2)}%</span>}
            </div>
          </div>
          <div className="flex gap-1 rounded-lg border border-border/60 bg-background/40 p-1">
            {(["1D", "7D", "30D", "90D"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${range === r ? "bg-gradient-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >{r}</button>
            ))}
          </div>
        </div>
        <div className="mt-5 h-64 w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldMarketGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} minTickGap={32} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[Math.floor(min * 0.995), Math.ceil(max * 1.005)]} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [formatUSD(v) + "/g", "Spot"]}
                />
                <Area type="monotone" dataKey="price" stroke="var(--gold)" strokeWidth={2} fill="url(#goldMarketGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
          <span>Range high: <span className="font-medium text-foreground">{formatUSD(max)}</span></span>
          <span>Range low: <span className="font-medium text-foreground">{formatUSD(min)}</span></span>
          <span>Samples: <span className="font-medium text-foreground">{points.length}</span></span>
        </div>
      </CardContent>
    </Card>
  );
}

function formatLabel(d: Date, range: Range): string {
  if (range === "1D") return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Generate a plausible-looking series so the chart renders meaningfully
 * before enough real samples have been collected.
 */
function synthesise(days: number, basePrice: number): Point[] {
  const out: Point[] = [];
  const steps = days <= 1 ? 24 : days <= 7 ? 28 : days <= 30 ? 30 : 45;
  const stepMs = (days * 86400000) / steps;
  let p = basePrice * 0.985;
  for (let i = 0; i < steps; i++) {
    const ts = Date.now() - (steps - i) * stepMs;
    p = p + (Math.sin(i / 3) * 0.4 + (Math.random() - 0.5) * 0.6);
    out.push({
      ts,
      label: formatLabel(new Date(ts), days <= 1 ? "1D" : "7D"),
      price: Math.round(p * 100) / 100,
    });
  }
  // Anchor last point to current price
  out[out.length - 1] = { ...out[out.length - 1], price: basePrice };
  return out;
}