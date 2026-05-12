import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Copy, AlertTriangle, ShoppingBag } from "lucide-react";
import { QRCode } from "@/components/QRCode";
import { toast } from "sonner";

type Provider = { id: string; name: string; logo_url: string | null; url: string; priority: number };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  walletAddress: string;
  asset: string;
  network: string;
};

export function BuyCryptoDialog({ open, onOpenChange, walletAddress, asset, network }: Props) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [chosen, setChosen] = useState<Provider | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("crypto_providers")
      .select("*")
      .eq("active", true)
      .is("deleted_at", null)
      .order("priority")
      .then(({ data }) => setProviders((data ?? []) as Provider[]));
  }, [open]);

  useEffect(() => {
    if (!open) setChosen(null);
  }, [open]);

  const copy = (v: string) => {
    navigator.clipboard.writeText(v);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {!chosen ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-gold" /> Buy crypto
              </DialogTitle>
              <DialogDescription>
                Pick a third-party provider to purchase {asset}. After purchase, return here and submit your transaction hash.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {providers.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground">
                  No providers configured yet. Please contact support.
                </p>
              )}
              {providers.map((p) => (
                <Card
                  key={p.id}
                  className="flex cursor-pointer items-center gap-3 border-border/60 bg-card/80 p-4 transition hover:border-gold/40 hover:bg-card"
                  onClick={() => setChosen(p)}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/40">
                    {p.logo_url ? (
                      <img src={p.logo_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">Buy {asset} →</div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Before you continue to {chosen.name}</DialogTitle>
              <DialogDescription>
                Copy your destination wallet address and keep it handy. You'll paste it into {chosen.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Send only <strong>{asset}</strong> on the <strong>{network}</strong> network to this address.
                  Wrong-network sends are not recoverable.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-5">
              <QRCode value={walletAddress} size={160} />
              <div className="w-full">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Wallet address</div>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 break-all rounded-lg bg-background/60 p-2.5 font-mono text-xs">{walletAddress}</code>
                  <Button size="icon" variant="ghost" onClick={() => copy(walletAddress)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setChosen(null)}>Back</Button>
              <Button
                className="bg-gradient-gold text-gold-foreground hover:opacity-90"
                onClick={() => {
                  window.open(chosen.url, "_blank", "noopener,noreferrer");
                  onOpenChange(false);
                }}
              >
                Continue to {chosen.name} <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
