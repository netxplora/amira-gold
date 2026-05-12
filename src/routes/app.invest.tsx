import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrendingUp, ArrowDownToLine, ArrowUpFromLine, Coins, Wallet } from "lucide-react";
import { PageHeader, StatTile } from "@/components/PageHeader";

export const Route = createFileRoute("/app/invest")({
  component: InvestPage,
});

function InvestPage() {
  const { user } = useAuth();
  const { pricePerGram } = useGoldPrice();
  const [balance, setBalance] = useState(0);
  const [grams, setGrams] = useState(0);
  const [usd, setUsd] = useState("100");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!user) return;
    const [{ data: w }, { data: h }] = await Promise.all([
      supabase.from("wallets").select("balance_usd").eq("user_id", user.id).maybeSingle(),
      supabase.from("holdings").select("grams,vault_id").eq("user_id", user.id).is("vault_id", null).maybeSingle(),
    ]);
    setBalance(Number(w?.balance_usd ?? 0));
    setGrams(Number(h?.grams ?? 0));
  };
  useEffect(() => { refresh(); }, [user]); // eslint-disable-line

  const amount = Number(usd) || 0;
  const gramsFor = pricePerGram > 0 ? amount / pricePerGram : 0;
  const portfolio = grams * pricePerGram;

  const buy = async () => {
    if (!user) return;
    if (amount <= 0) return toast.error("Enter an amount");
    if (amount > balance) return toast.error("Insufficient wallet balance");
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("execute_digital_gold_trade", {
        _action: "buy",
        _amount_usd: amount,
        _price_per_gram: pricePerGram,
      });

      if (error) throw error;

      toast.success(`Bought ${gramsFor.toFixed(4)}g of gold`);
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  };

  const sell = async () => {
    if (!user) return;
    if (amount <= 0) return toast.error("Enter an amount");
    if (gramsFor > grams) return toast.error("Insufficient digital gold");
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("execute_digital_gold_trade", {
        _action: "sell",
        _amount_usd: amount,
        _price_per_gram: pricePerGram,
      });

      if (error) throw error;

      toast.success(`Sold ${gramsFor.toFixed(4)}g of gold`);
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Digital Gold"
        title="Invest"
        subtitle="Buy and sell fractional gold instantly at the live spot price — no spread, no minimums."
        icon={<TrendingUp className="h-6 w-6" />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="Digital Portfolio" value={formatUSD(portfolio)} hint={`${grams.toFixed(4)} g`} accent="gold" icon={<Coins className="h-4 w-4" />} />
        <StatTile label="Wallet Balance" value={formatUSD(balance)} hint="Available to invest" accent="silver" icon={<Wallet className="h-4 w-4" />} />
        <StatTile label="Spot Price" value={`${formatUSD(pricePerGram)}/g`} hint="Live London Fix" accent="muted" icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <Card className="border-gold/30 bg-card/80 shadow-gold">
        <CardContent className="space-y-5 p-6">
          <div>
            <Label className="text-xs text-muted-foreground">Amount (USD)</Label>
            <Input type="number" min={0} value={usd} onChange={(e) => setUsd(e.target.value)} className="mt-1 h-12 text-lg font-semibold" />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">≈ <span className="font-semibold text-gold">{gramsFor.toFixed(4)} g</span> of fine gold</span>
              <span className="text-muted-foreground">@ {formatUSD(pricePerGram)}/g</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["50", "100", "500", "1000"].map((v) => (
              <button
                key={v}
                onClick={() => setUsd(v)}
                className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs hover:border-gold/40 hover:bg-gold/10"
              >
                ${v}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button onClick={buy} disabled={busy} className="h-11 bg-gradient-gold text-gold-foreground hover:opacity-90">
              <ArrowDownToLine className="mr-2 h-4 w-4" /> Buy gold
            </Button>
            <Button onClick={sell} disabled={busy} variant="outline" className="h-11 border-silver/50 hover:bg-silver/10">
              <ArrowUpFromLine className="mr-2 h-4 w-4" /> Sell gold
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">Trades execute at the spot price shown. No spread or hidden fees.</p>
        </CardContent>
      </Card>
    </div>
  );
}
