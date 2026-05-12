import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { calcJewelryPrice, type JewelryCategory, type JewelryProduct, type JewelryPurity, type MakingChargeType } from "@/lib/jewelry";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Layers, DollarSign, Package, History } from "lucide-react";

export const Route = createFileRoute("/admin/marketplace")({
  component: AdminMarketplace,
});

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

type AuditEntry = {
  id: string;
  product_id: string;
  product_name: string;
  changed_by: string | null;
  old_making_charge_type: string | null;
  old_making_charge_value: number | null;
  new_making_charge_type: string | null;
  new_making_charge_value: number | null;
  old_stock: number | null;
  new_stock: number | null;
  change_kind: string;
  notes: string | null;
  created_at: string;
};

function AdminMarketplace() {
  const { pricePerGram } = useGoldPrice();
  const [items, setItems] = useState<JewelryProduct[]>([]);
  const [categories, setCategories] = useState<JewelryCategory[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [auditOpen, setAuditOpen] = useState(false);
  const [audits, setAudits] = useState<AuditEntry[]>([]);

  const load = async () => {
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("jewelry_categories" as never).select("*").order("sort_order"),
      supabase.from("jewelry_products" as never).select("*").is("deleted_at", null).order("created_at", { ascending: false }),
    ]);
    setCategories((cats ?? []) as unknown as JewelryCategory[]);
    setItems((prods ?? []) as unknown as JewelryProduct[]);
    setSelected(new Set());
  };
  useEffect(() => { load(); }, []);

  const loadAudits = async () => {
    const { data } = await supabase.from("jewelry_price_audits" as never).select("*").order("created_at", { ascending: false }).limit(100);
    setAudits((data ?? []) as unknown as AuditEntry[]);
  };

  const remove = async (p: JewelryProduct) => {
    if (!confirm(`Remove "${p.name}"? It will be hidden from the marketplace.`)) return;
    const { error } = await supabase.from("jewelry_products" as never).update({ deleted_at: new Date().toISOString(), active: false } as never).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Removed"); load();
  };
  const toggle = async (p: JewelryProduct) => {
    await supabase.from("jewelry_products" as never).update({ active: !p.active } as never).eq("id", p.id);
    load();
  };

  const allSelected = items.length > 0 && selected.size === items.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((p) => p.id)));
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectedItems = useMemo(() => items.filter((p) => selected.has(p.id)), [items, selected]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Jewelry marketplace</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { setAuditOpen(true); loadAudits(); }} className="gap-2">
            <History className="h-4 w-4" /> Audit log
          </Button>
          <ProductDialog categories={categories} onDone={load}>
            <Button className="gap-2 bg-gradient-gold text-gold-foreground hover:opacity-90"><Plus className="h-4 w-4" /> New product</Button>
          </ProductDialog>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <Card className="border-gold/40 bg-gold/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-gold" />
              <span className="font-semibold">{selected.size} product{selected.size === 1 ? "" : "s"} selected</span>
              <button className="ml-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelected(new Set())}>Clear</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <BulkPriceDialog selected={selectedItems} onDone={load}>
                <Button size="sm" variant="outline" className="gap-2 border-gold/40"><DollarSign className="h-3.5 w-3.5" /> Update pricing</Button>
              </BulkPriceDialog>
              <BulkStockDialog selected={selectedItems} onDone={load}>
                <Button size="sm" variant="outline" className="gap-2 border-gold/40"><Package className="h-3.5 w-3.5" /> Update stock</Button>
              </BulkStockDialog>
            </div>
          </CardContent>
        </Card>
      )}

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" /></TableHead>
            <TableHead className="w-16">Image</TableHead><TableHead>Name</TableHead><TableHead>SKU</TableHead><TableHead>Purity</TableHead><TableHead>Weight</TableHead><TableHead>Stock</TableHead><TableHead>Making</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map((p) => {
              const price = calcJewelryPrice(p, pricePerGram);
              const isSel = selected.has(p.id);
              const lowStock = p.stock_quantity > 0 && p.stock_quantity <= 3;
              return (
                <TableRow key={p.id} data-state={isSel ? "selected" : undefined}>
                  <TableCell><Checkbox checked={isSel} onCheckedChange={() => toggleOne(p.id)} aria-label="Select row" /></TableCell>
                  <TableCell><div className="h-10 w-10 overflow-hidden rounded bg-muted/40">{p.thumbnail_url && <img src={p.thumbnail_url} className="h-full w-full object-cover" alt="" loading="lazy" />}</div></TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell><Badge variant="outline">{p.purity}</Badge></TableCell>
                  <TableCell>{p.weight_grams}g</TableCell>
                  <TableCell>
                    <span className={lowStock ? "font-semibold text-amber-500" : p.stock_quantity === 0 ? "font-semibold text-ruby" : undefined}>
                      {p.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{p.making_charge_value}{p.making_charge_type === "percent" ? "%" : "$"}</TableCell>
                  <TableCell>{formatUSD(price.total)}</TableCell>
                  <TableCell>{p.active ? <span className="text-emerald-500 text-xs">Active</span> : <span className="text-muted-foreground text-xs">Inactive</span>}</TableCell>
                  <TableCell className="space-x-1 text-right">
                    <ProductDialog product={p} categories={categories} onDone={load}><Button size="sm" variant="outline"><Pencil className="h-3 w-3" /></Button></ProductDialog>
                    <Button size="sm" variant="outline" onClick={() => toggle(p)}>{p.active ? "Hide" : "Show"}</Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(p)}><Trash2 className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && <TableRow><TableCell colSpan={11} className="py-8 text-center text-muted-foreground">No products yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5 text-gold" /> Bulk update audit log</DialogTitle>
            <DialogDescription>Recent bulk price and stock changes across the jewelry catalog.</DialogDescription>
          </DialogHeader>
          {audits.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No audit entries yet.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Product</TableHead><TableHead>Kind</TableHead><TableHead>Before</TableHead><TableHead>After</TableHead></TableRow></TableHeader>
              <TableBody>
                {audits.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{a.product_name}</TableCell>
                    <TableCell><Badge variant="outline" className={a.change_kind === "price" ? "border-gold/40 text-gold" : "border-blue-500/40 text-blue-500"}>{a.change_kind}</Badge></TableCell>
                    <TableCell className="text-xs">
                      {a.change_kind === "price"
                        ? `${a.old_making_charge_value ?? "—"}${a.old_making_charge_type === "percent" ? "%" : "$"}`
                        : a.old_stock ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {a.change_kind === "price"
                        ? `${a.new_making_charge_value ?? "—"}${a.new_making_charge_type === "percent" ? "%" : "$"}`
                        : a.new_stock ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BulkPriceDialog({ selected, onDone, children }: { selected: JewelryProduct[]; onDone: () => void; children: React.ReactNode }) {
  const { pricePerGram } = useGoldPrice();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MakingChargeType>("percent");
  const [value, setValue] = useState("10");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const numericValue = Number(value);
  const valid = !Number.isNaN(numericValue) && numericValue >= 0;

  const preview = selected.slice(0, 5).map((p) => {
    const before = calcJewelryPrice(p, pricePerGram);
    const after = calcJewelryPrice({ ...p, making_charge_type: type, making_charge_value: numericValue || 0 }, pricePerGram);
    return { p, before: before.total, after: after.total };
  });

  const submit = async () => {
    if (!valid) { toast.error("Enter a valid non-negative number"); return; }
    if (selected.length === 0) { toast.error("No products selected"); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("bulk_update_jewelry_making_charge" as never, {
      _product_ids: selected.map((p) => p.id),
      _new_type: type,
      _new_value: numericValue,
      _notes: notes || null,
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    const result = data as unknown as { updated: number };
    toast.success(`Updated ${result?.updated ?? selected.length} products`);
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-gold" /> Bulk update making charge</DialogTitle>
          <DialogDescription>Apply a new making charge to {selected.length} selected product{selected.length === 1 ? "" : "s"}. Audited for compliance.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Charge type</Label>
            <Select value={type} onValueChange={(v) => setType(v as MakingChargeType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percent of gold value</SelectItem>
                <SelectItem value="fixed">Fixed USD per piece</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>New value</Label>
            <Input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
            {!valid && <p className="mt-1 text-xs text-ruby">Enter a non-negative number.</p>}
          </div>
          <div className="sm:col-span-2">
            <Label>Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for change (e.g. Q2 catalog refresh)" />
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wide text-muted-foreground">Live preview</span>
            <span className="text-muted-foreground">@ {formatUSD(pricePerGram)}/g</span>
          </div>
          <div className="space-y-1.5 text-xs">
            {preview.map(({ p, before, after }) => {
              const diff = after - before;
              return (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <span className="line-clamp-1">{p.name}</span>
                  <span className="flex items-center gap-2 font-mono">
                    <span className="text-muted-foreground line-through">{formatUSD(before)}</span>
                    <span className="font-semibold text-gold">{formatUSD(after)}</span>
                    <span className={`text-[10px] ${diff >= 0 ? "text-emerald-500" : "text-ruby"}`}>{diff >= 0 ? "+" : ""}{formatUSD(diff)}</span>
                  </span>
                </div>
              );
            })}
            {selected.length > 5 && <p className="pt-1 text-center text-[11px] text-muted-foreground">…and {selected.length - 5} more</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={busy || !valid} onClick={submit} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
            {busy ? "Updating…" : `Apply to ${selected.length} product${selected.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkStockDialog({ selected, onDone, children }: { selected: JewelryProduct[]; onDone: () => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"set" | "add">("set");
  const [value, setValue] = useState("0");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const numeric = Number(value);
  const valid = !Number.isNaN(numeric) && Number.isInteger(numeric) && (mode === "add" || numeric >= 0);

  const wouldGoNegative = mode === "add" && selected.some((p) => p.stock_quantity + numeric < 0);

  const submit = async () => {
    if (!valid) { toast.error("Enter a whole number"); return; }
    if (selected.length === 0) { toast.error("No products selected"); return; }
    if (wouldGoNegative && !confirm("This adjustment would push some items to negative stock — they'll be clamped to 0. Continue?")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("bulk_update_jewelry_stock" as never, {
      _product_ids: selected.map((p) => p.id),
      _new_stock: numeric,
      _mode: mode,
      _notes: notes || null,
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    const result = data as unknown as { updated: number };
    toast.success(`Stock updated on ${result?.updated ?? selected.length} products`);
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-gold" /> Bulk update stock</DialogTitle>
          <DialogDescription>Apply a stock change to {selected.length} selected product{selected.length === 1 ? "" : "s"}. Audited for compliance.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as "set" | "add")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="set">Set absolute quantity</SelectItem>
                <SelectItem value="add">Adjust by ± amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{mode === "set" ? "New quantity" : "Delta (e.g. -2)"}</Label>
            <Input type="number" step="1" value={value} onChange={(e) => setValue(e.target.value)} />
            {!valid && <p className="mt-1 text-xs text-ruby">Enter a whole number{mode === "set" ? " ≥ 0" : ""}.</p>}
          </div>
          <div className="sm:col-span-2">
            <Label>Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason (e.g. Restock from supplier)" />
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-xs">
          <div className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">Preview</div>
          {selected.slice(0, 5).map((p) => {
            const after = mode === "set" ? numeric : Math.max(0, p.stock_quantity + numeric);
            return (
              <div key={p.id} className="flex justify-between"><span className="line-clamp-1">{p.name}</span><span className="font-mono"><span className="text-muted-foreground">{p.stock_quantity}</span> → <span className="font-semibold">{after}</span></span></div>
            );
          })}
          {selected.length > 5 && <p className="pt-1 text-center text-[11px] text-muted-foreground">…and {selected.length - 5} more</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={busy || !valid} onClick={submit} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
            {busy ? "Updating…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog({ product, categories, onDone, children }: { product?: JewelryProduct; categories: JewelryCategory[]; onDone: () => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [purity, setPurity] = useState<JewelryPurity>(product?.purity ?? "22k");
  const [weight, setWeight] = useState(String(product?.weight_grams ?? ""));
  const [mcType, setMcType] = useState<MakingChargeType>(product?.making_charge_type ?? "percent");
  const [mcValue, setMcValue] = useState(String(product?.making_charge_value ?? "10"));
  const [stock, setStock] = useState(String(product?.stock_quantity ?? "0"));
  const [description, setDescription] = useState(product?.description ?? "");
  const [thumbnail, setThumbnail] = useState<string | null>(product?.thumbnail_url ?? null);
  const [gallery, setGallery] = useState<string[]>(product?.gallery_urls ?? []);

  const save = async () => {
    if (!name || !weight || !categoryId) { toast.error("Name, category and weight are required"); return; }
    const finalSku = sku || `JWL-${Date.now().toString(36).toUpperCase()}`;
    const payload = {
      name, sku: finalSku, slug: product?.slug ?? slugify(name) + "-" + Math.random().toString(36).slice(2, 6),
      category_id: categoryId, purity, weight_grams: Number(weight),
      making_charge_type: mcType, making_charge_value: Number(mcValue),
      stock_quantity: Math.max(0, Math.floor(Number(stock))),
      description: description || null, thumbnail_url: thumbnail, gallery_urls: gallery,
    };
    const q = product
      ? supabase.from("jewelry_products" as never).update(payload as never).eq("id", product.id)
      : supabase.from("jewelry_products" as never).insert(payload as never);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(product ? "Saved" : "Created"); setOpen(false); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>SKU</Label><Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="auto-generated" /></div>
          <div><Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Purity</Label>
            <Select value={purity} onValueChange={(v) => setPurity(v as JewelryPurity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="18k">18k</SelectItem><SelectItem value="22k">22k</SelectItem><SelectItem value="24k">24k</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Weight (g)</Label><Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
          <div><Label>Making charge type</Label>
            <Select value={mcType} onValueChange={(v) => setMcType(v as MakingChargeType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="percent">Percent of gold value</SelectItem><SelectItem value="fixed">Fixed USD</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Making charge value</Label><Input type="number" value={mcValue} onChange={(e) => setMcValue(e.target.value)} /></div>
          <div><Label>Stock quantity</Label><Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="sm:col-span-2">
            <ImageUpload label="Thumbnail" bucket="jewelry-images" folder={product?.id ?? "new"} value={thumbnail} onChange={setThumbnail} />
          </div>
          <div className="sm:col-span-2">
            <Label>Gallery images</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {gallery.map((url, i) => (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded border border-border/60">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setGallery(gallery.filter((_, j) => j !== i))} className="absolute right-0 top-0 bg-background/80 p-0.5 text-destructive">×</button>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <ImageUpload label="Add gallery image" bucket="jewelry-images" folder={(product?.id ?? "new") + "/gallery"} value={null} onChange={(url) => { if (url) setGallery([...gallery, url]); }} />
            </div>
          </div>
        </div>
        <DialogFooter><Button onClick={save} className="bg-gradient-gold text-gold-foreground hover:opacity-90">{product ? "Save changes" : "Create product"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

