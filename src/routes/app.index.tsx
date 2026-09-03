import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  ShoppingBag, TrendingUp, Truck, Award, ChevronRight, ShieldCheck, ShieldAlert,
  Package, DollarSign, Sparkles, Globe, HelpCircle, CheckCircle2, CreditCard, ArrowRight,
  ArrowUpRight, ArrowDownRight, RefreshCw, Layers, History, Scale,
} from "lucide-react";
import { Flag, VAULT_LOCATIONS } from "@/components/Flag";
import { PortfolioChart } from "@/components/PortfolioChart";
import { WaitlistDialog } from "@/components/WaitlistDialog";

export const Route = createFileRoute("/app/")({
  component: Overview,
});

type VaultHolding = { grams: number; vault_name: string; vault_location: string | null };
type ActivityItem = { id: string; type: string; created_at: string; grams?: number; amount_usd?: number; status: string };

function Overview() {
  const { user } = useAuth();
  const { pricePerGram, change } = useGoldPrice();
  const [balance, setBalance] = useState(0);
  const [grams, setGrams] = useState(0);
  const [vaultHoldings, setVaultHoldings] = useState<VaultHolding[]>([]);
  const [primaryVault, setPrimaryVault] = useState<{ name: string; location: string } | null>(null);
  const [kycStatus, setKycStatus] = useState<string>("none");
  const [fullName, setFullName] = useState<string>("");
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!user) return;
    // Load wallet balance
    supabase.from("wallets").select("balance_usd").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setBalance(Number(data?.balance_usd ?? 0)));

    // Load holdings
    supabase.from("holdings")
      .select("grams,vault:vaults(name,location)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as Array<{ grams: number; vault: { name: string; location: string } | null }>;
        const total = rows.reduce((s, h) => s + Number(h.grams), 0);
        setGrams(total);
        const mapped: VaultHolding[] = rows.map((r) => ({
          grams: Number(r.grams),
          vault_name: r.vault?.name ?? "Digital Gold",
          vault_location: r.vault?.location ?? null,
        }));
        setVaultHoldings(mapped);
        const top = [...mapped].sort((a, b) => b.grams - a.grams)[0];
        if (top && top.vault_location) setPrimaryVault({ name: top.vault_location, location: top.vault_name });
      });

    // Load profile
    supabase.from("profiles").select("kyc_status,full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setKycStatus(data?.kyc_status ?? "none");
        setFullName(data?.full_name ?? "");
      });

    // Load recent activity (orders & transactions)
    Promise.all([
      supabase.from("orders").select("id,type,grams,total_price_usd,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
      supabase.from("wallet_transactions").select("id,type,amount_usd,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
    ]).then(([ordersRes, txsRes]) => {
      const orders = (ordersRes.data ?? []).map((o: any) => ({
        id: o.id,
        type: o.type === "buy" ? "Bullion Purchase" : "Gold Liquidation",
        created_at: o.created_at,
        grams: Number(o.grams),
        amount_usd: Number(o.total_price_usd),
        status: o.status === "completed" ? "Allocated" : o.status === "pending" ? "Processing" : o.status,
      }));
      const txs = (txsRes.data ?? []).map((t: any) => ({
        id: t.id,
        type: t.type === "deposit" ? "Wallet Deposit" : t.type === "withdrawal" ? "Bank Withdrawal" : "Account Transfer",
        created_at: t.created_at,
        amount_usd: Number(t.amount_usd),
        status: "Settled",
      }));
      const combined = [...orders, ...txs].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5);
      setRecentActivities(combined);
    });
  }, [user]);

  const portfolio = grams * pricePerGram;
  const totalValue = portfolio + balance;
  const ozs = grams / 31.1035;
  const firstName = (fullName || user?.email?.split("@")[0] || "there").split(" ")[0];

  // Pie chart data
  const SLICE_COLORS = ["var(--primary)", "oklch(0.65 0.14 160)", "oklch(0.60 0.16 250)", "oklch(0.70 0.12 60)", "oklch(0.50 0.05 250)"];
  const pieData = vaultHoldings.length > 0
    ? vaultHoldings.map((v) => ({ name: v.vault_name, value: Math.max(v.grams, 0.0001) }))
    : [{ name: "Unallocated", value: 1 }];

  return (
    <div className="space-y-6 pb-8">
      {/* Mobile-First Executive Header */}
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3 w-3" /> Allocated Account
              </span>
              <span className="text-xs text-muted-foreground">ID: #{user?.id?.slice(0, 8)}</span>
            </div>
            <h1 className="font-display mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome, <span className="text-primary">{firstName}</span>
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Vaulted reserves allocated with 100% direct legal title and underwritten insurance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
            <Button asChild size="sm" className="shadow-xs font-semibold">
              <Link to="/app/buy"><ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Buy Bullion</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-border/70">
              <Link to="/app/invest"><TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Sell / Liquidate</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-border/70">
              <Link to="/app/wallet"><DollarSign className="mr-1.5 h-3.5 w-3.5" /> Fund Wallet</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KYC Alert if required */}
      {kycStatus !== "approved" && (
        <Card className={`border ${kycStatus === "pending" ? "border-amber-500/40 bg-amber-500/5 shadow-xs" : "border-primary/40 bg-primary/5 shadow-xs"}`}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              {kycStatus === "pending" ? <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" /> : <ShieldCheck className="h-5 w-5 text-primary shrink-0" />}
              <div>
                <div className="font-display font-semibold text-foreground text-sm">
                  {kycStatus === "pending" ? "KYC verification under review" : kycStatus === "rejected" ? "KYC document update requested" : "Complete Identity Verification"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {kycStatus === "pending" ? "Verification documents are being processed. Approval takes 24–48 hours." : "Verify your identity to unlock higher allocation thresholds and physical delivery."}
                </div>
              </div>
            </div>
            {kycStatus !== "pending" && (
              <Button asChild size="sm" className="shadow-xs">
                <Link to="/app/kyc">Verify Identity</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4 Core Telemetry Metrics */}
      <section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewStat
            icon={Package}
            label="Total Allocated Gold"
            value={`${grams.toFixed(2)} g`}
            sub={`${ozs.toFixed(2)} troy oz · ${(grams / 1000).toFixed(3)} kg`}
          />
          <OverviewStat
            icon={DollarSign}
            label="Total Net Value"
            value={formatUSD(totalValue)}
            sub={`Gold: ${formatUSD(portfolio)} · Cash: ${formatUSD(balance)}`}
          />
          <OverviewStat
            icon={Sparkles}
            label="Live Gold Spot (USD)"
            value={formatUSD(pricePerGram * 31.1035)}
            sub={`${formatUSD(pricePerGram)}/g · 24h: ${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}
          />
          <OverviewStat
            icon={Globe}
            label="Primary Depository"
            value={primaryVault?.location ?? "Global Vault"}
            sub={primaryVault?.name ?? "Lloyd's Insured"}
          />
        </div>
      </section>

      {/* Interactive Portfolio Chart */}
      <section>
        <PortfolioChart />
      </section>

      {/* Quick Actions Matrix */}
      <section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction to="/app/buy" icon={ShoppingBag} label="Purchase Bars" desc="Minted LBMA bullion 1g to 1kg" />
          <QuickAction to="/app/invest" icon={TrendingUp} label="Instant Liquidation" desc="Sell gold to cash wallet in seconds" />
          <QuickAction to="/app/buy" icon={Truck} label="Request Delivery" desc="Ship bars via insured armored courier" />
          <QuickAction to="/app/certificates" icon={Award} label="Mint Certificates" desc="Download serialized ownership PDFs" />
        </div>
      </section>

      {/* Live Market Spot Rates Board */}
      <section>
        <Card className="border-border/70 bg-card/90 shadow-card">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">Precious Metals Spot Board</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Live wholesale benchmark rates refreshed in real time</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-500">
                <RefreshCw className="h-3 w-3 animate-spin" /> Live Market Feed
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Gold (XAU/USD)</span>
                  <span className="font-semibold text-emerald-500">{change >= 0 ? "+" : ""}{change.toFixed(2)}%</span>
                </div>
                <div className="font-display mt-2 text-xl font-bold text-foreground">{formatUSD(pricePerGram * 31.1035)} <span className="text-xs font-normal text-muted-foreground">/oz</span></div>
                <div className="mt-1 text-xs text-muted-foreground">Gram: {formatUSD(pricePerGram)} · Kilo: {formatUSD(pricePerGram * 1000)}</div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Silver (XAG/USD)</span>
                  <span className="font-semibold text-emerald-500">+1.14%</span>
                </div>
                <div className="font-display mt-2 text-xl font-bold text-foreground">$32.40 <span className="text-xs font-normal text-muted-foreground">/oz</span></div>
                <div className="mt-1 text-xs text-muted-foreground">Gram: $1.04 · Kilo: $1,041.80</div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Platinum (XPT/USD)</span>
                  <span className="font-semibold text-muted-foreground">+0.22%</span>
                </div>
                <div className="font-display mt-2 text-xl font-bold text-foreground">$985.20 <span className="text-xs font-normal text-muted-foreground">/oz</span></div>
                <div className="mt-1 text-xs text-muted-foreground">Gram: $31.67 · Kilo: $31,675.00</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Holdings Distribution & Amira Card */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* Holdings Breakdown */}
        <Card className="border-border/70 bg-card shadow-card lg:col-span-2">
          <CardContent className="p-5 sm:p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">Physical Custody Breakdown</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Audited gram balances allocated by depository facility</p>
              </div>
              <Button asChild variant="outline" size="sm" className="border-border/70">
                <Link to="/app/holdings">Full Statement</Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Combined Holdings</div>
                <div className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">{grams.toFixed(2)} g</div>
                <div className="mt-1 text-sm font-semibold text-primary">{formatUSD(portfolio)}</div>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Button asChild size="sm" className="shadow-xs font-semibold">
                    <Link to="/app/buy"><ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Buy More</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="border-border/70">
                    <Link to="/app/invest"><TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Liquidate</Link>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-muted/20 p-4">
                <div className="h-36 w-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" innerRadius={42} outerRadius={64} paddingAngle={2} stroke="none">
                        {pieData.map((_, i) => <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 w-full space-y-1.5 text-xs">
                  {vaultHoldings.length === 0 && (
                    <div className="text-center text-muted-foreground py-1">No allocated gold holdings yet</div>
                  )}
                  {vaultHoldings.slice(0, 4).map((v, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                        <span className="text-muted-foreground truncate">{v.vault_location ?? v.vault_name}</span>
                      </span>
                      <span className="font-semibold text-foreground">{v.grams.toFixed(2)} g</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Lloyd's Insured Underwriting</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Direct Legal Bailment</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> LBMA Assay Verification</span>
            </div>
          </CardContent>
        </Card>

        {/* Amira Metal Card Feature */}
        <Card className="border-border/70 bg-card shadow-card flex flex-col justify-between p-5 sm:p-6 md:p-8">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Debit Card
              </span>
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-display mt-3 text-lg font-bold tracking-tight text-foreground">The Amira Gold Card</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed sm:text-sm">
              Spend directly from your vaulted gold balance anywhere Visa is accepted worldwide with zero foreign transaction fees.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Instant spot conversion at point of sale</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Apple Pay &amp; Google Pay compatible</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Solid black metal card with gold rim</li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-border/60">
            <WaitlistDialog trigger={<Button className="w-full shadow-xs">Join Card Waitlist <ArrowRight className="ml-1.5 h-4 w-4" /></Button>} />
          </div>
        </Card>
      </section>

      {/* Global Depository Vaults Overview Grid */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">Depository Vault Locations</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Physical custody distribution across major jurisdictions</p>
          </div>
          <Button asChild variant="outline" size="sm" className="border-border/70">
            <Link to="/app/holdings">Manage Vaults</Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VAULT_LOCATIONS.map((v) => {
            const held = vaultHoldings.find((h) => (h.vault_location ?? "").toLowerCase() === v.city.toLowerCase());
            const heldGrams = held?.grams ?? 0;
            const pct = grams > 0 ? (heldGrams / grams) * 100 : 0;
            return (
              <Card key={v.city} className="border-border/70 bg-card shadow-card transition-all hover:border-primary/40">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Flag code={v.code} className="h-6 w-9 rounded-xs text-xl shadow-2xs" />
                      <div>
                        <div className="font-display text-sm font-semibold text-foreground">{v.city}</div>
                        <div className="text-[11px] text-muted-foreground">{v.country}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-500">{pct > 0 ? `${pct.toFixed(1)}%` : "0%"}</span>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between border-t border-border/50 pt-3">
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Allocated</div>
                      <div className="font-display text-base font-bold text-foreground">{heldGrams.toFixed(2)} g</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Value</div>
                      <div className="text-xs font-semibold text-primary">{formatUSD(heldGrams * pricePerGram)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent Custody Activity Ledger */}
      <section>
        <Card className="border-border/70 bg-card shadow-card">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h3 className="font-display text-base font-semibold text-foreground">Recent Custody Activity</h3>
              </div>
              <Button asChild variant="outline" size="sm" className="border-border/70">
                <Link to="/app/orders">View All Orders</Link>
              </Button>
            </div>

            <div className="mt-4 divide-y divide-border/50">
              {recentActivities.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No recent activity records found. When you purchase or transfer bullion, records appear here.
                </div>
              ) : (
                recentActivities.map((act) => (
                  <div key={act.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Scale className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-display font-semibold text-foreground">{act.type}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(act.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {act.grams && (
                        <span className="font-medium text-foreground">{act.grams.toFixed(2)} g</span>
                      )}
                      {act.amount_usd && (
                        <span className="font-semibold text-primary">{formatUSD(act.amount_usd)}</span>
                      )}
                      <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-[10px] font-semibold text-foreground">
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function OverviewStat({
  icon: Icon, label, value, sub,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <Card className="card-3d border-border/70 bg-card shadow-card">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-2xs">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-1 font-display truncate text-xl font-bold tracking-tight text-foreground">{value}</div>
            {sub && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  to, icon: Icon, label, desc,
}: { to: "/app/buy" | "/app/invest" | "/app/certificates"; icon: React.ComponentType<{ className?: string }>; label: string; desc?: string }) {
  return (
    <Link to={to} className="card-3d group flex items-start gap-3.5 rounded-xl border border-border/70 bg-card p-4 shadow-card active:scale-[0.98]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-transform duration-200 group-hover:scale-110">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="font-display font-medium text-sm text-foreground">{label}</div>
        {desc && <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</div>}
      </div>
    </Link>
  );
}
