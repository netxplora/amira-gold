import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/alerts")({ component: AlertsPage });

type Alert = {
  id: string; direction: "above" | "below"; target_price_per_gram: number;
  active: boolean; triggered_at: string | null; created_at: string;
};

function AlertsPage() {
  const { user } = useAuth();
  const { pricePerGram } = useGoldPrice();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    supabase.from("gold_price_alerts" as never).select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setAlerts((data ?? []) as unknown as Alert[]); setLoading(false); });
  };
  useEffect(load, [user]);

  const create = async () => {
    const t = Number(target);
    if (!user || !t || t <= 0) { toast.error("Enter a valid target price"); return; }
    const { error } = await supabase.from("gold_price_alerts" as never).insert({
      user_id: user.id, direction, target_price_per_gram: t,
    } as never);
    if (error) { toast.error(error.message); return; }
    toast.success("Alert created"); setTarget(""); load();
  };

  const remove = async (id: string) => {
    await supabase.from("gold_price_alerts" as never).delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Gold Price Alerts"
        subtitle={`Current spot: ${formatUSD(pricePerGram)}/g — get notified when the market hits your target.`}
        icon={<Bell className="h-6 w-6" />}
      />

      <Card className="border-border/60 bg-card/80">
        <CardContent className="grid gap-3 p-5 md:grid-cols-[160px_1fr_auto] md:items-end">
          <div>
            <Label className="text-xs">Direction</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as "above" | "below")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Goes above</SelectItem>
                <SelectItem value="below">Falls below</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Target price (USD/gram)</Label>
            <Input type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={formatUSD(pricePerGram)} />
          </div>
          <Button onClick={create} className="bg-gradient-gold text-gold-foreground hover:opacity-90"><Plus className="mr-2 h-4 w-4" /> Create alert</Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {loading ? <div className="p-6 text-center text-muted-foreground">Loading…</div>
          : alerts.length === 0 ? (
            <Card className="border-border/60"><CardContent className="p-10 text-center text-muted-foreground"><Bell className="mx-auto mb-2 h-8 w-8 opacity-40" />No alerts yet.</CardContent></Card>
          ) : alerts.map((a) => (
            <Card key={a.id} className="border-border/60 bg-card/70">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${a.direction === "above" ? "bg-emerald/15 text-emerald" : "bg-ruby/15 text-ruby"}`}>
                    {a.direction === "above" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-semibold">Notify when price {a.direction} {formatUSD(Number(a.target_price_per_gram))}/g</div>
                    <div className="text-xs text-muted-foreground">Created {new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.triggered_at ? <Badge variant="outline" className="border-emerald/40 text-emerald">Triggered</Badge>
                    : a.active ? <Badge variant="outline" className="border-gold/40 text-gold">Active</Badge>
                    : <Badge variant="outline">Off</Badge>}
                  <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-ruby" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}