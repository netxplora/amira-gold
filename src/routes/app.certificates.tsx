import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, ShieldCheck, ShoppingBag } from "lucide-react";
import { downloadCertificatePDF } from "@/lib/pdf-certificate";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Flag } from "@/components/Flag";

type Cert = {
  id: string; certificate_no: string; grams: number; created_at: string;
  vault?: { name: string; location: string } | null;
};

export const Route = createFileRoute("/app/certificates")({
  component: CertificatesPage,
});

function locationCode(loc?: string | null): string | null {
  if (!loc) return null;
  const l = loc.toLowerCase();
  if (l.includes("zurich") || l.includes("switzer")) return "CH";
  if (l.includes("dubai") || l.includes("emirates")) return "AE";
  if (l.includes("singap")) return "SG";
  if (l.includes("london") || l.includes("united kingdom")) return "GB";
  return null;
}

function CertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Cert[]>([]);
  const [ownerName, setOwnerName] = useState("Amira Gold Customer");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("certificates")
      .select("id,certificate_no,grams,created_at,vault:vaults(name,location)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setCerts((data ?? []) as unknown as Cert[]));
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.full_name) setOwnerName(data.full_name); });
  }, [user]);

  const downloadPdf = async (c: Cert) => {
    try {
      await downloadCertificatePDF({
        certificateNo: c.certificate_no,
        ownerName,
        grams: Number(c.grams),
        vaultName: c.vault?.name ?? "Allocated",
        vaultLocation: c.vault?.location ?? "—",
        issuedAt: c.created_at,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF");
    }
  };

  const totalGrams = certs.reduce((s, c) => s + Number(c.grams), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Proof of Ownership"
        title="Certificates"
        subtitle={`${certs.length} certificate${certs.length === 1 ? "" : "s"} • ${totalGrams.toFixed(4)} g of allocated gold`}
        icon={<Award className="h-6 w-6" />}
      />

      {certs.length === 0 ? (
        <Card className="border-border/60 bg-card/80">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Award className="h-7 w-7" />
            </div>
            <p className="text-sm text-muted-foreground">You'll receive a certificate after your first vault-stored purchase.</p>
            <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90">
              <Link to="/app/buy"><ShoppingBag className="mr-2 h-4 w-4" /> Buy your first bar</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {certs.map((c) => {
            const code = c.vault ? locationCode(c.vault.location) : null;
            return (
              <Card key={c.id} className="relative overflow-hidden border-gold/30 bg-gradient-to-br from-gold/10 via-card to-card shadow-gold">
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-gold opacity-10 blur-3xl" />
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-gold" />
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground shadow-gold">
                      <Award className="h-6 w-6" />
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div className="uppercase tracking-widest text-gold/80">Issued</div>
                      <div className="mt-0.5">{new Date(c.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="mt-5 text-[10px] uppercase tracking-[0.25em] text-gold">Certificate of Ownership</div>
                  <div className="mt-1 font-mono text-sm text-foreground/90">{c.certificate_no}</div>
                  <div className="mt-5 text-4xl font-bold text-gradient-gold">{Number(c.grams).toFixed(4)} g</div>
                  <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Fine gold • 999.9</div>

                  <div className="mt-5 flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-3 text-xs">
                    {code && <Flag code={code} />}
                    <div className="flex-1">
                      <div className="font-medium">{c.vault?.name ?? "Allocated"}</div>
                      <div className="text-muted-foreground">{c.vault?.location ?? "—"}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" /> Allocated
                    </span>
                  </div>

                  <Button onClick={() => downloadPdf(c)} variant="outline" size="sm" className="mt-5 w-full border-gold/40 hover:bg-gold/10">
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
