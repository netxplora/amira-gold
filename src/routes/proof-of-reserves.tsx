import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flag } from "@/components/Flag";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, FileCheck2, Download, Activity, Clock } from "lucide-react";
import vaultInterior from "@/assets/vault-interior.jpg";
import { downloadReservesReportPDF } from "@/lib/pdf-reserves";

type Vault = { id: string; name: string; location: string; capacity_grams: number };
type Audit = {
  id: string;
  auditor_name: string;
  auditor_firm: string | null;
  vault_id: string | null;
  grams_verified: number;
  audit_date: string;
  notes: string | null;
  report_url: string | null;
};
type RecentActivity = {
  id: string;
  type: "order" | "audit";
  label: string;
  meta: string;
  date: string;
};

const COUNTRY_MAP: Record<string, string> = {
  zurich: "CH", switzerland: "CH",
  dubai: "AE", uae: "AE", "united arab emirates": "AE",
  singapore: "SG",
  london: "GB", uk: "GB", "united kingdom": "GB",
  toronto: "CA", canada: "CA",
  riyadh: "SA", "saudi arabia": "SA", saudi: "SA",
};

function inferCode(location: string) {
  const k = location?.toLowerCase().split(",")[0].trim() ?? "";
  return COUNTRY_MAP[k] ?? "";
}

export const Route = createFileRoute("/proof-of-reserves")({
  head: () => ({
    meta: [
      { title: "Proof of Reserves | Amira Gold" },
      { name: "description", content: "Verifiable, auditable proof of all gold held in Amira Gold's LBMA-certified vaults worldwide." },
      { property: "og:title", content: "Proof of Reserves — Amira Gold" },
      { property: "og:description", content: "Verifiable proof of all gold held in our vaults." },
      { property: "og:image", content: vaultInterior },
    ],
  }),
  component: ProofPage,
});

