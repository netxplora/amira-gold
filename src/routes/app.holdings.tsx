import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vault, Coins, ShoppingBag, ArrowUpRight } from "lucide-react";
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
  if (l.includes("new york") || l.includes("usa")) return "US";
  if (l.includes("frankfurt") || l.includes("germany")) return "DE";
  if (l.includes("hong kong")) return "HK";
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
        eyebrow="Your Portfolio"
        title="Holdings"
        subtitle="Allocated gold across our LBMA-certified vaults plus your fractional digital balance."
        icon={<Vault className="h-6 w-6" />}
        actions={
          <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90">
            <Link to="/app/buy"><ShoppingBag className="mr-2 h-4 w-4" /> Buy more gold</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="Total Gold" value={`${total.toFixed(4)} g`} hint={`≈ ${formatUSD(value)}`} accent="gold" icon={<Coins className="h-4 w-4" />} />
        <StatTile label="Vaulted" value={`${vaulted.toFixed(4)} g`} hint={`${holdings.filter((h) => h.vault_id).length} vault(s)`} accent="silver" icon={<Vault className="h-4 w-4" />} />
        <StatTile label="Digital" value={`${digital.toFixed(4)} g`} hint="Instantly tradeable" accent="muted" icon={<ArrowUpRight className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {holdings.length === 0 && (
          <Card className="border-border/60 bg-card/80 md:col-span-2">
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Coins className="h-7 w-7" />
              </div>
              <p className="text-sm text-muted-foreground">No holdings yet — buy your first gold bar to get started.</p>
              <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                <Link to="/app/buy">Browse gold bars</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        {holdings.map((h) => {
          const code = h.vault ? locationCode(h.vault.location) : null;
          return (
            <Card key={h.id} className="group border-border/60 bg-card/80 transition-all hover:border-gold/40 hover:shadow-gold">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {code ? (
                      <Flag code={code} className="h-7 w-10" />
                    ) : (
                      <div className="flex h-7 w-10 items-center justify-center rounded-sm bg-gradient-silver text-[10px] font-bold text-silver-foreground">
                        DIG
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{h.vault ? h.vault.name : "Digital Gold"}</div>
                      <div className="text-xs text-muted-foreground">
                        {h.vault ? h.vault.location : "Fractional, instantly tradeable"}
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full border border-gold/30 bg-gold/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                    {h.vault ? "Allocated" : "Digital"}
                  </span>
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gradient-gold">{Number(h.grams).toFixed(4)} g</div>
                    <div className="text-sm text-muted-foreground">{formatUSD(Number(h.grams) * pricePerGram)}</div>
                  </div>
                  {h.vault && (
                    <Link to="/app/certificates" className="text-xs text-gold hover:underline">
                      View certificate →
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
