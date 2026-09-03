import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vault, Coins, ShoppingBag, ArrowUpRight, ShieldCheck, ArrowRight } from "lucide-react";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { Flag } from "@/components/Flag";

type Holding = { id: string; grams: number; vault_id: string | null; vault?: { name: string; location: string } | null };

export const Route = createFileRoute("/app/holdings")({
  component: HoldingsPage,
});

// Map vault location string → ISO country code for flags
function locationCode(loc?: string | null): string | null {
  if (!loc) return null;
  const l = loc.toLowerCase();
  if (l.includes("zurich") || l.includes("switzer")) return "CH";
  if (l.includes("dubai") || l.includes("emirates") || l.includes("uae")) return "AE";
  if (l.includes("singap")) return "SG";
  if (l.includes("london") || l.includes("united kingdom") || l.includes("uk")) return "GB";
  if (l.includes("toronto") || l.includes("canada")) return "CA";
  if (l.includes("riyadh") || l.includes("saudi")) return "SA";
  if (l.includes("new york") || l.includes("usa")) return "US";
  if (l.includes("frankfurt") || l.includes("germany")) return "DE";
  return null;
}

function HoldingsPage() {
  const { user } = useAuth();
  const { pricePerGram } = useGoldPrice();
  const [holdings, setHoldings] = useState<Holding[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("holdings")
      .select("id,grams,vault_id,vault:vaults(name,location)")
      .eq("user_id", user.id)
      .then(({ data }) => setHoldings((data ?? []) as unknown as Holding[]));
  }, [user]);

  const total = holdings.reduce((s, h) => s + Number(h.grams), 0);
  const value = total * pricePerGram;
  const vaulted = holdings.filter((h) => h.vault_id).reduce((s, h) => s + Number(h.grams), 0);
  const digital = total - vaulted;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Custody Portfolio"
        title="Bullion Holdings"
        subtitle="Summary of physically allocated gold in insured vaults and fractional digital positions."
        icon={<Vault className="h-6 w-6" />}
        actions={
          <Button asChild className="shadow-xs font-semibold">
            <Link to="/app/buy"><ShoppingBag className="mr-2 h-4 w-4" /> Buy Gold</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total Gold Weight" value={`${total.toFixed(4)} g`} hint={`Est. value: ${formatUSD(value)}`} accent="gold" icon={<Coins className="h-4 w-4" />} />
        <StatTile label="Vault Allocated" value={`${vaulted.toFixed(4)} g`} hint={`${holdings.filter((h) => h.vault_id).length} depository location(s)`} accent="silver" icon={<Vault className="h-4 w-4" />} />
        <StatTile label="Digital Balance" value={`${digital.toFixed(4)} g`} hint="Instantly liquid / tradeable" accent="muted" icon={<ArrowUpRight className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {holdings.length === 0 && (
          <Card className="border-border/70 bg-card shadow-card sm:col-span-2">
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Coins className="h-6 w-6" />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">No Gold Holdings Recorded</h3>
              <p className="max-w-sm text-xs text-muted-foreground leading-relaxed">
                Purchase fractional gold or physical bullion bars to establish your allocated custody positions.
              </p>
              <Button asChild className="mt-2 shadow-xs font-semibold">
                <Link to="/app/buy">Browse Bullion Products <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        )}
        {holdings.map((h) => {
          const code = h.vault ? locationCode(h.vault.location) : null;
          return (
            <Card key={h.id} className="border-border/70 bg-card shadow-card p-5 sm:p-6 transition-all hover:border-primary/40">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {code ? (
                    <Flag code={code} className="h-6 w-8 rounded-xs shadow-2xs" />
                  ) : (
                    <div className="flex h-6 w-8 items-center justify-center rounded-xs border border-border/70 bg-muted/40 text-[10px] font-bold text-muted-foreground">
                      DIG
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground">{h.vault ? h.vault.name : "Digital Gold Allocation"}</h3>
                    <div className="text-xs text-muted-foreground">
                      {h.vault ? h.vault.location : "Fractional balance, immediate liquidity"}
                    </div>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${h.vault ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border border-primary/20 bg-primary/10 text-primary"}`}>
                  {h.vault ? "Allocated" : "Digital"}
                </span>
              </div>
              <div className="mt-5 flex items-end justify-between border-t border-border/50 pt-4">
                <div>
                  <div className="font-display text-2xl font-bold tracking-tight text-foreground">{Number(h.grams).toFixed(4)} <span className="text-sm font-normal text-muted-foreground">g</span></div>
                  <div className="text-xs text-muted-foreground">{formatUSD(Number(h.grams) * pricePerGram)}</div>
                </div>
                {h.vault ? (
                  <Link to="/app/certificates" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    Certificate <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <Link to="/app/invest" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    Trade / Sell <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
