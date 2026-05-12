import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { 
  History, RotateCcw, User, Clock, 
  ArrowRight, FileJson, Search, Filter,
  RefreshCw, CheckCircle2, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ConfigVersion } from "@/lib/infrastructure/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/config-versions")({ component: ConfigVersions });

function ConfigVersions() {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, []);

  async function fetchVersions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("config_versions" as any)
        .select("*, system_configs(key, category), profiles:updated_by(full_name, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (err) {
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  }

  const filteredVersions = versions.filter(v => 
    v.system_configs?.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.change_summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleRollback(version: any) {
    setSelectedVersion(version);
  }

  async function confirmRollback() {
    if (!selectedVersion) return;
    
    setIsRollingBack(true);
    try {
      const { error } = await supabase
        .from("system_configs" as any)
        .update({ 
          value: selectedVersion.old_value,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        } as any)
        .eq("id", selectedVersion.config_id);

      if (error) throw error;

      toast.success("Configuration rolled back successfully");
      setSelectedVersion(null);
      await fetchVersions();
    } catch (err) {
      toast.error("Failed to perform rollback");
    } finally {
      setIsRollingBack(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          eyebrow="Audit"
          title="Configuration Versioning"
          subtitle="Full audit trail of parameter changes with one-click rollback capabilities."
          icon={<History className="h-6 w-6 text-gold" />}
        />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search change logs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50 border-border/40"
          />
        </div>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Config Key</th>
                  <th className="px-6 py-4">Summary</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4 bg-muted/10">&nbsp;</td>
                    </tr>
                  ))
                ) : filteredVersions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                      No version history found.
                    </td>
                  </tr>
                ) : (
                  filteredVersions.map((v) => (
                    <tr key={v.id} className="bg-background/20 transition-colors hover:bg-background/40">
                      <td className="px-6 py-4 text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {new Date(v.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-medium text-gold">{v.system_configs?.key}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{v.system_configs?.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 max-w-md">
                          <span className="text-xs">{v.change_summary}</span>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 p-1.5 rounded border border-border/20">
                            <span className="truncate max-w-[80px]">{JSON.stringify(v.old_value)}</span>
                            <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate max-w-[80px] text-emerald-500 font-medium">{JSON.stringify(v.new_value)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center text-[10px] font-bold text-gold border border-gold/20">
                            {v.profiles?.full_name?.charAt(0) || <User className="h-3 w-3" />}
                          </div>
                          <span className="text-xs text-muted-foreground">{v.profiles?.full_name || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRollback(v)}
                          className="h-8 text-[10px] text-gold hover:bg-gold/5 gap-1.5"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Rollback
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedVersion} onOpenChange={(open) => !open && setSelectedVersion(null)}>
        <DialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-gold" />
              Confirm Rollback
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to restore <span className="font-mono text-gold">{selectedVersion?.system_configs?.key}</span> to its previous state?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="rounded-lg border border-border/40 bg-background/50 p-4 space-y-3">
              <div>
                <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Rolling back to value:</div>
                <pre className="text-[10px] font-mono bg-muted/50 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(selectedVersion?.old_value, null, 2)}
                </pre>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground" />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Current Value will be replaced:</div>
                <pre className="text-[10px] font-mono bg-ruby/5 text-ruby/70 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(selectedVersion?.new_value, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-gold/20 bg-gold/5 p-3 text-[10px] text-gold/80">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Performing a rollback will create a new version entry and log the action. This operation is reversible by rolling back to the current version later.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVersion(null)} disabled={isRollingBack}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRollback}
              disabled={isRollingBack}
              className="bg-gold text-gold-foreground hover:opacity-90 gap-2"
            >
              {isRollingBack ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirm Rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
