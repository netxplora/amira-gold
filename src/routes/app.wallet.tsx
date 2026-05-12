import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatUSD } from "@/lib/gold-price";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet as WalletIcon, Bitcoin, TrendingUp, TrendingDown, ShoppingBag } from "lucide-react";
import { PageHeader, StatTile } from "@/components/PageHeader";

type Tx = { id: string; type: string; amount_usd: number; description: string | null; created_at: string };

export const Route = createFileRoute("/app/wallet")({
  component: WalletPage,
});

function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);

  const refresh = async () => {
    if (!user) return;
    const [{ data: w }, { data: t }] = await Promise.all([
      supabase.from("wallets").select("balance_usd").eq("user_id", user.id).maybeSingle(),
      supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setBalance(Number(w?.balance_usd ?? 0));
    setTxs((t ?? []) as Tx[]);
  };
  useEffect(() => { refresh(); }, [user]); // eslint-disable-line

  const inflow = txs.filter((t) => Number(t.amount_usd) > 0).reduce((s, t) => s + Number(t.amount_usd), 0);
  const outflow = txs.filter((t) => Number(t.amount_usd) < 0).reduce((s, t) => s + Math.abs(Number(t.amount_usd)), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="USD Balance"
        title="Wallet"
        subtitle="Fund your wallet via crypto deposit, then buy allocated gold or invest."
        icon={<WalletIcon className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button asChild className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Link to="/app/crypto"><Bitcoin className="mr-2 h-4 w-4" /> Deposit Crypto</Link>
            </Button>
            <Button asChild variant="outline" className="border-emerald/40 text-emerald hover:bg-emerald/10">
              <Link to="/app/buy"><ShoppingBag className="mr-2 h-4 w-4" /> Buy Gold</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="Available Balance" value={formatUSD(balance)} hint="Ready to invest" accent="gold" icon={<WalletIcon className="h-4 w-4" />} />
        <StatTile label="Total Inflow" value={formatUSD(inflow)} hint={`${txs.filter((t) => Number(t.amount_usd) > 0).length} transactions`} accent="silver" icon={<TrendingUp className="h-4 w-4" />} />
        <StatTile label="Total Outflow" value={formatUSD(outflow)} hint={`${txs.filter((t) => Number(t.amount_usd) < 0).length} transactions`} accent="ruby" icon={<TrendingDown className="h-4 w-4" />} />
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Transaction history</h2>
            <span className="text-xs text-muted-foreground">{txs.length} entries</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No transactions yet</TableCell></TableRow>
              )}
              {txs.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">
                    <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[11px]">{t.type}</span>
                  </TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell className={`text-right font-semibold ${Number(t.amount_usd) >= 0 ? "text-emerald-400" : "text-ruby"}`}>
                    {Number(t.amount_usd) >= 0 ? "+" : ""}{formatUSD(Number(t.amount_usd))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
