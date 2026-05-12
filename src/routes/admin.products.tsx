import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

type Product = { id: string; name: string; weight_grams: number; premium_pct: number; active: boolean; image_url: string | null };

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [name, setName] = useState(""); const [weight, setWeight] = useState(""); const [premium, setPremium] = useState("3");

  const load = () =>
    supabase
      .from("gold_products")
      .select("*")
      .is("deleted_at", null)
      .order("weight_grams")
      .then(({ data }) => setItems((data ?? []) as Product[]));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name || !weight) return toast.error("Fill all fields");
    const { error } = await supabase.from("gold_products").insert({ name, weight_grams: Number(weight), premium_pct: Number(premium) });
    if (error) return toast.error(error.message);
    setName(""); setWeight(""); setPremium("3"); toast.success("Product added"); load();
  };
  const toggle = async (p: Product) => { await supabase.from("gold_products").update({ active: !p.active }).eq("id", p.id); load(); };
  const remove = async (id: string) => {
    if (!confirm("Remove this product? It will be hidden from the catalog.")) return;
    const { error } = await supabase.from("gold_products").update({ deleted_at: new Date().toISOString(), active: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Product removed");
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gold products</h1>
      <Card className="border-border/60 bg-card">
        <CardContent className="grid gap-3 p-6 md:grid-cols-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Weight (g)</Label><Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
          <div><Label>Premium %</Label><Input type="number" value={premium} onChange={(e) => setPremium(e.target.value)} /></div>
          <div className="flex items-end"><Button onClick={create} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">Add</Button></div>
        </CardContent>
      </Card>
      <Card className="border-border/60 bg-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-16">Image</TableHead><TableHead>Name</TableHead><TableHead>Weight</TableHead><TableHead>Premium</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted/40">
                    {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                  </div>
                </TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.weight_grams}g</TableCell>
                <TableCell>{p.premium_pct}%</TableCell>
                <TableCell>{p.active ? <span className="text-emerald-400">Active</span> : <span className="text-muted-foreground">Inactive</span>}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <EditDialog product={p} onDone={load} />
                  <Button size="sm" variant="outline" onClick={() => toggle(p)}>{p.active ? "Disable" : "Enable"}</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function EditDialog({ product, onDone }: { product: Product; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [weight, setWeight] = useState(String(product.weight_grams));
  const [premium, setPremium] = useState(String(product.premium_pct));
  const [imageUrl, setImageUrl] = useState<string | null>(product.image_url ?? null);

  const save = async () => {
    const { error } = await supabase.from("gold_products").update({
      name, weight_grams: Number(weight), premium_pct: Number(premium), image_url: imageUrl,
    }).eq("id", product.id);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setOpen(false); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="h-3 w-3" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit product</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Weight (g)</Label><Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
          <div><Label>Premium %</Label><Input type="number" value={premium} onChange={(e) => setPremium(e.target.value)} /></div>
          <ImageUpload label="Product image" bucket="product-images" folder={product.id} value={imageUrl} onChange={setImageUrl} />
        </div>
        <DialogFooter><Button onClick={save} className="bg-gradient-gold text-gold-foreground hover:opacity-90">Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
