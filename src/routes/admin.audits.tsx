import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { FileCheck2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/admin/audits")({
  component: AdminAudits,
});

type Vault = { id: string; name: string; location: string };
type Audit = {
  id: string;
  auditor_name: string;
  auditor_firm: string | null;
  vault_id: string | null;
  grams_verified: number;
  audit_date: string;
  notes: string | null;
  report_url: string | null;
  created_at: string;
};

const schema = z.object({
  auditor_name: z.string().trim().min(2).max(120),
  auditor_firm: z.string().trim().max(120).optional(),
  vault_id: z.string().uuid().optional(),
  grams_verified: z.coerce.number().min(0),
  audit_date: z.string(),
  notes: z.string().trim().max(1000).optional(),
  report_url: z.string().trim().url().optional().or(z.literal("")),
});

function AdminAudits() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    auditor_name: "",
    auditor_firm: "",
    vault_id: "",
    grams_verified: "",
    audit_date: new Date().toISOString().slice(0, 10),
    notes: "",
    report_url: "",
  });

  const load = async () => {
    const [{ data: v }, { data: a }] = await Promise.all([
      supabase.from("vaults").select("id, name, location").order("name"),
      supabase.from("audit_logs").select("*").order("audit_date", { ascending: false }),
    ]);
    setVaults(v ?? []);
    setAudits(a ?? []);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.from("audit_logs").insert({
      auditor_name: parsed.data.auditor_name,
      auditor_firm: parsed.data.auditor_firm || null,
      vault_id: parsed.data.vault_id || null,
      grams_verified: parsed.data.grams_verified,
      audit_date: parsed.data.audit_date,
      notes: parsed.data.notes || null,
      report_url: parsed.data.report_url || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Audit entry added");
    setForm({ ...form, auditor_name: "", auditor_firm: "", grams_verified: "", notes: "", report_url: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this audit entry?")) return;
    const { error } = await supabase.from("audit_logs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compliance"
        icon={<FileCheck2 className="h-5 w-5" />}
        title="Audit log"
        subtitle="Publish independent vault audits to the public Proof of Reserves page."
      />

      <Card className="border-border/60 bg-card">
        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <div>
            <Label>Auditor name *</Label>
            <Input value={form.auditor_name} onChange={(e) => setForm({ ...form, auditor_name: e.target.value })} placeholder="e.g. Marc Reuter" />
          </div>
          <div>
            <Label>Audit firm</Label>
            <Input value={form.auditor_firm} onChange={(e) => setForm({ ...form, auditor_firm: e.target.value })} placeholder="Bureau Veritas" />
          </div>
          <div>
            <Label>Vault</Label>
            <Select value={form.vault_id} onValueChange={(v) => setForm({ ...form, vault_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select vault" /></SelectTrigger>
              <SelectContent>
                {vaults.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} — {v.location}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Grams verified *</Label>
            <Input type="number" value={form.grams_verified} onChange={(e) => setForm({ ...form, grams_verified: e.target.value })} placeholder="120000" />
          </div>
          <div>
            <Label>Audit date *</Label>
            <Input type="date" value={form.audit_date} onChange={(e) => setForm({ ...form, audit_date: e.target.value })} />
          </div>
          <div>
            <Label>Report URL</Label>
            <Input value={form.report_url} onChange={(e) => setForm({ ...form, report_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="md:col-span-3">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Scope, methodology, findings..." />
          </div>
          <div className="md:col-span-3">
            <Button onClick={submit} disabled={busy} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
              <Plus className="mr-1 h-4 w-4" /> {busy ? "Adding..." : "Publish audit"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card">
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {audits.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No audits yet.</div>
            ) : audits.map((a) => {
              const v = vaults.find((x) => x.id === a.vault_id);
              return (
                <div key={a.id} className="grid gap-3 p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <div className="font-semibold">{a.auditor_firm ?? "Independent"} — {a.auditor_name}</div>
                    <div className="text-xs text-muted-foreground">{v ? `${v.name} · ${v.location}` : "Cross-vault"}</div>
                    {a.notes && <p className="mt-1 text-sm text-muted-foreground">{a.notes}</p>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gradient-gold">{Number(a.grams_verified).toLocaleString()} g</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{new Date(a.audit_date).toLocaleDateString()}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}