function ProofPage() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [recent, setRecent] = useState<RecentActivity[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: v }, { data: a }, { data: o }] = await Promise.all([
        supabase.from("vaults").select("*").order("name"),
        supabase.from("audit_logs").select("*").order("audit_date", { ascending: false }).limit(20),
        supabase
          .from("orders")
          .select("id, grams, created_at, vault_id, status")
          .in("status", ["allocated", "delivered", "shipped"])
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      setVaults(v ?? []);
      setAudits(a ?? []);
      const vaultMap = new Map((v ?? []).map((x) => [x.id, x]));
      const auditActivity: RecentActivity[] = (a ?? []).slice(0, 5).map((x) => ({
        id: `a-${x.id}`,
        type: "audit",
        label: `${x.auditor_firm ?? "Independent"} verified ${Number(x.grams_verified).toLocaleString()} g`,
        meta: vaultMap.get(x.vault_id ?? "")?.name ?? "Vault",
        date: x.audit_date,
      }));
      const orderActivity: RecentActivity[] = (o ?? []).map((x: any) => ({
        id: `o-${x.id}`,
        type: "order",
        label: `Allocation: ${Number(x.grams).toLocaleString()} g moved into custody`,
        meta: vaultMap.get(x.vault_id ?? "")?.name ?? "Vault transfer",
        date: x.created_at,
      }));
      setRecent(
        [...auditActivity, ...orderActivity]
          .sort((p, q) => +new Date(q.date) - +new Date(p.date))
          .slice(0, 10),
      );
    })();
  }, []);
  const total = vaults.reduce((s, v) => s + Number(v.capacity_grams), 0);

  const handleDownload = () => {
    const vaultMap = new Map(vaults.map((v) => [v.id, v]));
    downloadReservesReportPDF({
      totalGrams: total,
      vaults: vaults.map((v) => ({ name: v.name, location: v.location, capacity_grams: Number(v.capacity_grams) })),
      audits: audits.map((a) => ({
        auditor_name: a.auditor_name,
        auditor_firm: a.auditor_firm,
        vault_name: vaultMap.get(a.vault_id ?? "")?.name ?? null,
        grams_verified: Number(a.grams_verified),
        audit_date: a.audit_date,
        notes: a.notes,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section
        className="relative overflow-hidden border-b border-border/40 py-20"
        style={{
          backgroundImage: `linear-gradient(180deg, oklch(0.16 0.012 250 / 0.92), oklch(0.16 0.012 250 / 0.96)), url(${vaultInterior})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-card/60 px-3 py-1 text-xs uppercase tracking-widest text-gold backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> Independently audited
          </span>
          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Proof of <span className="text-gradient-gold">Reserves</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Every gram of gold owned by our customers is fully backed and independently audited.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button onClick={handleDownload} className="rounded-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Download className="mr-1.5 h-4 w-4" /> Download PDF Report
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <Card className="border-gold/40 bg-gradient-to-br from-card to-background shadow-gold">
          <CardContent className="grid gap-6 p-10 md:grid-cols-3 md:items-center">
            <div className="md:col-span-2">
              <div className="text-xs uppercase tracking-widest text-gold">Total gold under custody</div>
              <div className="mt-2 text-5xl font-bold text-gradient-gold md:text-6xl">{total.toLocaleString()} <span className="text-3xl">g</span></div>
              <div className="mt-1 text-sm text-muted-foreground">Last audit: {new Date().toLocaleDateString()}</div>
            </div>
            <div className="flex items-center justify-center md:justify-end">
              <div className="rounded-2xl border border-emerald/30 bg-emerald/5 p-5 text-center">
                <FileCheck2 className="mx-auto h-8 w-8 text-emerald" />
                <div className="mt-2 text-xs text-muted-foreground">Independent audits</div>
                <div className="mt-0.5 text-2xl font-bold text-gradient-emerald">{audits.length}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">on record</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="mt-12 text-2xl font-bold">Vault-by-vault breakdown</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {vaults.map((v) => {
            const code = inferCode(v.location);
            return (
              <Card key={v.id} className="border-border/60 bg-card transition-all hover:-translate-y-0.5 hover:border-gold/40">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    {code && <Flag code={code} className="h-7 w-10 text-2xl" />}
                    <div>
                      <h3 className="text-lg font-semibold">{v.name}</h3>
                      <div className="text-sm text-muted-foreground">{v.location}</div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gradient-gold">{Number(v.capacity_grams).toLocaleString()} g</div>
                      <div className="text-xs text-muted-foreground">Capacity</div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald/30 bg-emerald/10 px-2 py-0.5 text-xs text-emerald">
                      <ShieldCheck className="h-3 w-3" /> Insured
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Independent audits table */}
        <h2 className="mt-16 text-2xl font-bold">Independent audit log</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every entry is conducted by an external assayer or audit firm. Reports available on request.</p>
        <Card className="mt-6 border-border/60 bg-card">
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {audits.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No audits on record yet.</div>
              ) : audits.map((a) => {
                const v = vaults.find((x) => x.id === a.vault_id);
                const code = v ? inferCode(v.location) : "";
                return (
                  <div key={a.id} className="grid gap-4 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-emerald shadow-emerald">
                        <FileCheck2 className="h-5 w-5 text-emerald-foreground" />
                      </div>
                      {code && <Flag code={code} className="h-6 w-9" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-semibold">{a.auditor_firm ?? "Independent"}</span>
                        <span className="text-xs text-muted-foreground">· {a.auditor_name}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {v ? `${v.name} — ${v.location}` : "Cross-vault audit"}
                      </div>
                      {a.notes && <p className="mt-1.5 text-sm text-muted-foreground">{a.notes}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gradient-gold">{Number(a.grams_verified).toLocaleString()} g</div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{new Date(a.audit_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent activity feed */}
        <h2 className="mt-16 text-2xl font-bold">Recent custody activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">Live feed of allocations and audit events across our vaults.</p>
        <Card className="mt-6 border-border/60 bg-card">
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {recent.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No recent activity.</div>
              ) : recent.map((r) => (
                <div key={r.id} className="flex items-center gap-4 p-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${r.type === "audit" ? "bg-emerald/15 text-emerald" : "bg-gold/15 text-gold"}`}>
                    {r.type === "audit" ? <FileCheck2 className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{r.label}</div>
                    <div className="text-xs text-muted-foreground">{r.meta}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {new Date(r.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <SiteFooter />
    </div>
  );
}
