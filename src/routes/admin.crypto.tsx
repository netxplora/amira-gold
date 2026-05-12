import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Lock } from "lucide-react";
import { formatUSD } from "@/lib/gold-price";

type Addr = { id: string; asset: string; network: string; address: string; memo: string | null; active: boolean };
type Dep = { id: string; user_id: string; asset: string; network: string; amount: number; amount_usd: number; tx_hash: string; status: string; created_at: string; proof_url: string | null; from_address: string | null; processed_at: string | null; admin_notes: string | null };
type Wd = { id: string; user_id: string; asset: string; amount_usd: number; to_address: string; status: string; created_at: string };

export const Route = createFileRoute("/admin/crypto")({ component: AdminCrypto });

function AdminCrypto() {
  const { user } = useAuth();
  const [addrs, setAddrs] = useState<Addr[]>([]);
  const [deps, setDeps] = useState<Dep[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [asset, setAsset] = useState(""); const [network, setNetwork] = useState("");
  const [address, setAddress] = useState(""); const [memo, setMemo] = useState("");

  const refresh = async () => {
    const [{ data: a }, { data: d }, { data: w }] = await Promise.all([
      supabase.from("crypto_addresses").select("*").order("asset"),
      supabase.from("crypto_deposits").select("*").order("created_at", { ascending: false }),
      supabase.from("crypto_withdrawals").select("*").order("created_at", { ascending: false }),
    ]);
    setAddrs((a ?? []) as Addr[]); setDeps((d ?? []) as Dep[]); setWds((w ?? []) as Wd[]);
  };
  useEffect(() => { refresh(); }, []);

  // Realtime updates for admin
  useEffect(() => {
    const channel = supabase
      .channel("admin-deposits")
      .on("postgres_changes", { event: "*", schema: "public", table: "crypto_deposits" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const addAddr = async () => {
    if (!asset || !network || !address) return toast.error("Fill required fields");
    const { error } = await supabase.from("crypto_addresses").insert({ asset, network, address, memo: memo || null });
    if (error) return toast.error(error.message);
    setAsset(""); setNetwork(""); setAddress(""); setMemo("");
    toast.success("Address added"); refresh();
  };
  const toggleAddr = async (a: Addr) => { await supabase.from("crypto_addresses").update({ active: !a.active }).eq("id", a.id); refresh(); };
  const delAddr = async (id: string) => { if (!confirm("Delete address?")) return; await supabase.from("crypto_addresses").delete().eq("id", id); refresh(); };

  const approveDeposit = async (d: Dep, notes?: string): Promise<void> => {
    const { data, error } = await supabase.rpc("approve_crypto_deposit", { _deposit_id: d.id, _admin_notes: notes ?? undefined });
    if (error) { toast.error(error.message); return; }
    toast.success(`Approved — credited ${formatUSD(Number((data as { credited?: number })?.credited ?? d.amount_usd))}`);
    refresh();
  };
  const rejectDeposit = async (d: Dep, notes?: string): Promise<void> => {
    const { error } = await supabase.rpc("reject_crypto_deposit", { _deposit_id: d.id, _admin_notes: notes ?? undefined });
    if (error) { toast.error(error.message); return; }
    toast.success("Rejected"); refresh();
  };

  const reviewWithdraw = async (w: Wd, status: "sent" | "rejected", txHash?: string, notes?: string) => {
    if (!user) return;
    const { error } = await supabase.rpc("review_crypto_withdrawal", {
      _withdrawal_id: w.id,
      _decision: status === "sent" ? "approve" : "reject",
      _tx_hash: txHash ?? undefined,
      _admin_notes: notes ?? undefined,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Withdrawal ${status}`); refresh();
  };

  const filteredDeps = deps.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return d.tx_hash.toLowerCase().includes(s) || d.user_id.includes(s) || d.asset.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Crypto management</h1>
      <Tabs defaultValue="deposits">
        <TabsList>
          <TabsTrigger value="deposits">Deposits ({deps.filter((d) => d.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals ({wds.filter((w) => w.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Search hash, user, asset…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            {["all", "pending", "approved", "rejected"].map((s) => (
              <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize">{s}</Button>
            ))}
          </div>
          <Card className="border-border/60 bg-card"><CardContent className="p-0">
            <Table><TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Asset</TableHead>
              <TableHead>Amount</TableHead><TableHead>USD</TableHead><TableHead>Tx / From</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader><TableBody>
              {filteredDeps.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">No deposits</TableCell></TableRow>
              )}
              {filteredDeps.map((d) => {
                const locked = d.processed_at !== null;
                return (
                  <TableRow key={d.id} className={locked ? "opacity-70" : ""}>
                    <TableCell className="text-xs">{new Date(d.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{d.user_id.slice(0, 8)}…</TableCell>
                    <TableCell><div className="font-medium">{d.asset}</div><div className="text-[10px] text-muted-foreground">{d.network}</div></TableCell>
                    <TableCell>{d.amount}</TableCell>
                    <TableCell>{formatUSD(d.amount_usd)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="break-all">{d.tx_hash.slice(0, 18)}…</div>
                      {d.from_address && <div className="text-[10px] text-muted-foreground">from {d.from_address.slice(0, 14)}…</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        d.status === "approved" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : d.status === "rejected" ? "bg-ruby/15 text-ruby border-ruby/40"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      }>{d.status}</Badge>
                      {locked && <Lock className="ml-1 inline h-3 w-3 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      {d.proof_url && <a href={d.proof_url} target="_blank" rel="noreferrer" className="text-xs text-gold underline mr-1">Proof</a>}
                      {d.status === "pending" && !locked && (
                        <>
                          <ReviewDialog title="Approve deposit" deposit={d} onSubmit={approveDeposit} variant="approve" />
                          <ReviewDialog title="Reject deposit" deposit={d} onSubmit={rejectDeposit} variant="reject" />
                        </>
                      )}
                      {d.admin_notes && <p className="mt-1 text-[10px] text-muted-foreground">{d.admin_notes}</p>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody></Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card className="border-border/60 bg-card"><CardContent className="p-0">
            <Table><TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Asset</TableHead>
              <TableHead>USD</TableHead><TableHead>To</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader><TableBody>
              {wds.map((w) => <TableRow key={w.id}>
                <TableCell className="text-xs">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="font-mono text-xs">{w.user_id.slice(0, 8)}…</TableCell>
                <TableCell>{w.asset}</TableCell><TableCell>{formatUSD(w.amount_usd)}</TableCell>
                <TableCell className="font-mono text-xs">{w.to_address.slice(0, 14)}…</TableCell>
                <TableCell className="capitalize">{w.status}</TableCell>
                <TableCell className="space-x-2 text-right">
                  {w.status === "pending" && <>
                    <Button size="sm" onClick={() => {
                      const tx = prompt("Tx hash for sent withdrawal:");
                      if (tx) reviewWithdraw(w, "sent", tx);
                    }} className="bg-emerald-600 hover:bg-emerald-700">Mark sent</Button>
                    <Button size="sm" variant="destructive" onClick={() => reviewWithdraw(w, "rejected")}>Reject</Button>
                  </>}
                </TableCell>
              </TableRow>)}
            </TableBody></Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4">
          <Card className="border-border/60 bg-card"><CardContent className="grid gap-3 p-6 md:grid-cols-5">
            <div><Label>Asset</Label><Input value={asset} onChange={(e) => setAsset(e.target.value)} placeholder="BTC" /></div>
            <div><Label>Network</Label><Input value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="Bitcoin" /></div>
            <div className="md:col-span-2"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            <div className="flex items-end"><Button onClick={addAddr} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">Add</Button></div>
            <div className="md:col-span-5"><Label>Memo (optional)</Label><Input value={memo} onChange={(e) => setMemo(e.target.value)} /></div>
          </CardContent></Card>
          <Card className="border-border/60 bg-card"><CardContent className="p-0">
            <Table><TableHeader><TableRow>
              <TableHead>Asset</TableHead><TableHead>Network</TableHead><TableHead>Address</TableHead>
              <TableHead>Active</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader><TableBody>
              {addrs.map((a) => <TableRow key={a.id}>
                <TableCell>{a.asset}</TableCell><TableCell>{a.network}</TableCell>
                <TableCell className="font-mono text-xs">{a.address.slice(0, 24)}…</TableCell>
                <TableCell>{a.active ? "Yes" : "No"}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => toggleAddr(a)}>{a.active ? "Disable" : "Enable"}</Button>
                  <Button size="sm" variant="destructive" onClick={() => delAddr(a.id)}><Trash2 className="h-3 w-3" /></Button>
                </TableCell>
              </TableRow>)}
            </TableBody></Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReviewDialog({ title, deposit, onSubmit, variant }: {
  title: string; deposit: Dep;
  onSubmit: (d: Dep, notes?: string) => Promise<void>;
  variant: "approve" | "reject";
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className={variant === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : ""} variant={variant === "approve" ? "default" : "destructive"}>
          {variant === "approve" ? "Approve" : "Reject"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-border/60 bg-card/40 p-3">
            <div><span className="text-muted-foreground">User:</span> <code className="text-xs">{deposit.user_id.slice(0, 12)}…</code></div>
            <div><span className="text-muted-foreground">Amount:</span> {deposit.amount} {deposit.asset} ({formatUSD(deposit.amount_usd)})</div>
            <div className="break-all"><span className="text-muted-foreground">Tx:</span> <code className="text-xs">{deposit.tx_hash}</code></div>
          </div>
          <div>
            <Label>Notes {variant === "reject" ? "*" : "(optional)"}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder={variant === "approve" ? "On-chain confirmed via explorer…" : "Reason for rejection…"} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button
            disabled={busy || (variant === "reject" && !notes.trim())}
            className={variant === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            variant={variant === "approve" ? "default" : "destructive"}
            onClick={async () => {
              setBusy(true);
              await onSubmit(deposit, notes.trim() || undefined);
              setBusy(false);
              setOpen(false);
            }}
          >
            {busy ? "Working…" : variant === "approve" ? "Confirm approval" : "Confirm rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
