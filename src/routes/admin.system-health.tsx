import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useInfrastructure } from "@/lib/infrastructure/InfrastructureProvider";
import { 
  Activity, Shield, AlertCircle, CheckCircle2, 
  RefreshCw, Database, HardDrive, Globe,
  ShieldCheck, AlertTriangle, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/admin/system-health")({ component: SystemHealth });

function SystemHealth() {
  const { health, isVerifying, refreshHealth } = useInfrastructure();
  const [isRepairing, setIsRepairing] = useState(false);

  const handleRepair = async () => {
    setIsRepairing(true);
    await refreshHealth();
    setTimeout(() => setIsRepairing(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          eyebrow="Monitoring"
          title="System Health & Integrity"
          subtitle="Real-time audit of infrastructure, configurations, and core services."
          icon={<Activity className="h-6 w-6 text-gold" />}
        />
        <Button 
          onClick={handleRepair} 
          disabled={isVerifying || isRepairing}
          className="bg-gold text-gold-foreground gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isVerifying || isRepairing ? 'animate-spin' : ''}`} />
          Run Health Audit
        </Button>
      </div>

      {!health ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/5">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground/40" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-border/60 bg-card/80">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative mb-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-muted/20">
                      <span className="text-3xl font-bold text-foreground">{health.score}</span>
                    </div>
                    <svg className="absolute top-0 left-0 h-24 w-24 -rotate-90 transform">
                      <circle
                        cx="48"
                        cy="48"
                        r="44"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray={276}
                        strokeDashoffset={276 - (276 * health.score) / 100}
                        className={health.status === 'healthy' ? 'text-emerald-500' : health.status === 'warning' ? 'text-gold' : 'text-ruby'}
                      />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Integrity Score</h4>
                  <Badge className={`mt-2 ${
                    health.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                    health.status === 'warning' ? 'bg-gold/10 text-gold border-gold/20' : 
                    'bg-ruby/10 text-ruby border-ruby/20'
                  }`}>
                    {health.status.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="md:col-span-3 grid gap-6 md:grid-cols-3">
              <Card className="border-border/60 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-gold/10 p-3">
                      <ShieldCheck className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{health.checks.filter(c => c.status === 'pass').length}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Passed Checks</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-ruby/10 p-3">
                      <AlertTriangle className="h-6 w-6 text-ruby" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{health.checks.filter(c => c.status === 'fail').length}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Critical Failures</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-blue-500/10 p-3">
                      <Zap className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{health.alerts.length}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">System Alerts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card className="border-border/60 bg-card/80">
                <CardContent className="p-0">
                  <div className="p-6 border-b border-border/40">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Security & Integrity Audit</h3>
                  </div>
                  <div className="divide-y divide-border/40">
                    {health.checks.map((check, i) => (
                      <div key={i} className="flex items-start justify-between p-4 transition-colors hover:bg-muted/5">
                        <div className="flex gap-4">
                          <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                            check.status === 'pass' ? 'bg-emerald-500/10 text-emerald-500' : 
                            check.status === 'warning' ? 'bg-gold/10 text-gold' : 
                            'bg-ruby/10 text-ruby'
                          }`}>
                            {check.status === 'pass' ? <CheckCircle2 className="h-5 w-5" /> : 
                             check.status === 'warning' ? <AlertTriangle className="h-5 w-5" /> : 
                             <AlertCircle className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">{check.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{check.message}</div>
                            {check.repair_action && (
                              <Badge variant="outline" className="mt-2 text-[10px] border-gold/20 text-gold bg-gold/5 font-mono">
                                RECOMMENDED: {check.repair_action}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={
                          check.status === 'pass' ? 'border-emerald-500/20 text-emerald-500' : 
                          check.status === 'warning' ? 'border-gold/20 text-gold' : 
                          'border-ruby/20 text-ruby'
                        }>
                          {check.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-border/60 bg-card/80">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">Critical Alerts</h3>
                  <div className="space-y-4">
                    {health.alerts.length === 0 ? (
                      <div className="py-4 text-center text-xs text-muted-foreground italic">No active system alerts.</div>
                    ) : (
                      health.alerts.map((alert, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-lg border border-ruby/20 bg-ruby/5 p-3">
                          <AlertTriangle className="h-4 w-4 text-ruby shrink-0 mt-0.5" />
                          <p className="text-[11px] font-medium leading-relaxed text-ruby/90">{alert}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/80">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">Environment Context</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Runtime Mode</span>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">PRODUCTION</Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Region</span>
                      <span className="font-mono text-gold">US-EAST-1</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Last Audit</span>
                      <span className="text-muted-foreground">{new Date(health.last_checked).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
