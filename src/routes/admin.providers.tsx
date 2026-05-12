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
import { Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";

type Provider = {
  id: string;
  name: string;
  logo_url: string | null;
  url: string;
  active: boolean;
  priority: number;
  deleted_at: string | null;
};

export const Route = createFileRoute("/admin/providers")({ component: AdminProviders });

function AdminProviders() {
  const [items, setItems] = useState<Provider[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("crypto_providers")
      .select("*")
      .is("deleted_at", null)
      .order("priority");
    setItems((data ?? []) as Provider[]);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (p: Provider) => {
    const { error } = await supabase.from("crypto_providers").update({ active: !p.active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };

  const softDelete = async (id: string) => {
    if (!confirm("Remove this provider?")) return;
    const { error } = await supabase.from("crypto_providers").update({ deleted_at: new Date().toISOString(), active: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Provider removed");
    load();
  };

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Crypto providers</h1>
          <p className="text-sm text-muted-foreground">Third-party services users can use to buy crypto.</p>
        </div>
        <ProviderDialog onDone={load}>
          <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90"><Plus className="mr-1.5 h-4 w-4" /> Add provider</Button>
        </ProviderDialog>
      </div>

      <Input placeholder="Search providers…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <Card className="border-border/60 bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No providers</TableCell></TableRow>
              )}
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted/40">
                      {p.logo_url ? <img src={p.logo_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="m-auto mt-2.5 h-5 w-5 text-muted-foreground" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{p.url}</TableCell>
                  <TableCell>{p.priority}</TableCell>
                  <TableCell>{p.active ? <span className="text-emerald-400">Active</span> : <span className="text-muted-foreground">Inactive</span>}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <ProviderDialog provider={p} onDone={load}>
                      <Button size="sm" variant="outline"><Pencil className="h-3 w-3" /></Button>
                    </ProviderDialog>
                    <Button size="sm" variant="outline" onClick={() => toggle(p)}>{p.active ? "Disable" : "Enable"}</Button>
                    <Button size="sm" variant="destructive" onClick={() => softDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
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

function ProviderDialog({ provider, onDone, children }: { provider?: Provider; onDone: () => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(provider?.name ?? "");
  const [url, setUrl] = useState(provider?.url ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(provider?.logo_url ?? null);
  const [priority, setPriority] = useState(String(provider?.priority ?? 0));
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(provider?.name ?? "");
    setUrl(provider?.url ?? "");
    setLogoUrl(provider?.logo_url ?? null);
    setPriority(String(provider?.priority ?? 0));
  };

  const save = async () => {
    if (!name.trim() || !url.trim()) return toast.error("Name and URL are required");
    try { new URL(url); } catch { return toast.error("URL must be a valid http(s) link"); }
    setSaving(true);
    const payload = { name: name.trim(), url: url.trim(), logo_url: logoUrl, priority: Number(priority) || 0 };
    const { error } = provider
      ? await supabase.from("crypto_providers").update(payload).eq("id", provider.id)
      : await supabase.from("crypto_providers").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(provider ? "Provider updated" : "Provider added");
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{provider ? "Edit provider" : "Add provider"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={64} /></div>
          <div><Label>URL *</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://buy.moonpay.com" /></div>
          <div><Label>Priority (lower = first)</Label><Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} /></div>
          <ImageUpload label="Logo" bucket="provider-logos" folder={provider?.id ?? "new"} value={logoUrl} onChange={setLogoUrl} />
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
