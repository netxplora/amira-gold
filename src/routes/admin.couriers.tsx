import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

type Courier = { id: string; name: string; regions: string[]; base_fee_usd: number; active: boolean; logo_url: string | null };

export const Route = createFileRoute("/admin/couriers")({ component: AdminCouriers });

function AdminCouriers() {
  const [items, setItems] = useState<Courier[]>([]);
  const [name, setName] = useState(""); const [regions, setRegions] = useState(""); const [fee, setFee] = useState("");

  const load = () =>
    supabase
      .from("couriers")
      .select("*")
      .is("deleted_at", null)
      .order("name")
      .then(({ data }) => setItems((data ?? []) as Courier[]));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name) return toast.error("Name required");
    const { error } = await supabase.from("couriers").insert({
      name, regions: regions.split(",").map((r) => r.trim()).filter(Boolean), base_fee_usd: Number(fee) || 0,
    });
    if (error) return toast.error(error.message);
    setName(""); setRegions(""); setFee(""); toast.success("Courier added"); load();
  };
  const toggle = async (c: Courier) => { await supabase.from("couriers").update({ active: !c.active }).eq("id", c.id); load(); };
  const remove = async (id: string) => {
    if (!confirm("Remove this courier?")) return;
    const { error } = await supabase.from("couriers").update({ deleted_at: new Date().toISOString(), active: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Courier removed"); load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Couriers</h1>
      <Card className="border-border/60 bg-card">
        <CardContent className="grid gap-3 p-6 md:grid-cols-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Regions (comma-sep)</Label><Input value={regions} onChange={(e) => setRegions(e.target.value)} placeholder="EU, US" /></div>
          <div><Label>Base fee USD</Label><Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} /></div>
          <div className="flex items-end"><Button onClick={create} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">Add</Button></div>
        </CardContent>
      </Card>
      <Card className="border-border/60 bg-card"><CardContent className="p-0">
        <Table><TableHeader><TableRow>
          <TableHead className="w-16">Logo</TableHead><TableHead>Name</TableHead><TableHead>Regions</TableHead><TableHead>Fee</TableHead>
          <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
        </TableRow></TableHeader><TableBody>
          {items.map((c) => <TableRow key={c.id}>
            <TableCell>
              <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted/40">
                {c.logo_url ? <img src={c.logo_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
              </div>
            </TableCell>
            <TableCell>{c.name}</TableCell>
            <TableCell className="text-xs">{c.regions.join(", ")}</TableCell>
            <TableCell>${Number(c.base_fee_usd).toFixed(2)}</TableCell>
            <TableCell>{c.active ? <span className="text-emerald-400">Active</span> : <span className="text-muted-foreground">Inactive</span>}</TableCell>
            <TableCell className="space-x-2 text-right">
              <EditCourierDialog courier={c} onDone={load} />
              <Button size="sm" variant="outline" onClick={() => toggle(c)}>{c.active ? "Disable" : "Enable"}</Button>
              <Button size="sm" variant="destructive" onClick={() => remove(c.id)}><Trash2 className="h-3 w-3" /></Button>
            </TableCell>
          </TableRow>)}
        </TableBody></Table>
      </CardContent></Card>
    </div>
  );
}

function EditCourierDialog({ courier, onDone }: { courier: Courier; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(courier.name);
  const [regions, setRegions] = useState(courier.regions.join(", "));
  const [fee, setFee] = useState(String(courier.base_fee_usd));
  const [logoUrl, setLogoUrl] = useState<string | null>(courier.logo_url);

  const save = async () => {
    const { error } = await supabase.from("couriers").update({
      name, regions: regions.split(",").map((r) => r.trim()).filter(Boolean),
      base_fee_usd: Number(fee) || 0, logo_url: logoUrl,
    }).eq("id", courier.id);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setOpen(false); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="h-3 w-3" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit courier</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Regions (comma-sep)</Label><Input value={regions} onChange={(e) => setRegions(e.target.value)} /></div>
          <div><Label>Base fee USD</Label><Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} /></div>
          <ImageUpload label="Courier logo" bucket="courier-logos" folder={courier.id} value={logoUrl} onChange={setLogoUrl} />
        </div>
        <DialogFooter><Button onClick={save} className="bg-gradient-gold text-gold-foreground hover:opacity-90">Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
