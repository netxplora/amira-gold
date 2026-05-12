import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShoppingBag, Vault, Truck, ShieldCheck, Wallet as WalletIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Flag } from "@/components/Flag";
import { GoldMarketChart } from "@/components/GoldMarketChart";
import goldBarImg from "@/assets/gold-bar-product.jpg";

type Product = { id: string; name: string; weight_grams: number; premium_pct: number };
type Vault = { id: string; name: string; location: string };

export const Route = createFileRoute("/app/buy")({
  component: BuyFlow,
});

function locationCode(loc?: string | null): string | null {
  if (!loc) return null;
  const l = loc.toLowerCase();
  if (l.includes("zurich") || l.includes("switzer")) return "CH";
  if (l.includes("dubai") || l.includes("emirates")) return "AE";
  if (l.includes("singap")) return "SG";
  if (l.includes("london") || l.includes("united kingdom")) return "GB";
  if (l.includes("toronto") || l.includes("canada")) return "CA";
  return null;
}

function BuyFlow() {
  const { user } = useAuth();
  const { pricePerGram } = useGoldPrice();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [delivery, setDelivery] = useState<"vault" | "delivery">("vault");
  const [vaultId, setVaultId] = useState<string>("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("gold_products").select("*").eq("active", true).order("weight_grams")
      .then(({ data }) => {
        const list = (data ?? []) as Product[];
        setProducts(list);
        if (list.length) setProductId(list[0].id);
      });
    supabase.from("vaults").select("id,name,location").then(({ data }) => {
      const v = (data ?? []) as Vault[];
      setVaults(v);
      if (v.length) setVaultId(v[0].id);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("wallets").select("balance_usd").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setBalance(Number(data?.balance_usd ?? 0)));
    // Autofill delivery from registered profile address (editable)
    supabase.from("kyc_submissions")
      .select("address,full_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(async ({ data: kyc }) => {
        if (kyc?.address) { setAddress(kyc.address); return; }
        const { data: prof } = await supabase.from("profiles").select("country").eq("id", user.id).maybeSingle();
        if (prof?.country) setAddress(prof.country);
      });
  }, [user]);

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const grams = (product?.weight_grams ?? 0) * qty;
  const unitPrice = product ? Number(product.weight_grams) * pricePerGram * (1 + Number(product.premium_pct) / 100) : 0;
  const total = unitPrice * qty + (delivery === "delivery" ? 75 : 0);

  const submit = async () => {
    if (!user || !product) return;
    if (total > balance) return toast.error("Insufficient wallet balance. Please top up.");
    if (delivery === "delivery" && !address.trim()) return toast.error("Enter delivery address");

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("place_gold_order", {
        _product_id: product.id,
        _vault_id: (delivery === "vault" ? vaultId : undefined) as any,
        _type: delivery as any,
        _quantity: qty,
        _delivery_address: (delivery === "delivery" ? address : undefined) as any,
        _price_per_gram: pricePerGram,
      });

      if (error) throw error;

      toast.success("Order confirmed!");
      navigate({ to: "/app/holdings" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selVault = vaults.find((v) => v.id === vaultId);
  const code = locationCode(selVault?.location);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="New Purchase"
        title="Buy gold"
        subtitle="Choose your bar, store it in our vault, or have it delivered insured to your door."
        icon={<ShoppingBag className="h-6 w-6" />}
      />

      <GoldMarketChart />

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <Card className="border-border/60 bg-card/80">
          <CardContent className="space-y-6 p-6">
            <div className="flex gap-4 rounded-xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-4">
              <img src={goldBarImg} alt="Gold bar" className="h-20 w-20 rounded-lg object-cover ring-1 ring-gold/30" />
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-widest text-gold">LBMA-Certified • 999.9 fine</div>
                <div className="mt-0.5 font-semibold">{product?.name ?? "Choose a product"}</div>
                <div className="mt-1 text-xs text-muted-foreground">Cast or minted by accredited refiners. Serial-numbered.</div>
              </div>
            </div>

            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {p.weight_grams}g</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantity</Label>
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
            </div>

            <div>
              <Label className="mb-2 block">Delivery method</Label>
              <RadioGroup value={delivery} onValueChange={(v) => setDelivery(v as "vault" | "delivery")} className="grid grid-cols-2 gap-3">
                <label className={`cursor-pointer rounded-xl border p-4 transition-all ${delivery === "vault" ? "border-gold bg-gold/5 shadow-gold" : "border-border/60 hover:border-gold/40"}`}>
                  <RadioGroupItem value="vault" className="sr-only" />
                  <Vault className="mb-2 h-5 w-5 text-gold" />
                  <div className="font-medium">Vault storage</div>
                  <div className="text-xs text-muted-foreground">Free first year • Allocated</div>
                </label>
                <label className={`cursor-pointer rounded-xl border p-4 transition-all ${delivery === "delivery" ? "border-gold bg-gold/5 shadow-gold" : "border-border/60 hover:border-gold/40"}`}>
                  <RadioGroupItem value="delivery" className="sr-only" />
                  <Truck className="mb-2 h-5 w-5 text-gold" />
                  <div className="font-medium">Insured delivery</div>
                  <div className="text-xs text-muted-foreground">$75 worldwide • 3-5 days</div>
                </label>
              </RadioGroup>
            </div>

            {delivery === "vault" ? (
              <div>
                <Label>Vault</Label>
                <Select value={vaultId} onValueChange={setVaultId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {vaults.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name} — {v.location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selVault && code && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-3 text-xs">
                    <Flag code={code} />
                    <div className="flex-1">
                      <div className="font-medium">{selVault.name}</div>
                      <div className="text-muted-foreground">{selVault.location}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" /> Insured
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label>Delivery address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, Country" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order summary sticky */}
        <div>
          <Card className="sticky top-20 border-gold/30 bg-card/80 shadow-gold">
            <CardContent className="space-y-3 p-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-gold">Order summary</div>
              <Row label="Live price" value={`${formatUSD(pricePerGram)}/g`} />
              <Row label="Quantity" value={`${qty} × ${product?.weight_grams ?? 0}g`} />
              <Row label="Fine gold" value={`${grams.toFixed(4)} g`} />
              <Row label="Unit price" value={formatUSD(unitPrice)} />
              {delivery === "delivery" && <Row label="Shipping" value={formatUSD(75)} />}
              <div className="border-t border-border/60 pt-3">
                <Row
                  label={<span className="font-semibold">Total</span>}
                  value={<span className="text-xl font-bold text-gradient-gold">{formatUSD(total)}</span>}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-2.5 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <WalletIcon className="h-3.5 w-3.5" /> Wallet
                </span>
                <span className={`font-semibold ${balance < total ? "text-ruby" : "text-emerald-400"}`}>{formatUSD(balance)}</span>
              </div>
              <Button onClick={submit} disabled={submitting || !product} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
                {submitting ? "Processing..." : "Confirm purchase"}
              </Button>
              {balance < total && (
                <Link to="/app/wallet" className="block text-center text-xs text-gold hover:underline">
                  Top up wallet →
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
