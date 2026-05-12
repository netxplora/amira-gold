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

  // Realtime: react to admin approval/rejection of this user's deposits
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

  // Crude crypto-equivalent estimator (purely informational; admin verifies on-chain)
  const cryptoEquivalent = useMemo(() => {
    const u = Number(usd);
    if (!u || !selected) return "";
    const rough: Record<string, number> = { BTC: 65000, ETH: 3500, USDT: 1, USDC: 1 };
    const px = rough[selected.asset.toUpperCase()] ?? 0;
    if (!px) return "";
    return (u / px).toFixed(selected.asset.toUpperCase() === "BTC" ? 6 : selected.asset.toUpperCase() === "ETH" ? 5 : 2);
  }, [usd, selected]);

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied"); };

  const goToStep2 = () => {
    if (!selected) return toast.error("Select a cryptocurrency first");
    if (!(Number(usd) > 0)) return toast.error("Enter the USD amount you'll deposit");
    setAmount(cryptoEquivalent);
    setStep(2);
  };

  const submitDeposit = async () => {
    if (!user || !selected) return;
    const u = Number(usd);
    const a = Number(amount);
    if (!(u > 0)) return toast.error("Enter a valid USD amount");
    if (!(a > 0)) return toast.error("Enter the crypto amount you sent");
    if (!tx.trim() && !senderAddr.trim()) return toast.error("Provide either the transaction hash or sender wallet address");
    if (tx.trim() && tx.trim().length < 10) return toast.error("Transaction hash looks too short");

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
      if (error.code === "23505") return toast.error("This transaction has already been submitted");
      return toast.error(error.message);
    }
    setUsd(""); setAmount(""); setTx(""); setSenderAddr(""); setStep(1);
    toast.success("Deposit submitted — awaiting admin verification");
    refresh();
  };

  const submitWithdraw = async () => {
    if (!user) return;
    if (!verified) return toast.error("Account verification required before withdrawal");
    const u = Number(wUsd);
    if (!(u > 0) || !wAddr.trim()) return toast.error("Fill amount and destination address");
    if (u > balance) return toast.error("Insufficient wallet balance");

    try {
      const { data, error } = await supabase.rpc("request_crypto_withdrawal" as never, {
        _asset: wAsset,
        _network: wNetwork,
        _amount_usd: u,
        _to_address: wAddr.trim(),
      } as never);

      if (error) throw error;

      setWUsd(""); setWAddr("");
      toast.success("Withdrawal request submitted");
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    }
  };

  const pendingDeps = deps.filter((d) => d.status === "pending").length;
  const pendingWds = wds.filter((w) => w.status === "pending" || w.status === "processing").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Crypto"
        title="Deposits & withdrawals"
        subtitle="Fund your wallet with BTC, ETH or USDT — admin-verified for security."
        icon={<Bitcoin className="h-6 w-6" />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="Wallet Balance" value={formatUSD(balance)} hint="Available to invest" accent="gold" />
        <StatTile label="Pending Deposits" value={pendingDeps} hint="Awaiting verification" accent="silver" />
        <StatTile label="Pending Withdrawals" value={pendingWds} hint="Being processed" accent="ruby" />
      </div>

      <Tabs defaultValue="deposit">
        <TabsList className="bg-card/60">
          <TabsTrigger value="deposit"><ArrowDownToLine className="mr-2 h-4 w-4" />Deposit</TabsTrigger>
          <TabsTrigger value="withdraw"><ArrowUpFromLine className="mr-2 h-4 w-4" />Withdraw</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-4">
          <StepIndicator step={step} />

          {step === 1 && (
            <Card className="border-border/60 bg-card/80">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">Step 1 — Choose what you'll deposit</h3>
                    <p className="text-xs text-muted-foreground">Select a cryptocurrency and how much (in USD) you plan to send.</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setBuyOpen(true)}
                    disabled={!selected}
                    className="bg-gradient-gold text-gold-foreground shadow-gold transition-transform hover:scale-[1.02] hover:opacity-95 active:scale-100"
                  >
                    <ShoppingBag className="mr-1.5 h-4 w-4" /> Buy crypto
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Cryptocurrency *</Label>
                    <Select value={selAsset} onValueChange={setSelAsset}>
                      <SelectTrigger><SelectValue placeholder="Choose asset" /></SelectTrigger>
                      <SelectContent>
                        {addrs.map((a) => (
                          <SelectItem key={a.id} value={`${a.asset}|${a.network}`}>{a.asset} — {a.network}</SelectItem>
                        ))}
                        {addrs.length === 0 && <SelectItem disabled value="none">No assets configured</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount (USD) *</Label>
                    <Input type="number" inputMode="decimal" value={usd} onChange={(e) => setUsd(e.target.value)} placeholder="500" />
                    {cryptoEquivalent && selected && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        ≈ <span className="font-mono text-gold">{cryptoEquivalent} {selected.asset}</span> (estimate, verified on-chain)
                      </p>
                    )}
                  </div>
                </div>

                <Button onClick={goToStep2} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
                  Deposit <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && selected && (
            <Card className="border-border/60 bg-card/80">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Step 2 — Send funds & confirm</h3>
                    <p className="text-xs text-muted-foreground">Send to the address below, then submit the transaction details.</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                </div>

                {/* Summary */}
                <div className="grid gap-3 rounded-xl border border-border/60 bg-background/40 p-4 sm:grid-cols-3">
                  <Summary label="Requested" value={formatUSD(Number(usd))} />
                  <Summary label="≈ Crypto" value={`${cryptoEquivalent || amount} ${selected.asset}`} />
                  <Summary label="Network" value={selected.network} accent />
                </div>

                {/* QR + address */}
                <div className="grid gap-4 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-5 md:grid-cols-[auto,1fr]">
                  <div className="flex justify-center md:justify-start">
                    <QRCode value={selected.address} size={160} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-widest text-gold">Send to this address</div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 break-all rounded-lg bg-background/60 p-3 font-mono text-xs">{selected.address}</code>
                      <Button size="icon" variant="ghost" onClick={() => copy(selected.address)} className="hover:bg-gold/10 hover:text-gold">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {selected.memo && (
                      <p className="text-xs text-muted-foreground">Memo: <code className="text-gold">{selected.memo}</code></p>
                    )}
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] text-amber-300">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        Send only <strong>{selected.asset}</strong> via the <strong>{selected.network}</strong> network.
                        Sending via the wrong network may result in loss of funds.
                      </span>
                    </div>
                  </div>
                </div>

                {/* User input */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Crypto amount sent *</Label>
                    <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.008" />
                  </div>
                  <div>
                    <Label>Transaction hash</Label>
                    <Input value={tx} onChange={(e) => setTx(e.target.value)} placeholder="0x… or hash" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>…or sender wallet address</Label>
                    <Input value={senderAddr} onChange={(e) => setSenderAddr(e.target.value)} placeholder="The address you sent from" />
                    <p className="mt-1 text-[11px] text-muted-foreground">Provide at least one — transaction hash is preferred.</p>
                  </div>
                </div>

                <Button onClick={submitDeposit} disabled={submitting} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
                  {submitting ? "Submitting…" : <>Confirm deposit <CheckCircle2 className="ml-2 h-4 w-4" /></>}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* History */}
          <Card className="border-border/60 bg-card/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Asset</TableHead><TableHead>Amount</TableHead>
                    <TableHead>USD</TableHead><TableHead>Reference</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deps.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No deposits yet</TableCell></TableRow>}
                  {deps.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-xs">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{d.asset}</TableCell>
                      <TableCell>{d.amount}</TableCell>
                      <TableCell className="font-semibold text-gold">{formatUSD(d.amount_usd)}</TableCell>
                      <TableCell className="font-mono text-xs">{d.tx_hash.slice(0, 12)}…</TableCell>
                      <TableCell><StatusBadge s={d.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                  <div>
                    <div className="font-semibold text-amber-200">Account verification required before withdrawal</div>
                    <p className="text-xs text-amber-100/80">For your safety and to comply with AML rules, we need to verify your identity before processing any withdrawal.</p>
                  </div>
                </div>
                <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                  <Link to="/app/kyc"><ShieldCheck className="mr-2 h-4 w-4" /> Verify Account</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className={`border-border/60 bg-card/80 ${!verified ? "pointer-events-none opacity-50" : ""}`}>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Asset</Label>
                  <Select value={wAsset} onValueChange={setWAsset}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Network</Label><Input value={wNetwork} onChange={(e) => setWNetwork(e.target.value)} /></div>
                <div><Label>Amount (USD)</Label><Input type="number" value={wUsd} onChange={(e) => setWUsd(e.target.value)} /></div>
                <div><Label>Destination address</Label><Input value={wAddr} onChange={(e) => setWAddr(e.target.value)} /></div>
              </div>
              <Button onClick={submitWithdraw} className="bg-gradient-gold text-gold-foreground hover:opacity-90">Request withdrawal</Button>
              <p className="text-[11px] text-muted-foreground">Withdrawals are reviewed manually for your safety. Typically processed within a few hours.</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Asset</TableHead><TableHead>USD</TableHead>
                    <TableHead>To</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wds.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No withdrawals yet</TableCell></TableRow>}
                  {wds.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-xs">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{w.asset}</TableCell>
                      <TableCell className="font-semibold text-gold">{formatUSD(w.amount_usd)}</TableCell>
                      <TableCell className="font-mono text-xs">{w.to_address.slice(0, 10)}…</TableCell>
                      <TableCell><StatusBadge s={w.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-semibold ${accent ? "text-emerald-400" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <Pill active={step === 1} done={step > 1} n={1} label="Initiate" />
      <div className="h-px flex-1 bg-border/60" />
      <Pill active={step === 2} done={false} n={2} label="Confirm & send" />
    </div>
  );
}

function Pill({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${active ? "border-gold/50 bg-gold/10 text-gold" : done ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-border/60 bg-card/40 text-muted-foreground"}`}>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${active ? "bg-gold text-gold-foreground" : done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{done ? "✓" : n}</span>
      {label}
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    processing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    sent: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    rejected: "bg-ruby/15 text-ruby border-ruby/40",
  };
  return <Badge className={map[s] ?? ""} variant="outline">{s}</Badge>;
}
