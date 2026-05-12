import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { formatUSD } from "@/lib/gold-price";

type Profile = { id: string; full_name: string | null; suspended: boolean; verified: boolean; created_at: string };
type Wallet = { user_id: string; balance_usd: number };

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const { user } = useAuth();
  const [items, setItems] = useState<Profile[]>([]);
  const [wallets, setWallets] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const profs = (data ?? []) as Profile[];
    setItems(profs);
    if (profs.length) {
      const { data: ws } = await supabase.from("wallets").select("user_id,balance_usd").in("user_id", profs.map((p) => p.id));
      const map: Record<string, number> = {};
      (ws as Wallet[] ?? []).forEach((w) => { map[w.user_id] = Number(w.balance_usd); });
      setWallets(map);
    }
  };
  useEffect(() => { load(); }, []);

  const flip = async (id: string, key: "suspended" | "verified", val: boolean) => {
    const patch = key === "suspended" ? { suspended: val } : { verified: val };
    await supabase.from("profiles").update(patch).eq("id", id);
    load();
  };

  const filtered = items.filter((u) =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.id.startsWith(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        <Input placeholder="Search by name or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>
      <Card className="border-border/60 bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Joined</TableHead><TableHead>User ID</TableHead><TableHead>Name</TableHead>
              <TableHead>Wallet</TableHead><TableHead>Verified</TableHead><TableHead>Suspended</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono text-xs">{u.id.slice(0, 8)}…</TableCell>
                  <TableCell>{u.full_name || "—"}</TableCell>
                  <TableCell className="font-semibold text-gold">{formatUSD(wallets[u.id] ?? 0)}</TableCell>
                  <TableCell>{u.verified ? <span className="text-emerald-400">Yes</span> : "No"}</TableCell>
                  <TableCell>{u.suspended ? <span className="text-red-400">Yes</span> : "No"}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <WalletAdjustDialog userId={u.id} adminId={user?.id ?? ""} onDone={load} />
                    <Button size="sm" variant="outline" onClick={() => flip(u.id, "verified", !u.verified)}>
                      {u.verified ? "Unverify" : "Verify"}
                    </Button>
                    <Button size="sm" variant={u.suspended ? "outline" : "destructive"} onClick={() => flip(u.id, "suspended", !u.suspended)}>
                      {u.suspended ? "Unsuspend" : "Suspend"}
                    </Button>
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

function WalletAdjustDialog({ userId, adminId, onDone }: { userId: string; adminId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState(""); const [reason, setReason] = useState("");
  const [type, setType] = useState<"credit" | "debit">("credit");

  const apply = async () => {
    const a = Number(amt);
    if (!(a > 0)) return toast.error("Enter amount");
    if (!adminId) return toast.error("Admin not loaded");
    const { data: w } = await supabase.from("wallets").select("balance_usd").eq("user_id", userId).maybeSingle();
    const cur = Number(w?.balance_usd ?? 0);
    const delta = type === "credit" ? a : -a;
    const newBal = cur + delta;
    if (newBal < 0) return toast.error("Would result in negative balance");
    await supabase.from("wallets").update({ balance_usd: newBal }).eq("user_id", userId);
    await supabase.from("wallet_transactions").insert({
      user_id: userId, type: type === "credit" ? "deposit" : "withdraw",
      amount_usd: delta, description: `Admin ${type}: ${reason || "manual adjustment"}`,
    });
    await supabase.from("notifications").insert({
      user_id: userId, title: type === "credit" ? "Wallet credited" : "Wallet debited",
      body: `${type === "credit" ? "+" : "-"}$${a.toFixed(2)} — ${reason || "admin adjustment"}`,
    });
    toast.success(`Wallet ${type}ed`); setOpen(false); setAmt(""); setReason(""); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">Wallet</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adjust wallet</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant={type === "credit" ? "default" : "outline"} onClick={() => setType("credit")} className={type === "credit" ? "bg-emerald-600 hover:bg-emerald-700" : ""}>Credit</Button>
            <Button variant={type === "debit" ? "default" : "outline"} onClick={() => setType("debit")} className={type === "debit" ? "bg-red-600 hover:bg-red-700" : ""}>Debit</Button>
          </div>
          <div><Label>Amount (USD)</Label><Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></div>
          <div><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Refund, correction, bonus…" /></div>
        </div>
        <DialogFooter>
          <Button onClick={apply} className="bg-gradient-gold text-gold-foreground hover:opacity-90">Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
