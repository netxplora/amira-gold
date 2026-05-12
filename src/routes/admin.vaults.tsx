import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

type Courier = { id: string; name: string };
type Vault = {
  id: string; name: string; location: string; country: string | null; region: string | null;
  courier_id: string | null; capacity_grams: number; active: boolean; deleted_at: string | null;
};

const empty = { name: "", location: "", country: "", region: "", courier_id: "", capacity_grams: "", active: true };

export const Route = createFileRoute("/admin/vaults")({
  component: AdminVaults,
});

function AdminVaults() {
  const [items, setItems] = useState<Vault[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [editing, setEditing] = useState<Vault | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });

  const load = async () => {
    const [{ data: v }, { data: c }] = await Promise.all([
      supabase.from("vaults").select("*").is("deleted_at", null).order("name"),
      supabase.from("couriers").select("id,name").is("deleted_at", null),
    ]);
    setItems((v ?? []) as Vault[]);
    setCouriers((c ?? []) as Courier[]);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...empty }); setOpen(true); };
  const openEdit = (v: Vault) => {
    setEditing(v);
    setForm({
      name: v.name, location: v.location, country: v.country ?? "", region: v.region ?? "",
      courier_id: v.courier_id ?? "", capacity_grams: String(v.capacity_grams ?? ""), active: v.active,
    });
    setOpen(true);
  };
  const save = async () => {
    if (!form.name || !form.location) return toast.error("Name and location are required");
    const payload = {
      name: form.name, location: form.location,
      country: form.country || null, region: form.region || null,
      courier_id: form.courier_id || null,
      capacity_grams: Number(form.capacity_grams) || 0,
      active: form.active,
    };
    const { error } = editing
      ? await supabase.from("vaults").update(payload).eq("id", editing.id)
      : await supabase.from("vaults").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Vault updated" : "Vault added");
    setOpen(false); load();
  };
  const softDelete = async (v: Vault) => {
    if (!confirm(`Archive vault "${v.name}"? It can be restored later by support.`)) return;
    const { error } = await supabase.from("vaults").update({ deleted_at: new Date().toISOString(), active: false }).eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success("Vault archived"); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vaults</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
              <Plus className="mr-1.5 h-4 w-4" /> New vault
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit vault" : "New vault"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Vault name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Location *</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, Country" /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              <div><Label>Region</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="EMEA, APAC, Americas" /></div>
              <div><Label>Capacity (g)</Label><Input type="number" value={form.capacity_grams} onChange={(e) => setForm({ ...form, capacity_grams: e.target.value })} /></div>
              <div>
                <Label>Assigned courier</Label>
                <Select value={form.courier_id || "none"} onValueChange={(v) => setForm({ ...form, courier_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {couriers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 p-3 sm:col-span-2">
                <div><Label>Active</Label><p className="text-xs text-muted-foreground">Visible for customer allocation</p></div>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save} className="bg-gradient-gold text-gold-foreground hover:opacity-90">{editing ? "Save" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/60 bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Location</TableHead><TableHead>Region</TableHead>
              <TableHead>Courier</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Capacity</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">No vaults yet</TableCell></TableRow>}
              {items.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell>{v.location}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.region ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{couriers.find((c) => c.id === v.courier_id)?.name ?? "—"}</TableCell>
                  <TableCell>
                    {v.active
                      ? <span className="inline-flex items-center rounded-full bg-emerald/15 px-2 py-0.5 text-[11px] text-emerald">Active</span>
                      : <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Inactive</span>}
                  </TableCell>
                  <TableCell className="text-right">{Number(v.capacity_grams).toLocaleString()} g</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => softDelete(v)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
