import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileJson, FileCode, Download, 
  RefreshCw, CheckCircle2, Copy, 
  ExternalLink, Zap, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { exportConfigSeeds } from "@/lib/infrastructure/export-seeds";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/seed-exports")({ component: SeedExports });

function SeedExports() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);
  const [format, setFormat] = useState<'json' | 'sql'>('json');

  const handleExport = async (targetFormat: 'json' | 'sql') => {
    setIsExporting(true);
    setFormat(targetFormat);
    try {
      const result = await exportConfigSeeds(targetFormat);
      setExportData(result || "");
      toast.success(`Generated ${targetFormat.toUpperCase()} seed payload.`);
    } catch (err) {
      toast.error("Failed to generate seed export.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = () => {
    if (!exportData) return;
    navigator.clipboard.writeText(exportData);
    toast.success("Payload copied to clipboard.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          eyebrow="Development"
          title="Seed Generation Engine"
          subtitle="Generate reproducible data payloads for migrations and environment seeding."
          icon={<FileCode className="h-6 w-6 text-gold" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-border/60 bg-card/80">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">Generator Controls</h3>
            <div className="space-y-4">
              <Button 
                onClick={() => handleExport('json')} 
                disabled={isExporting}
                variant="outline"
                className="w-full justify-start gap-3 border-border/40 bg-background/20"
              >
                <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-500">
                  <FileJson className="h-4 w-4" />
                </div>
                <span>Export as JSON</span>
              </Button>

              <Button 
                onClick={() => handleExport('sql')} 
                disabled={isExporting}
                variant="outline"
                className="w-full justify-start gap-3 border-border/40 bg-background/20"
              >
                <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-500">
                  <FileCode className="h-4 w-4" />
                </div>
                <span>Export as SQL Migrations</span>
              </Button>

              <div className="mt-8 space-y-4 rounded-xl border border-gold/20 bg-gold/5 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
                  <Info className="h-4 w-4" />
                  Integration Guide
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Seed payloads generated here are designed to be used in <code className="text-gold">supabase/seed.sql</code> or within the recovery engine during migration transitions.
                </p>
                <ul className="space-y-2 text-[10px] text-muted-foreground/80 list-disc pl-4">
                  <li>Includes all configurations where <code className="text-gold">is_seedable = true</code></li>
                  <li>Maintains category relationships</li>
                  <li>Uses <code className="text-gold">ON CONFLICT</code> handling for safe imports</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/60 bg-card/80 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 border-b border-border/40 bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-gold text-gold-foreground font-mono px-2 py-0.5">
                  {format.toUpperCase()} PAYLOAD
                </Badge>
                {exportData && (
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                    Size: {(exportData.length / 1024).toFixed(2)} KB
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={!exportData} 
                  onClick={handleCopy}
                  className="h-8 text-xs gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={!exportData} 
                  className="h-8 text-xs gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
            
            <div className="relative">
              {!exportData ? (
                <div className="h-[500px] flex flex-col items-center justify-center text-center p-12 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">Ready for Export</h4>
                    <p className="text-xs text-muted-foreground/60 max-w-[200px] mt-1">Select an export format to generate the configuration seed payload.</p>
                  </div>
                </div>
              ) : (
                <Textarea 
                  readOnly
                  value={exportData}
                  className="h-[500px] rounded-none border-none bg-background/50 font-mono text-[10px] p-6 focus-visible:ring-0"
                />
              )}
              {isExporting && (
                <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-gold" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
