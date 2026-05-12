import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatUSD } from "@/lib/gold-price";
import { Receipt, Eye, Truck, Layers } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/jewelry-orders")({
  component: AdminJewelryOrders,
});

type JOrder = {
  id: string; user_id: string; status: string; subtotal_usd: number; shipping_usd: number; total_usd: number;
  delivery_full_name: string; delivery_address: string; delivery_country: string | null; delivery_phone: string | null;
  tracking_number: string | null; notes: string | null; created_at: string;
  payment_method: string; payment_proof_url: string | null; payment_proof_status: string; payment_proof_tx_hash: string | null;
  courier?: { name: string } | null;
};
type JItem = { id: string; product_name: string; product_sku: string; weight_grams: number; purity: string; unit_price_usd: number; quantity: number };

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;

const STATUS_VARIANT: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  paid: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  processing: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  shipped: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  delivered: "bg-gold/15 text-gold border-gold/30",
  cancelled: "bg-rose-500/15 text-rose-500 border-rose-500/30",
};

function AdminJewelryOrders() {
  const [orders, setOrders] = useState<JOrder[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [active, setActive] = useState<JOrder | null>(null);
  const [items, setItems] = useState<JItem[]>([]);
  const [tracking, setTracking] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkTracking, setBulkTracking] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, courier:couriers(name)")
      .eq("type", "jewelry")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { toast.error(error.message); return; }
    setOrders((data ?? []) as unknown as JOrder[]);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.rpc("update_jewelry_order_status", {
      _order_id: id,
      _status: status as any
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Order moved to ${status}`);
    load();
  };

  const saveTracking = async () => {
    if (!active) return;
    const { error } = await supabase.rpc("update_jewelry_order_status", {
      _order_id: active.id,
      _status: active.status as any,
      _tracking_number: tracking || undefined
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Tracking updated");
    setActive({ ...active, tracking_number: tracking || null });
    load();
  };

  const reviewProof = async (decision: string) => {
    if (!active) return;
    const { error } = await supabase.rpc("review_jewelry_payment_proof", { _order_id: active.id, _decision: decision as any });
    if (error) { toast.error(error.message); return; }
    toast.success("Proof " + decision);
    load();
    setActive({ ...active, payment_proof_status: decision, status: decision === 'verified' ? 'paid' : active.status });
  };

  const openOrder = async (o: JOrder) => {
    setActive(o);
    setTracking(o.tracking_number ?? "");
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id);
    setItems((data ?? []) as unknown as JItem[]);
  };

  const filtered = useMemo(() => filter === "all" ? orders : orders.filter((o) => o.status === filter), [orders, filter]);

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(filtered.map((o) => o.id)) : new Set());
  };
  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const runBulk = async () => {
    if (!bulkStatus || selected.size === 0) return;
    const { data, error } = await supabase.rpc("bulk_update_jewelry_order_status", {
      _order_ids: Array.from(selected),
      _new_status: bulkStatus as any,
      _tracking_number: bulkTracking || undefined,
    });
    if (error) { toast.error(error.message); return; }
    const r = data as unknown as { updated: number; skipped: number };
    toast.success(`${r.updated} updated, ${r.skipped} skipped (invalid transition)`);
    setSelected(new Set());
    setBulkStatus("");
    setBulkTracking("");
    setConfirmOpen(false);
    load();
  };

  const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace Fulfilment"
        title="Jewelry Orders"
        subtitle="Move orders through pending → processing → shipped → delivered."
        icon={<Receipt className="h-6 w-6" />}
        actions={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44 bg-card/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <Card><CardContent className="p-0">
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-gold/5 p-3">
            <Layers className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Set status to…" /></SelectTrigger>
                <SelectContent>
                  {STATUSES.filter((s) => s !== "pending").map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {bulkStatus === "shipped" && (
                <Input className="h-8 w-44" placeholder="Tracking # (optional)" value={bulkTracking} onChange={(e) => setBulkTracking(e.target.value)} />
              )}
              <Button size="sm" disabled={!bulkStatus} onClick={() => setConfirmOpen(true)}>Apply</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          </div>
        )}
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(!!v)} /></TableHead>
            <TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Courier</TableHead>
            <TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead className="w-32">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No jewelry orders.</TableCell></TableRow>
            )}
            {filtered.map((o) => (
              <TableRow key={o.id}>
                <TableCell><Checkbox checked={selected.has(o.id)} onCheckedChange={(v) => toggleOne(o.id, !!v)} /></TableCell>
                <TableCell className="text-xs">{new Date(o.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{o.delivery_full_name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{o.delivery_country ?? o.delivery_address}</div>
                </TableCell>
                <TableCell className="text-xs">{o.courier?.name ?? "—"}</TableCell>
                <TableCell className="font-semibold">{formatUSD(Number(o.total_usd))}</TableCell>
                <TableCell>
                  <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                    <SelectTrigger className={`h-8 w-36 border ${STATUS_VARIANT[o.status] ?? ""}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => openOrder(o)}><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-gold" /> Order details</DialogTitle></DialogHeader>
          {active && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Delivery</div>
                  <div className="font-medium">{active.delivery_full_name}</div>
                  <div className="text-muted-foreground">{active.delivery_address}</div>
                  {active.delivery_country && <div className="text-muted-foreground">{active.delivery_country}</div>}
                  {active.delivery_phone && <div className="text-muted-foreground">{active.delivery_phone}</div>}
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Status</div>
                  <Badge variant="outline" className={STATUS_VARIANT[active.status]}>{active.status}</Badge>
                  <div className="mt-2 text-xs uppercase text-muted-foreground">Courier</div>
                  <div>{active.courier?.name ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Payment</div>
                  <div className="capitalize font-medium">{active.payment_method}</div>
                  {active.payment_method === "crypto" && active.payment_proof_status !== "none" && (
                    <div className="mt-2 text-xs">
                      <span className="uppercase text-muted-foreground block mb-1">Proof Status</span>
                      <Badge variant="outline" className={active.payment_proof_status === 'verified' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' : active.payment_proof_status === 'rejected' ? 'bg-rose-500/15 text-rose-500 border-rose-500/30' : 'bg-amber-500/15 text-amber-500 border-amber-500/30'}>
                        {active.payment_proof_status}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {active.payment_method === "crypto" && active.payment_proof_url && (
                <div className="rounded-lg border border-border/60 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Crypto Payment Proof</div>
                    <Button size="sm" variant="outline" asChild><a href={active.payment_proof_url} target="_blank" rel="noreferrer"><Eye className="h-4 w-4 mr-2" /> View Full</a></Button>
                  </div>
                  <img src={active.payment_proof_url} alt="Proof" className="w-full max-h-64 object-contain rounded border border-border/40 bg-black/20" />
                  
                  {active.payment_proof_tx_hash && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Transaction Hash / Ref</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 break-all rounded border border-border/40 bg-muted/30 p-2 font-mono text-[11px] leading-tight">
                          {active.payment_proof_tx_hash}
                        </code>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          onClick={() => {
                            navigator.clipboard.writeText(active.payment_proof_tx_hash!);
                            toast.success("Hash copied");
                          }}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </Button>
                      </div>
                    </div>
                  )}
                  {active.payment_proof_status === "submitted" && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => reviewProof('verified')}>Verify & Mark Paid</Button>
                      <Button size="sm" variant="destructive" onClick={() => reviewProof('rejected')}>Reject Proof</Button>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-lg border border-border/60 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium"><Truck className="h-4 w-4 text-gold" /> Tracking number</div>
                <div className="flex gap-2">
                  <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Enter tracking #" />
                  <Button onClick={saveTracking}>Save</Button>
                </div>
              </div>

              <div className="rounded-lg border border-border/60">
                <Table>
                  <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Unit</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="text-sm">
                          <div className="font-medium">{it.product_name}</div>
                          <div className="text-xs text-muted-foreground">{it.purity} · {it.weight_grams}g · {it.product_sku}</div>
                        </TableCell>
                        <TableCell>{it.quantity}</TableCell>
                        <TableCell className="text-right">{formatUSD(Number(it.unit_price_usd))}</TableCell>
                        <TableCell className="text-right font-semibold">{formatUSD(Number(it.unit_price_usd) * it.quantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatUSD(Number(active.subtotal_usd))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatUSD(Number(active.shipping_usd))}</span></div>
                <div className="flex justify-between border-t border-border/60 pt-2 font-bold"><span>Total</span><span className="text-gold">{formatUSD(Number(active.total_usd))}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply bulk status change?</AlertDialogTitle>
            <AlertDialogDescription>
              About to set <span className="font-semibold text-foreground">{selected.size}</span> order(s) to{" "}
              <span className="font-semibold text-foreground">{bulkStatus}</span>. Orders that would form an invalid
              transition (e.g., already delivered or cancelled) will be skipped automatically.
              {bulkStatus === "shipped" && bulkTracking && <> Tracking number <span className="font-mono">{bulkTracking}</span> will be applied to all updated orders.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runBulk}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}