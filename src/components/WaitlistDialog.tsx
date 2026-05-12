import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, Sparkles } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  full_name: z.string().trim().max(120).optional(),
  country: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

export function WaitlistDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", country: "", notes: "" });

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.from("card_waitlist").insert({
      email: parsed.data.email,
      full_name: parsed.data.full_name || null,
      country: parsed.data.country || null,
      notes: parsed.data.notes || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDone(true);
    toast.success("You're on the waitlist!");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDone(false); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md border-gold/30 bg-card">
        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-gold" />
            <h3 className="mt-4 text-xl font-bold">You're in.</h3>
            <p className="mt-2 text-sm text-muted-foreground">We'll email you when the Amira Gold Card opens for early access.</p>
            <Button onClick={() => setOpen(false)} className="mt-6 bg-gradient-gold text-gold-foreground hover:opacity-90">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-gold" /> Join the Card waitlist</DialogTitle>
              <DialogDescription>Be first in line when the Amira Gold Card launches.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Full name</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Tell us how you'd use the card." />
              </div>
              <Button onClick={submit} disabled={busy} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
                {busy ? "Joining..." : "Join the waitlist"}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">No spam. We'll only email about card launch.</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}