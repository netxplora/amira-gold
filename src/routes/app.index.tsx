import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  ShoppingBag, TrendingUp, Truck, Award, ChevronRight, ShieldCheck, ShieldAlert,
  Package, DollarSign, Sparkles, Globe, HelpCircle, CheckCircle2,
} from "lucide-react";
import heroGold from "@/assets/hero-gold-premium.jpg";
import amiraCard from "@/assets/amira-card.jpg";
import { Flag, VAULT_LOCATIONS } from "@/components/Flag";
import { PortfolioChart } from "@/components/PortfolioChart";
import { WaitlistDialog } from "@/components/WaitlistDialog";

export const Route = createFileRoute("/app/")({
  component: Overview,
});

type VaultHolding = { grams: number; vault_name: string; vault_location: string | null };

function Overview() {
  const { user } = useAuth();
  const { pricePerGram } = useGoldPrice();
  const [balance, setBalance] = useState(0);
  const [grams, setGrams] = useState(0);
  const [vaultHoldings, setVaultHoldings] = useState<VaultHolding[]>([]);
  const [primaryVault, setPrimaryVault] = useState<{ name: string; location: string } | null>(null);
  const [kycStatus, setKycStatus] = useState<string>("none");
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase.from("wallets").select("balance_usd").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setBalance(Number(data?.balance_usd ?? 0)));
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
    supabase.from("profiles").select("kyc_status,full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setKycStatus(data?.kyc_status ?? "none");
        setFullName(data?.full_name ?? "");
      });
  }, [user]);

  const portfolio = grams * pricePerGram;
  const totalValue = portfolio + balance;
  const ozs = grams / 31.1035;
  const firstName = (fullName || user?.email?.split("@")[0] || "there").split(" ")[0];

  // Pie chart data
  const SLICE_COLORS = ["var(--gold)", "oklch(0.62 0.16 250)", "oklch(0.55 0.18 30)", "oklch(0.70 0.10 60)", "oklch(0.50 0.05 250)"];
  const pieData = vaultHoldings.length > 0
    ? vaultHoldings.map((v) => ({ name: v.vault_name, value: Math.max(v.grams, 0.0001) }))
    : [{ name: "Empty", value: 1 }];

  return (
    <div className="space-y-8">
      {/* Hero welcome banner */}
      <section
        className="relative overflow-hidden rounded-2xl border border-border/60"
        style={{
          backgroundImage: `linear-gradient(90deg, oklch(0.18 0.012 250) 0%, oklch(0.18 0.012 250 / 0.85) 45%, oklch(0.18 0.012 250 / 0.2) 75%, transparent 100%), url(${heroGold})`,
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      >
        <div className="relative z-10 flex min-h-[260px] flex-col justify-center gap-4 p-8 md:p-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Welcome, <span className="text-gradient-gold">{firstName}</span>
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground md:text-base">
              Manage your gold securely with <span className="text-gradient-gold font-semibold">Amira Gold</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Link to="/app/invest"><Sparkles className="mr-2 h-4 w-4" /> Start Investing</Link>
            </Button>
            <Button asChild variant="outline" className="border-border/60 bg-card/40 backdrop-blur">
              <Link to="/app/holdings">View Vault Locations</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KYC banner (preserved logic) */}
      {kycStatus !== "approved" && (
        <Card className={`border-2 ${kycStatus === "pending" ? "border-amber-500/40 bg-amber-500/5" : "border-gold/40 bg-gold/5"}`}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              {kycStatus === "pending" ? <ShieldAlert className="h-6 w-6 text-amber-400" /> : <ShieldCheck className="h-6 w-6 text-gold" />}
              <div>
                <div className="font-semibold">
                  {kycStatus === "pending" ? "KYC under review" : kycStatus === "rejected" ? "KYC rejected — please resubmit" : "Verify your identity"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {kycStatus === "pending" ? "We'll notify you within 24-48 hours." : "Required to unlock larger purchases and withdrawals."}
                </div>
              </div>
            </div>
            {kycStatus !== "pending" && (
              <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                <Link to="/app/kyc">Verify now</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overview row */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-xl font-semibold">Overview</h2>
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewStat
            icon={Package}
            label="Total Gold"
            value={`${grams.toFixed(2)} g`}
          />
          <OverviewStat
            icon={DollarSign}
            label="Total Value"
            value={formatUSD(totalValue)}
          />
          <OverviewStat
            icon={Sparkles}
            label="Spot Price (USD)"
            value={`${formatUSD(pricePerGram * 31.1035)}`}
            sub={`${ozs.toFixed(2)} oz held`}
          />
          <OverviewStat
            icon={Globe}
            label="Vault Storage"
            value={primaryVault?.location ?? "Unallocated"}
            sub={primaryVault?.name ?? "Choose a vault"}
          />
        </div>
      </section>

      {/* Portfolio chart */}
      <section>
        <PortfolioChart />
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction to="/app/buy" icon={ShoppingBag} label="Buy Gold" />
          <QuickAction to="/app/invest" icon={TrendingUp} label="Sell Gold" />
          <QuickAction to="/app/buy" icon={Truck} label="Request Delivery" />
          <QuickAction to="/app/certificates" icon={Award} label="Generate Certificate" />
        </div>
      </section>

      {/* Holdings + Card promo */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold">My Gold Holdings</h3>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <div className="text-4xl font-bold tracking-tight">{grams.toFixed(2)} g</div>
                <div className="mt-1 text-sm text-muted-foreground">{formatUSD(portfolio)}</div>
                <div className="mt-5 flex flex-col gap-2">
                  <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                    <Link to="/app/buy"><ShoppingBag className="mr-2 h-4 w-4" /> Buy Gold</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/app/invest"><TrendingUp className="mr-2 h-4 w-4" /> Sell Gold</Link>
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="h-40 w-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2} stroke="none">
                        {pieData.map((_, i) => <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 w-full space-y-1.5 text-xs">
                  {vaultHoldings.length === 0 && <div className="text-center text-muted-foreground">No holdings yet</div>}
                  {vaultHoldings.slice(0, 4).map((v, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                        <span className="text-muted-foreground">{v.vault_location ?? v.vault_name}</span>
                      </span>
                      <span className="font-medium">{v.grams.toFixed(2)} g</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gold" /> Insured Vault Storage</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gold" /> Allocated Ownership</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/60 bg-card">
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: `url(${amiraCard})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-card/60 to-card" />
          <CardContent className="relative z-10 flex h-full min-h-[320px] flex-col justify-end p-6">
            <h3 className="text-lg font-semibold">Introducing the Amira Gold Card</h3>
            <p className="mt-1 text-sm text-muted-foreground">Spend with your gold. Convert gold to cash.</p>
            <WaitlistDialog trigger={<Button className="mt-4 w-fit bg-gradient-gold text-gold-foreground hover:opacity-90">Join Waitlist</Button>} />
          </CardContent>
        </Card>
      </section>

      {/* Vault locations strip */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Vault Locations & Storage Overview</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/app/holdings">View Vault Details</Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VAULT_LOCATIONS.map((v) => {
            const held = vaultHoldings.find((h) => (h.vault_location ?? "").toLowerCase() === v.city.toLowerCase());
            const heldGrams = held?.grams ?? 0;
            const pct = grams > 0 ? (heldGrams / grams) * 100 : 0;
            return (
              <Card key={v.city} className="group border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2.5">
                    <Flag code={v.code} className="h-6 w-9 text-xl" />
                    <div>
                      <div className="text-sm font-semibold">{v.city}</div>
                      <div className="text-[11px] text-muted-foreground">{v.country}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground">Current Reserves</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-bold">{heldGrams.toFixed(2)} g</span>
                    <span className="text-[11px] text-emerald-400">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">{formatUSD(heldGrams * pricePerGram)}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQs + secondary card promo */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold">FAQs</h3>
            <div className="mt-4 flex flex-col gap-2">
              {FAQS.map((q) => (
                <Link key={q} to="/app/support" className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm transition-colors hover:border-gold/40 hover:bg-accent">
                  <span>{q}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/60 bg-card">
          <div className="absolute inset-0 opacity-70" style={{ backgroundImage: `url(${heroGold})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/70 to-transparent" />
          <CardContent className="relative z-10 flex h-full min-h-[240px] flex-col justify-center p-6">
            <h3 className="text-lg font-semibold">Introducing the Amira Gold Card</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">Spend with your gold. Convert gold to cash.</p>
            <WaitlistDialog trigger={<Button className="mt-4 w-fit bg-gradient-gold text-gold-foreground hover:opacity-90">Join Waitlist</Button>} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const _LEGACY_VAULT_CARDS = VAULT_LOCATIONS;

const FAQS = [
  "Is my gold physically stored?",
  "How can I sell my gold?",
  "Can I have my gold delivered?",
  "Where are the vaults located?",
];

function OverviewStat({
  icon: Icon, label, value, sub,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground shadow-gold">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 truncate text-lg font-bold">{value}</div>
            {sub && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  to, icon: Icon, label,
}: { to: "/app/buy" | "/app/invest" | "/app/certificates"; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-gold/40 hover:shadow-gold">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
