import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Database, Download, Upload, Trash2, 
  RefreshCw, History, CheckCircle2, AlertCircle,
  FileJson, HardDrive, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ConfigBackup } from "@/lib/infrastructure/types";
import { createFullSystemBackup } from "@/lib/infrastructure/export-seeds";

export const Route = createFileRoute("/admin/config-backups")({ component: ConfigBackups });

function ConfigBackups() {
  const [backups, setBackups] = useState<ConfigBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [backupName, setBackupName] = useState("");

  useEffect(() => {
    fetchBackups();
  }, []);

  async function fetchBackups() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("config_backups" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBackups(data as unknown as ConfigBackup[]);
    } catch (err) {
      toast.error("Failed to load backups");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBackup() {
    if (!backupName.trim()) return toast.error("Please enter a backup name");
    
    setIsCreating(true);
    try {
      await createFullSystemBackup(backupName);
      toast.success("System backup created successfully");
      setBackupName("");
      await fetchBackups();
    } catch (err) {
      toast.error("Failed to create backup");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDownload(backup: ConfigBackup) {
    const blob = new Blob([JSON.stringify(backup.backup_payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amira-gold-config-${backup.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          eyebrow="Governance"
          title="Configuration Backups"
          subtitle="Point-in-time snapshots for disaster recovery and environment synchronization."
          icon={<Database className="h-6 w-6 text-gold" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-border/60 bg-card/80">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">Create Snapshot</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Snapshot Name</label>
                <Input 
                  placeholder="e.g. Pre-Deployment Sync" 
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  className="bg-background/50 border-border/40"
                />
              </div>
              <Button 
                onClick={handleCreateBackup} 
                disabled={isCreating}
                className="w-full bg-gold text-gold-foreground gap-2"
              >
                {isCreating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
                Capture Full Registry
              </Button>
              <div className="rounded-lg border border-border/40 bg-background/40 p-3">
                <p className="text-[10px] text-muted-foreground leading-relaxed italic text-center">
                  Full snapshots include all critical and system configurations, including payment gateways and security rules.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/60 bg-card/80">
          <CardContent className="p-0">
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Backup History</h3>
              <Badge variant="outline" className="font-mono text-[10px] opacity-70">
                {backups.length} RESTORE POINTS AVAILABLE
              </Badge>
            </div>
            <div className="divide-y divide-border/40">
              {loading ? (
                <div className="py-20 flex justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground/40" />
                </div>
              ) : backups.length === 0 ? (
                <div className="py-20 text-center text-xs text-muted-foreground italic">
                  No backups found.
                </div>
              ) : (
                backups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 transition-colors hover:bg-muted/5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-gold/5 flex items-center justify-center border border-gold/10">
                        <Package className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{backup.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 uppercase tracking-tighter">
                            {backup.backup_type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(backup.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 text-[10px] gap-1.5" onClick={() => handleDownload(backup)}>
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-[10px] border-gold/20 text-gold hover:bg-gold/5">
                        Restore
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
