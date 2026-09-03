import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flag } from "@/components/Flag";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, FileCheck2, Download, Activity, Clock, Shield, Scale, Eye } from "lucide-react";
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
      { title: "Proof of Reserves — Amira Gold" },
      { name: "description", content: "Verifiable, auditable records of all physical gold held across Amira Gold's insured depository vaults worldwide." },
      { property: "og:title", content: "Proof of Reserves — Amira Gold" },
      { property: "og:description", content: "Verifiable proof of physical gold holdings and third-party audit reports." },
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
        label: `${x.auditor_firm ?? "Independent Assayer"} verified ${Number(x.grams_verified).toLocaleString()} g`,
        meta: vaultMap.get(x.vault_id ?? "")?.name ?? "Vault",
        date: x.audit_date,
      }));
      const orderActivity: RecentActivity[] = (o ?? []).map((x: any) => ({
        id: `o-${x.id}`,
        type: "order",
        label: `Allocation: ${Number(x.grams).toLocaleString()} g transferred into custody`,
        meta: vaultMap.get(x.vault_id ?? "")?.name ?? "Vault custody",
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

      {/* Hero Section */}
      <section className="border-b border-border/40 bg-gradient-to-b from-card/40 via-background to-background py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Independently Audited
          </span>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Proof of <span className="text-primary">Physical Reserves</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground leading-relaxed sm:text-sm">
            Every gram of gold allocated to customer accounts is backed 1:1 by physical bullion held in high-security depositories and verified by regular external audits.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={handleDownload} className="font-semibold shadow-xs">
              <Download className="mr-1.5 h-4 w-4" /> Download Official PDF Report
            </Button>
          </div>
        </div>
      </section>

      {/* Principles Section */}
      <section className="border-b border-border/60 bg-muted/20 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "1:1 Physical Allocation",
                desc: "Every fraction of gold recorded in user balances matches physical bars in insured vaults. We do not practice fractional lending or rehypothecation.",
              },
              {
                icon: FileCheck2,
                title: "External Third-Party Audits",
                desc: "Independent assayers and certified audit firms perform physical weight, purity, and bar count verifications on scheduled intervals.",
              },
              {
                icon: Eye,
                title: "Auditable Public Ledger",
                desc: "Our published vault capacity and audit registers ensure that total customer liabilities never exceed actual verified physical assets in storage.",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="border-border/70 bg-card shadow-card p-5 sm:p-6 transition-all hover:border-primary/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display mt-3 text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Aggregate Stats Card */}
        <Card className="border-border/70 bg-card shadow-card p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-3 md:items-center">
            <div className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Total Custody Assets</span>
              <div className="font-display mt-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {total.toLocaleString()} <span className="text-xl font-normal text-muted-foreground sm:text-2xl">grams</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Equivalent to {(total / 1000).toFixed(2)} kg across {vaults.length} international depository locations.
              </p>
            </div>
            <div className="flex md:justify-end">
              <div className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center md:w-auto md:min-w-[180px]">
                <FileCheck2 className="mx-auto h-6 w-6 text-emerald-500" />
                <div className="mt-1 font-display text-2xl font-bold text-foreground">{audits.length}</div>
                <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Audits Completed</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Vault Breakdown */}
        <div className="mt-12 sm:mt-16">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Storage Network</span>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground">Depository Vault Breakdown</h2>
            <p className="mt-1 text-xs text-muted-foreground">Physical gold distributed across top-tier international jurisdictions.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vaults.map((v) => {
              const code = inferCode(v.location);
              return (
                <Card key={v.id} className="border-border/70 bg-card shadow-card p-5 transition-all hover:border-primary/40">
                  <div className="flex items-center gap-3">
                    {code && <Flag code={code} className="h-6 w-8 rounded-xs shadow-2xs" />}
                    <div>
                      <h3 className="font-display text-sm font-semibold text-foreground">{v.name}</h3>
                      <div className="text-xs text-muted-foreground">{v.location}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between border-t border-border/50 pt-3">
                    <div>
                      <div className="font-display text-lg font-bold text-foreground">{Number(v.capacity_grams).toLocaleString()} g</div>
                      <div className="text-[11px] text-muted-foreground">Allocated Capacity</div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3 w-3" /> Fully Insured
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="mt-12 sm:mt-16">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Verification History</span>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground">Independent Audit Register</h2>
            <p className="mt-1 text-xs text-muted-foreground">Physical verification logs conducted by accredited inspection bodies.</p>
          </div>
          <Card className="border-border/70 bg-card shadow-card overflow-hidden">
            <div className="divide-y divide-border/60">
              {audits.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">No audit records available.</div>
              ) : (
                audits.map((a) => {
                  const v = vaults.find((x) => x.id === a.vault_id);
                  const code = v ? inferCode(v.location) : "";
                  return (
                    <div key={a.id} className="grid gap-3 p-4 sm:p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                          <FileCheck2 className="h-4 w-4" />
                        </div>
                        {code && <Flag code={code} className="h-5 w-7" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-semibold text-foreground">{a.auditor_firm ?? "Independent Assayer"}</span>
                          <span className="text-xs text-muted-foreground">· Lead: {a.auditor_name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {v ? `${v.name} — ${v.location}` : "Multi-vault verification"}
                        </div>
                        {a.notes && <p className="mt-1 text-xs text-muted-foreground/90">{a.notes}</p>}
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="font-display text-base font-bold text-foreground">{Number(a.grams_verified).toLocaleString()} g</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(a.audit_date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Activity Stream */}
        <div className="mt-12 sm:mt-16">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Live Ledger</span>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground">Recent Custody Operations</h2>
            <p className="mt-1 text-xs text-muted-foreground">Chronological feed of asset allocations and verifications.</p>
          </div>
          <Card className="border-border/70 bg-card shadow-card overflow-hidden">
            <div className="divide-y divide-border/60">
              {recent.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">No recent activity recorded.</div>
              ) : (
                recent.map((r) => (
                  <div key={r.id} className="flex items-center gap-3.5 p-4 sm:p-5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${r.type === "audit" ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border border-primary/20 bg-primary/10 text-primary"}`}>
                      {r.type === "audit" ? <FileCheck2 className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-medium text-foreground sm:text-sm">{r.label}</div>
                      <div className="text-[11px] text-muted-foreground">{r.meta}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" /> {new Date(r.date).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
