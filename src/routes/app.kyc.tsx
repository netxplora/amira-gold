import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Clock, XCircle, Upload, Lock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/app/kyc")({
  component: KycPage,
});

type Submission = {
  id: string;
  status: string;
  full_name: string;
  document_type: string;
  review_notes: string | null;
  created_at: string;
};

function KycPage() {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [docType, setDocType] = useState("passport");
  const [address, setAddress] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("kyc_submissions")
      .select("id,status,full_name,document_type,review_notes,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setSubmission(data as Submission | null);
        setLoading(false);
      });
  }, [user]);

  const upload = async (file: File, kind: "doc" | "selfie") => {
    if (!user) throw new Error("Not signed in");
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  };

  const submit = async () => {
    if (!user) return;
    if (!fullName.trim() || fullName.length > 200) return toast.error("Enter your full legal name");
    if (!address.trim() || address.length > 500) return toast.error("Enter your address");
    if (!docFile) return toast.error("Upload your ID document");
    if (!selfieFile) return toast.error("Upload a selfie");
    if (docFile.size > 5_000_000 || selfieFile.size > 5_000_000) return toast.error("Files must be under 5MB");

    setSubmitting(true);
    try {
      const docUrl = await upload(docFile, "doc");
      const selfieUrl = await upload(selfieFile, "selfie");
      const { data, error } = await supabase.rpc("submit_kyc", {
        _full_name: fullName.trim(),
        _document_type: docType,
        _document_url: docUrl,
        _selfie_url: selfieUrl,
        _address: address.trim(),
      });
      if (error) throw error;
      toast.success("KYC submitted! We'll review within 24-48 hours.");
      // Reload page state
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  if (submission && submission.status !== "rejected") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader eyebrow="Verification" title="Identity verification" subtitle="Status of your KYC submission." icon={<ShieldCheck className="h-6 w-6" />} />
        <Card className="border-border/60 bg-card/80">
          <CardContent className="space-y-4 p-6">
            <StatusBanner status={submission.status} />
            <div className="grid gap-2 text-sm">
              <Row label="Full name" value={submission.full_name} />
              <Row label="Document" value={submission.document_type.replace(/_/g, " ")} />
              <Row label="Submitted" value={new Date(submission.created_at).toLocaleString()} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Compliance"
        title="Identity verification"
        subtitle="Required to comply with global AML regulations. Usually approved within 24-48 hours."
        icon={<ShieldCheck className="h-6 w-6" />}
      />

      {submission?.status === "rejected" && (
        <Card className="border-ruby/40 bg-ruby/5">
          <CardContent className="p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-ruby"><XCircle className="h-4 w-4" /> Previous submission rejected</div>
            {submission.review_notes && <p className="mt-2 text-muted-foreground">{submission.review_notes}</p>}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 bg-card/80">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/5 p-3 text-xs text-muted-foreground">
            <Lock className="h-4 w-4 text-gold" />
            All documents are encrypted in transit and at rest. Only compliance reviewers can access them.
          </div>
          <div>
            <Label>Full legal name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={200} placeholder="As shown on your ID" />
          </div>
          <div>
            <Label>Document type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="national_id">National ID</SelectItem>
                <SelectItem value="drivers_license">Driver's license</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Residential address</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} rows={3} placeholder="Street, city, country" />
          </div>
          <FileField label="ID document (front)" file={docFile} onChange={setDocFile} />
          <FileField label="Selfie holding your ID" file={selfieFile} onChange={setSelfieFile} />
          <Button onClick={submit} disabled={submitting} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
            {submitting ? "Submitting…" : "Submit for review"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBanner({ status }: { status: string }) {
  if (status === "approved")
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
        <ShieldCheck className="h-6 w-6 text-emerald-400" />
        <div>
          <div className="font-semibold text-emerald-400">Verified</div>
          <div className="text-xs text-muted-foreground">Your account is fully verified.</div>
        </div>
      </div>
    );
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
      <Clock className="h-6 w-6 text-amber-400" />
      <div>
        <div className="font-semibold text-amber-400">Pending review</div>
        <div className="text-xs text-muted-foreground">Usually within 24-48 hours.</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-2 capitalize">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function FileField({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border/60 bg-background/40 p-4 transition-colors hover:border-gold/50 hover:bg-gold/5">
        <Upload className="h-4 w-4 text-gold" />
        <span className="flex-1 text-sm text-muted-foreground">{file ? file.name : "Choose image (max 5MB)"}</span>
        {file && <Badge variant="outline" className="text-[10px] text-emerald-400">Selected</Badge>}
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
