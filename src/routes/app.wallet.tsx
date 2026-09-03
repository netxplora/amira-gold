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
        eyebrow="Cash & Liquidity"
        title="Account Wallet"
        subtitle="Manage available cash balances, crypto funding, and track your account transactions."
        icon={<WalletIcon className="h-6 w-6" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild className="shadow-xs font-semibold">
              <Link to="/app/crypto"><Bitcoin className="mr-1.5 h-4 w-4" /> Deposit Crypto</Link>
            </Button>
            <Button asChild variant="outline" className="border-border/70 font-medium">
              <Link to="/app/buy"><ShoppingBag className="mr-1.5 h-4 w-4" /> Buy Gold</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Available Cash Balance" value={formatUSD(balance)} hint="Available for instant purchases" accent="gold" icon={<WalletIcon className="h-4 w-4" />} />
        <StatTile label="Total Deposits (Inflow)" value={formatUSD(inflow)} hint={`${txs.filter((t) => Number(t.amount_usd) > 0).length} transaction(s)`} accent="silver" icon={<TrendingUp className="h-4 w-4" />} />
        <StatTile label="Total Payments (Outflow)" value={formatUSD(outflow)} hint={`${txs.filter((t) => Number(t.amount_usd) < 0).length} transaction(s)`} accent="ruby" icon={<TrendingDown className="h-4 w-4" />} />
      </div>

      <Card className="border-border/70 bg-card shadow-card">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 sm:px-6">
            <h2 className="font-display text-sm font-semibold tracking-tight text-foreground">Transaction Ledger</h2>
            <span className="text-xs text-muted-foreground">{txs.length} recorded entries</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs">Timestamp</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-right text-xs">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                      No transaction records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  txs.map((t) => (
                    <TableRow key={t.id} className="border-border/40 hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="capitalize">
                        <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground">
                          {t.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-foreground/90 font-medium">
                        {t.description ?? "Account adjustment"}
                      </TableCell>
                      <TableCell className={`text-right font-display text-sm font-semibold whitespace-nowrap ${Number(t.amount_usd) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                        {Number(t.amount_usd) >= 0 ? "+" : ""}{formatUSD(Number(t.amount_usd))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
