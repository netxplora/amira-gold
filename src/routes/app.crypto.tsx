import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Copy, ArrowDownToLine, ArrowUpFromLine, Bitcoin, ShieldCheck,
  AlertTriangle, ChevronRight, ShoppingBag, CheckCircle2, ArrowLeft,
} from "lucide-react";
import { formatUSD } from "@/lib/gold-price";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { QRCode } from "@/components/QRCode";
import { BuyCryptoDialog } from "@/components/BuyCryptoDialog";
import { Link } from "@tanstack/react-router";

type Addr = { id: string; asset: string; network: string; address: string; memo: string | null };
type Dep = { id: string; asset: string; amount: number; amount_usd: number; tx_hash: string; status: string; created_at: string };
type Wd = { id: string; asset: string; amount_usd: number; to_address: string; status: string; created_at: string };

export const Route = createFileRoute("/app/crypto")({ component: CryptoPage });

function CryptoPage() {
  const { user } = useAuth();
  const [addrs, setAddrs] = useState<Addr[]>([]);
  const [deps, setDeps] = useState<Dep[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [balance, setBalance] = useState(0);
  const [verified, setVerified] = useState<boolean | null>(null);

  // Stepped deposit state
  const [step, setStep] = useState<1 | 2>(1);
  const [selAsset, setSelAsset] = useState<string>("");
  const [usd, setUsd] = useState("");
  const [amount, setAmount] = useState("");
  const [tx, setTx] = useState("");
  const [senderAddr, setSenderAddr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  // Withdraw
  const [wAsset, setWAsset] = useState("BTC");
  const [wNetwork, setWNetwork] = useState("Bitcoin");
  const [wUsd, setWUsd] = useState("");
  const [wAddr, setWAddr] = useState("");

  const refresh = async () => {
    if (!user) return;
    const [{ data: a }, { data: d }, { data: w }, { data: wal }, { data: prof }] = await Promise.all([
      supabase.from("crypto_addresses").select("*").eq("active", true).order("asset"),
      supabase.from("crypto_deposits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("crypto_withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("wallets").select("balance_usd").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("verified,kyc_status").eq("id", user.id).maybeSingle(),
    ]);
    setAddrs((a ?? []) as Addr[]);
    setDeps((d ?? []) as Dep[]);
    setWds((w ?? []) as Wd[]);
    setBalance(Number(wal?.balance_usd ?? 0));
    setVerified(!!prof?.verified || prof?.kyc_status === "approved");
    if (!selAsset && a && a[0]) setSelAsset(`${a[0].asset}|${a[0].network}`);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user]);

  // Realtime: react to approval/rejection
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`deposits-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "crypto_deposits", filter: `user_id=eq.${user.id}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line
  }, [user]);

  const selected = addrs.find((x) => `${x.asset}|${x.network}` === selAsset);

  // Crude crypto-equivalent estimator
  const cryptoEquivalent = useMemo(() => {
    const u = Number(usd);
    if (!u || !selected) return "";
    const rough: Record<string, number> = { BTC: 65000, ETH: 3500, USDT: 1, USDC: 1 };
    const px = rough[selected.asset.toUpperCase()] ?? 0;
    if (!px) return "";
    return (u / px).toFixed(selected.asset.toUpperCase() === "BTC" ? 6 : selected.asset.toUpperCase() === "ETH" ? 5 : 2);
  }, [usd, selected]);

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied to clipboard"); };

  const goToStep2 = () => {
    if (!selected) return toast.error("Select a cryptocurrency first");
    if (!(Number(usd) > 0)) return toast.error("Enter the USD amount you plan to deposit");
    setAmount(cryptoEquivalent);
    setStep(2);
  };

  const submitDeposit = async () => {
    if (!user || !selected) return;
    const u = Number(usd);
    const a = Number(amount);
    if (!(u > 0)) return toast.error("Enter a valid USD amount");
    if (!(a > 0)) return toast.error("Enter the cryptocurrency amount sent");
    if (!tx.trim() && !senderAddr.trim()) return toast.error("Provide either the transaction hash or sender address");
    if (tx.trim() && tx.trim().length < 10) return toast.error("Transaction hash is invalid or too short");

    setSubmitting(true);
    const { error } = await supabase.from("crypto_deposits").insert({
      user_id: user.id,
      asset: selected.asset,
      network: selected.network,
      amount: a,
      amount_usd: u,
      tx_hash: tx.trim() || `pending-${Date.now()}-${user.id.slice(0, 8)}`,
      from_address: senderAddr.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") return toast.error("This transaction has already been registered");
      return toast.error(error.message);
    }
    setUsd(""); setAmount(""); setTx(""); setSenderAddr(""); setStep(1);
    toast.success("Deposit submitted for ledger verification");
    refresh();
  };

  const submitWithdraw = async () => {
    if (!user) return;
    if (!verified) return toast.error("Identity verification required before withdrawals can be processed");
    const u = Number(wUsd);
    if (!(u > 0) || !wAddr.trim()) return toast.error("Provide a valid withdrawal amount and destination address");
    if (u > balance) return toast.error("Insufficient available wallet balance");

    try {
      const { error } = await supabase.rpc("request_crypto_withdrawal" as never, {
        _asset: wAsset,
        _network: wNetwork,
        _amount_usd: u,
        _to_address: wAddr.trim(),
      } as never);

      if (error) throw error;

      setWUsd(""); setWAddr("");
      toast.success("Withdrawal request submitted for review");
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal request failed");
    }
  };

  const pendingDeps = deps.filter((d) => d.status === "pending").length;
  const pendingWds = wds.filter((w) => w.status === "pending" || w.status === "processing").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Funding Rail"
        title="Digital Asset Transfers"
        subtitle="Fund your account wallet with BTC, ETH, or USDT for instant bullion settlement."
        icon={<Bitcoin className="h-6 w-6" />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Cash Balance" value={formatUSD(balance)} hint="Available for bullion purchases" accent="gold" />
        <StatTile label="Pending Deposits" value={pendingDeps} hint="Awaiting settlement" accent="silver" />
        <StatTile label="Pending Withdrawals" value={pendingWds} hint="Under review" accent="ruby" />
      </div>

      <Tabs defaultValue="deposit" className="space-y-4">
        <TabsList className="bg-muted/40 border border-border/70">
          <TabsTrigger value="deposit" className="text-xs font-semibold"><ArrowDownToLine className="mr-1.5 h-3.5 w-3.5" /> Deposit</TabsTrigger>
          <TabsTrigger value="withdraw" className="text-xs font-semibold"><ArrowUpFromLine className="mr-1.5 h-3.5 w-3.5" /> Withdraw</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-4">
          <StepIndicator step={step} />

          {step === 1 && (
            <Card className="border-border/70 bg-card shadow-card">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">Step 1 — Asset & Amount Selection</h3>
                    <p className="text-xs text-muted-foreground">Select the asset you wish to deposit and enter the equivalent USD value.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBuyOpen(true)}
                    disabled={!selected}
                    className="border-border/70 font-semibold"
                  >
                    <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Buy with Card
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Asset & Network</Label>
                    <Select value={selAsset} onValueChange={setSelAsset}>
                      <SelectTrigger className="h-9 text-xs border-border/70"><SelectValue placeholder="Select digital asset" /></SelectTrigger>
                      <SelectContent>
                        {addrs.map((a) => (
                          <SelectItem key={a.id} value={`${a.asset}|${a.network}`}>{a.asset} — {a.network}</SelectItem>
                        ))}
                        {addrs.length === 0 && <SelectItem disabled value="none">No deposit assets configured</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Deposit Amount (USD)</Label>
                    <Input type="number" inputMode="decimal" value={usd} onChange={(e) => setUsd(e.target.value)} placeholder="500" className="h-9 text-xs border-border/70" />
                    {cryptoEquivalent && selected && (
                      <p className="text-[11px] text-muted-foreground">
                        Est. volume: <span className="font-mono font-medium text-foreground">{cryptoEquivalent} {selected.asset}</span>
                      </p>
                    )}
                  </div>
                </div>

                <Button onClick={goToStep2} className="w-full font-semibold shadow-xs">
                  Continue to Address <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && selected && (
            <Card className="border-border/70 bg-card shadow-card">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">Step 2 — Transfer & Confirmation</h3>
                    <p className="text-xs text-muted-foreground">Transfer to the segregated address below, then record the transaction reference.</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setStep(1)} className="text-xs">
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
                  </Button>
                </div>

                {/* Summary */}
                <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-3">
                  <Summary label="USD Value" value={formatUSD(Number(usd))} />
                  <Summary label="Asset Equivalent" value={`${cryptoEquivalent || amount} ${selected.asset}`} />
                  <Summary label="Transfer Network" value={selected.network} accent />
                </div>

                {/* QR + address */}
                <div className="grid gap-4 rounded-xl border border-border/70 bg-card p-5 sm:grid-cols-[auto,1fr] sm:items-center">
                  <div className="flex justify-center p-2 rounded-lg bg-white">
                    <QRCode value={selected.address} size={130} />
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Depository Deposit Address</div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified Rail
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 break-all rounded-lg border border-border/60 bg-muted/30 p-2.5 font-mono text-xs">{selected.address}</code>
                      <Button size="icon" variant="outline" onClick={() => copy(selected.address)} className="h-9 w-9 shrink-0 border-border/70">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {selected.memo && (
                      <p className="text-xs text-muted-foreground">Memo / Tag: <code className="font-bold text-foreground">{selected.memo}</code></p>
                    )}
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        Transfer only <strong>{selected.asset}</strong> on the <strong>{selected.network}</strong> network. Other assets will be permanently unrecoverable.
                      </span>
                    </div>
                  </div>
                </div>

                {/* User input */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Exact Amount Sent *</Label>
                    <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.008" className="h-9 text-xs border-border/70" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Transaction Hash / TxID</Label>
                    <Input value={tx} onChange={(e) => setTx(e.target.value)} placeholder="0x… or hash" className="h-9 text-xs border-border/70" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-medium">Sender Wallet Address (Alternative)</Label>
                    <Input value={senderAddr} onChange={(e) => setSenderAddr(e.target.value)} placeholder="The wallet address you sent from" className="h-9 text-xs border-border/70" />
                    <p className="text-[11px] text-muted-foreground">Providing the transaction hash ensures expedited verification.</p>
                  </div>
                </div>

                <Button onClick={submitDeposit} disabled={submitting} className="w-full font-semibold shadow-xs">
                  {submitting ? "Registering…" : <>Confirm &amp; Register Deposit <CheckCircle2 className="ml-1.5 h-4 w-4" /></>}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* History */}
          <Card className="border-border/70 bg-card shadow-card">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
                <h3 className="font-display text-sm font-semibold text-foreground">Deposit Register</h3>
                <span className="text-xs text-muted-foreground">{deps.length} entries</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Asset</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">USD Credit</TableHead>
                      <TableHead className="text-xs">Tx Reference</TableHead>
                      <TableHead className="text-right text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deps.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">No deposits recorded yet</TableCell></TableRow>
                    ) : (
                      deps.map((d) => (
                        <TableRow key={d.id} className="border-border/40 hover:bg-muted/30">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs font-medium">{d.asset}</TableCell>
                          <TableCell className="font-mono text-xs">{d.amount}</TableCell>
                          <TableCell className="font-display font-semibold text-xs text-foreground">{formatUSD(d.amount_usd)}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{d.tx_hash.slice(0, 12)}…</TableCell>
                          <TableCell className="text-right"><StatusBadge s={d.status} /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {selected && (
            <BuyCryptoDialog
              open={buyOpen}
              onOpenChange={setBuyOpen}
              walletAddress={selected.address}
              asset={selected.asset}
              network={selected.network}
            />
          )}
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-4">
          {!verified && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <div>
                    <div className="font-display text-sm font-semibold text-foreground">Identity Verification Required for Withdrawals</div>
                    <p className="text-xs text-muted-foreground">In accordance with AML regulations, client identity must be confirmed before capital can be withdrawn.</p>
                  </div>
                </div>
                <Button asChild size="sm" className="shadow-xs font-semibold shrink-0">
                  <Link to="/app/kyc"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Verify Identity</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className={`border-border/70 bg-card shadow-card ${!verified ? "pointer-events-none opacity-50" : ""}`}>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Digital Asset</Label>
                  <Select value={wAsset} onValueChange={setWAsset}>
                    <SelectTrigger className="h-9 text-xs border-border/70"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC">BTC — Bitcoin</SelectItem>
                      <SelectItem value="ETH">ETH — Ethereum</SelectItem>
                      <SelectItem value="USDT">USDT — Tether</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Network Protocol</Label>
                  <Input value={wNetwork} onChange={(e) => setWNetwork(e.target.value)} className="h-9 text-xs border-border/70" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Amount to Withdraw (USD)</Label>
                  <Input type="number" value={wUsd} onChange={(e) => setWUsd(e.target.value)} placeholder="0.00" className="h-9 text-xs border-border/70" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Destination Wallet Address</Label>
                  <Input value={wAddr} onChange={(e) => setWAddr(e.target.value)} placeholder="0x… or recipient address" className="h-9 text-xs border-border/70" />
                </div>
              </div>
              <Button onClick={submitWithdraw} className="font-semibold shadow-xs">Submit Withdrawal Request</Button>
              <p className="text-[11px] text-muted-foreground">Withdrawal requests undergo compliance checks and are dispatched during business settlement windows.</p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card shadow-card">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
                <h3 className="font-display text-sm font-semibold text-foreground">Withdrawal History</h3>
                <span className="text-xs text-muted-foreground">{wds.length} entries</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Asset</TableHead>
                      <TableHead className="text-xs">USD Debit</TableHead>
                      <TableHead className="text-xs">Destination</TableHead>
                      <TableHead className="text-right text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wds.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">No withdrawals recorded</TableCell></TableRow>
                    ) : (
                      wds.map((w) => (
                        <TableRow key={w.id} className="border-border/40 hover:bg-muted/30">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs font-medium">{w.asset}</TableCell>
                          <TableCell className="font-display font-semibold text-xs text-foreground">{formatUSD(w.amount_usd)}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{w.to_address.slice(0, 12)}…</TableCell>
                          <TableCell className="text-right"><StatusBadge s={w.status} /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Summary({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-display text-sm font-semibold ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <Pill active={step === 1} done={step > 1} n={1} label="Select Asset" />
      <div className="h-px flex-1 bg-border/60" />
      <Pill active={step === 2} done={false} n={2} label="Confirm & Transfer" />
    </div>
  );
}

function Pill({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${active ? "border-primary/40 bg-primary/10 text-primary" : done ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-border/70 bg-card text-muted-foreground"}`}>
      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${active ? "bg-primary text-primary-foreground" : done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{done ? "✓" : n}</span>
      {label}
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    processing: "border-primary/30 bg-primary/10 text-primary",
    approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    sent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  };
  return <Badge className={`capitalize font-medium text-[11px] ${map[s] ?? ""}`} variant="outline">{s}</Badge>;
}
