import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";

type Lead = { id: string; email: string; full_name: string | null; country: string | null; notes: string | null; created_at: string };

export const Route = createFileRoute("/admin/waitlist")({ component: AdminWaitlist });

function AdminWaitlist() {
  const [items, setItems] = useState<Lead[]>([]);
  const load = () =>
    supabase.from("card_waitlist").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setItems((data ?? []) as Lead[]));
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    const { error } = await supabase.from("card_waitlist").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  const exportCsv = () => {
    const rows = [["email", "full_name", "country", "notes", "created_at"]];
    items.forEach((i) => rows.push([i.email, i.full_name ?? "", i.country ?? "", (i.notes ?? "").replace(/[\r\n,]/g, " "), i.created_at]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "card-waitlist.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-gold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Card Launch
          </div>
          <h1 className="mt-1 text-3xl font-bold">Gold Card waitlist <span className="text-muted-foreground text-base font-normal">({items.length})</span></h1>
        </div>
        <Button onClick={exportCsv} variant="outline" className="border-gold/40 hover:bg-gold/10">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card className="border-border/60 bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Email</TableHead><TableHead>Name</TableHead>
              <TableHead>Country</TableHead><TableHead>Notes</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No waitlist signups yet.</TableCell></TableRow>
              )}
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{i.email}</TableCell>
                  <TableCell>{i.full_name ?? "—"}</TableCell>
                  <TableCell>{i.country ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{i.notes ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="destructive" onClick={() => del(i.id)}><Trash2 className="h-3 w-3" /></Button>
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