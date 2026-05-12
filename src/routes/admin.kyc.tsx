import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/kyc")({
  component: AdminKyc,
});

type Sub = {
  id: string;
  user_id: string;
  full_name: string;
  document_type: string;
  document_url: string;
  selfie_url: string;
  address: string;
  status: string;
  review_notes: string | null;
  created_at: string;
};

function AdminKyc() {
  const { user } = useAuth();
  const [items, setItems] = useState<Sub[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [active, setActive] = useState<Sub | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const load = () => {
    let q = supabase.from("kyc_submissions").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    q.then(({ data }) => setItems((data ?? []) as Sub[]));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const openReview = async (s: Sub) => {
    setActive(s);
    setNotes(s.review_notes || "");
    const [d, sl] = await Promise.all([
      supabase.storage.from("kyc-documents").createSignedUrl(s.document_url, 600),
      supabase.storage.from("kyc-documents").createSignedUrl(s.selfie_url, 600),
    ]);
    setDocUrl(d.data?.signedUrl ?? null);
    setSelfieUrl(sl.data?.signedUrl ?? null);
  };

  const decide = async (status: "approved" | "rejected") => {
    if (!active || !user) return;
    const { error } = await supabase.rpc("handle_kyc_review", {
      _submission_id: active.id,
      _status: status,
      _notes: notes || undefined
    });
    if (error) return toast.error(error.message);
    toast.success(`Submission ${status}`);
    setActive(null);
    load();
  };

  const statusBadge = (s: string) => {
    if (s === "approved") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (s === "rejected") return "bg-red-500/15 text-red-400 border-red-500/30";
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KYC Review</h1>
        <p className="text-muted-foreground">Approve or reject identity submissions.</p>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
            {f}
          </Button>
        ))}
      </div>

      {items.length === 0 ? (
        <Card className="border-border/60 bg-card"><CardContent className="p-12 text-center text-muted-foreground">No submissions</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map((s) => (
            <Card key={s.id} className="border-border/60 bg-card">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="font-semibold">{s.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.document_type} · Submitted {new Date(s.created_at).toLocaleDateString()} · User {s.user_id.slice(0, 8)}…
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={statusBadge(s.status)}>{s.status}</Badge>
                  <Button size="sm" onClick={() => openReview(s)}>Review</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Review submission</DialogTitle></DialogHeader>
          {active && (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">Full name:</span> <span className="font-medium">{active.full_name}</span></div>
                <div><span className="text-muted-foreground">Document:</span> <span className="font-medium">{active.document_type}</span></div>
                <div className="sm:col-span-2"><span className="text-muted-foreground">Address:</span> <span className="font-medium">{active.address}</span></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">ID Document</div>
                  {docUrl ? <img src={docUrl} alt="ID" className="w-full rounded-lg border border-border/60" /> : <div className="rounded-lg bg-muted p-8 text-center text-xs">Loading…</div>}
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Selfie</div>
                  {selfieUrl ? <img src={selfieUrl} alt="Selfie" className="w-full rounded-lg border border-border/60" /> : <div className="rounded-lg bg-muted p-8 text-center text-xs">Loading…</div>}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Review notes (shown to user if rejected)</div>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => decide("rejected")}>Reject</Button>
                <Button onClick={() => decide("approved")} className="bg-gradient-gold text-gold-foreground">Approve</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
