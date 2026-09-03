import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, ShieldCheck, ShoppingBag, FileText, CheckCircle2 } from "lucide-react";
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
  if (l.includes("toronto") || l.includes("canada")) return "CA";
  if (l.includes("riyadh") || l.includes("saudi")) return "SA";
  return null;
}

function CertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Cert[]>([]);
  const [ownerName, setOwnerName] = useState("Amira Gold Client");

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
        vaultName: c.vault?.name ?? "Allocated Vault",
        vaultLocation: c.vault?.location ?? "—",
        issuedAt: c.created_at,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate certificate PDF");
    }
  };

  const totalGrams = certs.reduce((s, c) => s + Number(c.grams), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Custody Records"
        title="Certificates of Ownership"
        subtitle={`${certs.length} certificate${certs.length === 1 ? "" : "s"} issued • Total: ${totalGrams.toFixed(4)} g allocated bullion`}
        icon={<Award className="h-6 w-6" />}
      />

      {certs.length === 0 ? (
        <Card className="border-border/70 bg-card shadow-card">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-semibold text-foreground">No Certificates Issued Yet</h3>
            <p className="max-w-sm text-xs text-muted-foreground leading-relaxed">
              Official digital certificates of legal ownership are issued automatically for every allocated bullion purchase.
            </p>
            <Button asChild className="mt-2 shadow-xs font-semibold">
              <Link to="/app/buy"><ShoppingBag className="mr-2 h-4 w-4" /> Purchase Bullion</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {certs.map((c) => {
            const code = c.vault ? locationCode(c.vault.location) : null;
            return (
              <Card key={c.id} className="border-border/70 bg-card shadow-card p-5 sm:p-6 flex flex-col justify-between transition-all hover:border-primary/40">
                <div>
                  <div className="flex items-start justify-between border-b border-border/50 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Official Title</div>
                        <div className="font-mono text-xs font-semibold text-foreground">{c.certificate_no}</div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Issued</div>
                      <div className="mt-0.5 font-medium text-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="my-5">
                    <div className="font-display text-3xl font-bold tracking-tight text-foreground">{Number(c.grams).toFixed(4)} <span className="text-lg font-normal text-muted-foreground">g</span></div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>999.9 Fine Bullion</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> LBMA Good Delivery
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      {code && <Flag code={code} className="h-5 w-7 rounded-xs shadow-2xs" />}
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-semibold text-foreground">{c.vault?.name ?? "Depository Vault"}</div>
                        <div className="truncate text-muted-foreground text-[11px]">{c.vault?.location ?? "Insured Custody"}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-3 w-3" /> Allocated
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border/50">
                  <Button onClick={() => downloadPdf(c)} variant="outline" size="sm" className="w-full border-border/70 font-medium">
                    <Download className="mr-2 h-3.5 w-3.5" /> Download Certificate PDF
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
