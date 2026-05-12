import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bitcoin, Copy, ShieldCheck, AlertTriangle, 
  ShoppingBag, CheckCircle2, Upload, FileImage, 
  ExternalLink, ArrowLeft, Loader2
} from "lucide-react";
import { QRCode } from "@/components/QRCode";
import { toast } from "sonner";
import { BuyCryptoDialog } from "./BuyCryptoDialog";
import { formatUSD } from "@/lib/gold-price";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";

type Addr = { id: string; asset: string; network: string; address: string; memo: string | null };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  totalAmount: number;
  onSuccess?: () => void;
};

export function JewelryPaymentDialog({ open, onOpenChange, orderId, totalAmount, onSuccess }: Props) {
  const { user } = useAuth();
  const [addrs, setAddrs] = useState<Addr[]>([]);
  const [selAssetId, setSelAssetId] = useState<string>("");
  const [buyOpen, setBuyOpen] = useState(false);
  const [step, setStep] = useState<"options" | "pay">("options");
  
  const [uploading, setUploading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase.from("crypto_addresses")
      .select("*")
      .eq("active", true)
      .order("asset")
      .then(({ data }) => {
        const list = (data ?? []) as Addr[];
        setAddrs(list);
        if (list.length > 0) setSelAssetId(list[0].id);
      });
  }, [open]);

  const selected = addrs.find(a => a.id === selAssetId);

  const copy = (v: string) => {
    navigator.clipboard.writeText(v);
    toast.success("Copied to clipboard");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmitProof = async () => {
    if (!txHash.trim()) return toast.error("Please provide a transaction hash or reference");
    if (!file) return toast.error("Please upload a screenshot of your transaction receipt");

    setUploading(true);
    try {
      // 1. Upload image
      if (!user) throw new Error("Authentication required");
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("proof-of-payment")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("proof-of-payment")
        .getPublicUrl(filePath);

      // 2. Update order
      const { error: updateError } = await supabase.rpc("submit_jewelry_payment_proof", {
        _order_id: orderId,
        _proof_url: publicUrl,
        _tx_hash: txHash.trim()
      });

      if (updateError) throw updateError;

      toast.success("Payment proof submitted successfully!");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit proof");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          {step === "options" ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-gold" /> Pay with Crypto
                </DialogTitle>
                <DialogDescription>
                  Choose how you want to pay for your order of {formatUSD(totalAmount)}.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <Card 
                  className="flex cursor-pointer flex-col items-center justify-center gap-4 border-border/60 bg-card/80 p-8 text-center transition hover:border-gold/40 hover:bg-card"
                  onClick={() => setStep("pay")}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
                    <Bitcoin className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">External Wallet</div>
                    <p className="text-sm text-muted-foreground">Send directly from your MetaMask, Trust Wallet, or Exchange.</p>
                  </div>
                </Card>

                <Card 
                  className="flex cursor-pointer flex-col items-center justify-center gap-4 border-border/60 bg-card/80 p-8 text-center transition hover:border-gold/40 hover:bg-card"
                  onClick={() => {
                    if (!selected) return toast.error("Please wait for addresses to load");
                    setBuyOpen(true);
                  }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Buy Crypto</div>
                    <p className="text-sm text-muted-foreground">Purchase crypto using a credit card or bank transfer via a provider.</p>
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <Bitcoin className="h-5 w-5 text-gold" /> Transfer Instructions
                  </DialogTitle>
                  <Button variant="ghost" size="sm" onClick={() => setStep("options")}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                </div>
                <DialogDescription>
                  Send exactly {formatUSD(totalAmount)} worth of crypto to the address below.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Select Asset & Network</Label>
                    <Select value={selAssetId} onValueChange={setSelAssetId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crypto" />
                      </SelectTrigger>
                      <SelectContent>
                        {addrs.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.asset} ({a.network})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2" 
                      onClick={() => setBuyOpen(true)}
                    >
                      <ShoppingBag className="h-4 w-4" /> Buy this asset
                    </Button>
                  </div>
                </div>

                {selected && (
                  <div className="grid gap-4 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-5 md:grid-cols-[auto,1fr]">
                    <div className="flex justify-center md:justify-start">
                      <QRCode value={selected.address} size={140} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] uppercase tracking-widest text-gold font-bold">Deposit Address</div>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <ShieldCheck className="h-3 w-3" /> VERIFIED
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 break-all rounded-lg bg-background/60 p-2.5 font-mono text-[11px] leading-relaxed">
                          {selected.address}
                        </code>
                        <Button size="icon" variant="ghost" onClick={() => copy(selected.address)} className="h-9 w-9 hover:bg-gold/10 hover:text-gold">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      {selected.memo && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Memo/Tag:</span>{" "}
                          <code className="font-mono text-gold font-bold">{selected.memo}</code>
                          <Button size="icon" variant="ghost" onClick={() => copy(selected.memo!)} className="h-6 w-6 ml-1">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] text-amber-200">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <p>
                          Send only <strong>{selected.asset}</strong> via the <strong>{selected.network}</strong> network.
                          Wrong network sends are non-recoverable.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-5">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Upload className="h-4 w-4 text-gold" /> Step 2: Upload Proof
                  </h3>
                  <div className="grid gap-3">
                    <div className="space-y-1.5">
                      <Label>Transaction Hash / ID</Label>
                      <Input 
                        value={txHash} 
                        onChange={(e) => setTxHash(e.target.value)} 
                        placeholder="Paste your transaction hash here"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Receipt Screenshot</Label>
                      <div className="relative">
                        <input 
                          type="file" 
                          id="proof-file" 
                          accept="image/*" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          onChange={handleFileChange}
                        />
                        <div className={`flex items-center gap-3 rounded-lg border-2 border-dashed p-3 transition-colors ${file ? "border-gold/50 bg-gold/5" : "border-border/60 hover:border-gold/30"}`}>
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            {file ? <FileImage className="h-5 w-5 text-gold" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="text-xs font-medium truncate">{file ? file.name : "Click to upload screenshot"}</div>
                            <div className="text-[10px] text-muted-foreground">JPG, PNG allowed</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  onClick={handleSubmitProof} 
                  disabled={uploading || !txHash || !file}
                  className="w-full bg-gradient-gold text-gold-foreground font-semibold shadow-gold transition-transform hover:scale-[1.01]"
                >
                  {uploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Proof...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-4 w-4" /> I've Made the Payment</>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {selected && (
        <BuyCryptoDialog 
          open={buyOpen}
          onOpenChange={setBuyOpen}
          walletAddress={selected.address}
          asset={selected.asset}
          network={selected.network}
        />
      )}
    </>
  );
}
