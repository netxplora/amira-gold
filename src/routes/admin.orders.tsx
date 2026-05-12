import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatUSD } from "@/lib/gold-price";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Truck, Hash } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

type Order = {
  id: string; user_id: string; type: string; status: string; grams: number; total_usd: number;
  created_at: string; serial_number: string | null; insurance_tier: string | null; vault_id: string | null;
};
type Vault = { id: string; name: string; location: string };
const STATUSES = ["pending","confirmed","allocated","shipped","delivered","cancelled"] as const;
const TIERS = ["standard", "premium", "sovereign"] as const;

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

function AdminOrders() {
  const [items, setItems] = useState<Order[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const load = () => supabase.from("orders").select("*").neq("type", "jewelry").order("created_at", { ascending: false }).limit(200)
    .then(({ data }) => setItems((data ?? []) as Order[]));

  useEffect(() => {
    load();
    supabase.from("vaults").select("id,name,location").then(({ data }) => setVaults((data ?? []) as Vault[]));
  }, []);

  const update = async (id: string, patch: Record<string, any>) => {
    const { error } = await supabase.rpc("update_gold_order_status", {
      _order_id: id,
      _status: patch.status,
      _serial_number: patch.serial_number,
      _vault_id: patch.vault_id,
      _insurance_tier: patch.insurance_tier
    });
    if (error) return toast.error(error.message);
    toast.success("Order updated");
    load();
  };

  const filtered = filter === "all" ? items : items.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Order Fulfilment"
        title="Orders"
        subtitle="Approve, allocate, assign vault serials, and dispatch insured deliveries."
        icon={<Truck className="h-6 w-6" />}
        actions={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 bg-card/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
      <Card className="border-border/60 bg-card/80">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Type</TableHead>
              <TableHead>Grams</TableHead><TableHead>Total</TableHead>
              <TableHead>Vault</TableHead><TableHead>Serial #</TableHead><TableHead>Insurance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No orders.</TableCell></TableRow>
              )}
              {filtered.map((o) => (
                <SerialRow key={o.id} o={o} vaults={vaults} onUpdate={update} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SerialRow({ o, vaults, onUpdate }: { o: Order; vaults: Vault[]; onUpdate: (id: string, patch: Record<string, unknown>) => void }) {
  const [serial, setSerial] = useState(o.serial_number ?? "");
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</TableCell>
      <TableCell className="font-mono text-xs">{o.user_id.slice(0, 8)}…</TableCell>
      <TableCell className="capitalize">{o.type}</TableCell>
      <TableCell>{Number(o.grams).toFixed(4)} g</TableCell>
      <TableCell className="font-semibold text-gold">{formatUSD(Number(o.total_usd))}</TableCell>
      <TableCell>
        <Select value={o.vault_id ?? ""} onValueChange={(v) => onUpdate(o.id, { vault_id: v })}>
          <SelectTrigger className="h-8 w-36"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            {vaults.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Hash className="h-3 w-3 text-gold" />
          <Input className="h-8 w-32 font-mono text-xs" value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="AMG-…" />
          {serial !== (o.serial_number ?? "") && (
            <Button size="sm" className="h-8 bg-gradient-gold text-gold-foreground" onClick={() => onUpdate(o.id, { serial_number: serial || null })}>Save</Button>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Select value={o.insurance_tier ?? ""} onValueChange={(v) => onUpdate(o.id, { insurance_tier: v })}>
          <SelectTrigger className="h-8 w-32"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            {TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select value={o.status} onValueChange={(v) => onUpdate(o.id, { status: v })}>
          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}
