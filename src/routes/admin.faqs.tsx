import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HelpCircle, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/faqs")({ component: AdminFaqs });

type Faq = { id: string; category: string; question: string; answer: string; priority: number; active: boolean };

function AdminFaqs() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [previewing, setPreviewing] = useState<Faq | null>(null);

  const load = () => {
    setLoading(true);
    supabase.from("faqs").select("*").order("category").order("priority", { ascending: false })
      .then(({ data }) => { setFaqs((data ?? []) as Faq[]); setLoading(false); });
  };
  useEffect(load, []);

  const save = async () => {
    if (!editing) return;
    const payload = {
      category: editing.category.trim(),
      question: editing.question.trim(),
      answer: editing.answer.trim(),
      priority: editing.priority || 0,
      active: editing.active,
    };
    if (!payload.question || !payload.answer || !payload.category) { toast.error("All fields required"); return; }
    if (editing.id) {
      const { error } = await supabase.from("faqs").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("faqs").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved"); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    await supabase.from("faqs").delete().eq("id", id);
    load();
  };

  const reorder = async (f: Faq, dir: 1 | -1) => {
    await supabase.from("faqs").update({ priority: f.priority + dir }).eq("id", f.id);
    load();
  };

  const toggleActive = async (f: Faq) => {
    await supabase.from("faqs").update({ active: !f.active }).eq("id", f.id);
    load();
  };

  const grouped = faqs.reduce((m, f) => { (m[f.category] ||= []).push(f); return m; }, {} as Record<string, Faq[]>);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="FAQ Management"
        subtitle="Manage answers shown in the support widget and public pages."
        icon={<HelpCircle className="h-6 w-6" />}
        actions={
          <Button onClick={() => setEditing({ id: "", category: "General", question: "", answer: "", priority: 0, active: true } as Faq)}
            className="bg-gradient-gold text-gold-foreground hover:opacity-90"><Plus className="mr-2 h-4 w-4" /> New FAQ</Button>
        }
      />

      {loading ? <div className="p-8 text-center text-muted-foreground">Loading…</div> :
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">{cat}</h3>
            <div className="space-y-2">
              {items.map((f) => (
                <Card key={f.id} className="border-border/60 bg-card/80">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${f.active ? "bg-emerald" : "bg-muted-foreground"}`} />
                        <div className="truncate font-medium">{f.question}</div>
                      </div>
                      <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{f.answer}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => reorder(f, 1)}><ArrowUp className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => reorder(f, -1)}><ArrowDown className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setPreviewing(f)}><Eye className="h-4 w-4" /></Button>
                      <Switch checked={f.active} onCheckedChange={() => toggleActive(f)} />
                      <Button size="icon" variant="ghost" onClick={() => setEditing(f)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4 text-ruby" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      }

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit FAQ" : "New FAQ"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>Category</Label>
                  <Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Input type="number" value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Question</Label>
                <Input value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} />
              </div>
              <div>
                <Label>Answer</Label>
                <Textarea rows={6} value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                <span className="text-sm">{editing.active ? "Published" : "Draft"}</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={save} className="bg-gradient-gold text-gold-foreground">Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewing} onOpenChange={(o) => { if (!o) setPreviewing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Preview</DialogTitle></DialogHeader>
          {previewing && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gold">{previewing.category}</div>
              <h3 className="mt-1 text-lg font-semibold">{previewing.question}</h3>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{previewing.answer}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}