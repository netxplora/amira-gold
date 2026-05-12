import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useInfrastructure } from "@/lib/infrastructure/InfrastructureProvider";
import { 
  Settings, Shield, Database, Pencil, Save, X, 
  Search, Filter, AlertTriangle, CheckCircle2, 
  History, Archive, Copy, ExternalLink, ShieldCheck 
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SystemConfig } from "@/lib/infrastructure/types";

export const Route = createFileRoute("/admin/configs")({ component: AdminConfigs });

function AdminConfigs() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { health } = useInfrastructure();

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_configs" as any)
        .select("*")
        .order("category", { ascending: true })
        .order("key");

      if (error) throw error;
      setConfigs(data as unknown as SystemConfig[]);
    } catch (err: any) {
      toast.error("Failed to load configurations");
    } finally {
      setLoading(false);
    }
  }

  const filteredConfigs = configs.filter(c => {
    const matchesSearch = c.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(configs.map(c => c.category)));

  function handleEdit(config: SystemConfig) {
    setSelectedConfig(config);
    setEditValue(JSON.stringify(config.value, null, 2));
  }

  async function handleUpdateConfig() {
    if (!selectedConfig) return;
    
    let parsedValue;
    try {
      parsedValue = JSON.parse(editValue);
    } catch (err) {
      return toast.error("Invalid JSON value");
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("system_configs" as any)
        .update({ 
          value: parsedValue,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("id", selectedConfig.id);

      if (error) throw error;

      toast.success(`Configuration '${selectedConfig.key}' updated`);
      setSelectedConfig(null);
      await fetchConfigs();
    } catch (err: any) {
      toast.error(err.message || "Failed to update configuration");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          eyebrow="Infrastructure"
          title="Configuration Registry"
          subtitle="Enterprise-grade platform parameter management and synchronization."
          icon={<Settings className="h-6 w-6 text-gold" />}
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/config-versions" className="gap-2">
              <History className="h-4 w-4" />
              Version History
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/config-backups" className="gap-2">
              <Database className="h-4 w-4" />
              Backups
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by key or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 rounded-md border border-input bg-background/50 pl-9 pr-4 text-sm focus:ring-1 focus:ring-gold outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Key</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4 bg-muted/10">&nbsp;</td>
                    </tr>
                  ))
                ) : filteredConfigs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                      No configurations found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredConfigs.map((c) => (
                    <tr key={c.id} className="group bg-background/20 transition-colors hover:bg-background/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {c.is_critical ? (
                            <ShieldCheck className="h-3 w-3 text-gold" />
                          ) : (
                            <div className="h-4 w-4" />
                          )}
                          <div className={`h-2 w-2 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-medium text-foreground">{c.key}</span>
                          <span className="text-[10px] text-muted-foreground">{c.description || 'No description'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-gold/5 text-gold border-gold/20 text-[10px] uppercase">
                          {c.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[200px] truncate">
                          <code className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono">
                            {JSON.stringify(c.value)}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gold" onClick={() => handleEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedConfig} onOpenChange={(open) => !open && setSelectedConfig(null)}>
        <DialogContent className="max-w-2xl border-border/60 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gold" />
              Edit System Configuration
            </DialogTitle>
            <DialogDescription>
              Updating <span className="font-mono text-gold">{selectedConfig?.key}</span>. 
              Changes are versioned and logged for audit purposes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Value (JSON Editor)</Label>
              <Textarea 
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="font-mono text-xs min-h-[300px] bg-background/50 focus:ring-gold"
              />
            </div>

            {selectedConfig?.is_critical && (
              <div className="flex items-start gap-3 rounded-lg border border-ruby/20 bg-ruby/5 p-4 text-xs text-ruby/80">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold uppercase tracking-wider mb-1">Critical Security Notice</p>
                  <p>This is a critical infrastructure parameter. Changes may impact payment processing, shipping logic, or system security immediately upon saving.</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedConfig(null)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateConfig}
              disabled={isUpdating}
              className="bg-gold text-gold-foreground hover:opacity-90 gap-2 px-6"
            >
              {isUpdating ? <History className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Apply Version {selectedConfig ? selectedConfig.version + 1 : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
