import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { calcJewelryPrice, useCart, type JewelryProduct } from "@/lib/jewelry";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, Truck, Receipt, Clock, ShieldCheck, Wallet as WalletIcon, Bitcoin } from "lucide-react";
import { JewelryPaymentDialog } from "@/components/JewelryPaymentDialog";

export const Route = createFileRoute("/app/checkout")({
  component: CheckoutPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().min(8, "Please enter a complete address").max(500),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

type Courier = { id: string; name: string; base_fee_usd: number; logo_url: string | null; regions: string[] };

type Step = 1 | 2 | 3;
type PayMethod = "wallet" | "crypto";

const STEP_LABELS: Record<Step, string> = {
  1: "Delivery details",
  2: "Courier",
  3: "Review & place order",
};

function CheckoutPage() {
  const { user } = useAuth();
  const cart = useCart();
  const { pricePerGram } = useGoldPrice();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [products, setProducts] = useState<JewelryProduct[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [courierId, setCourierId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PayMethod>("wallet");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentTotal, setPaymentTotal] = useState(0);

  // Autofill profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone, country").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setFullName((prev) => prev || data.full_name || "");
        setPhone((prev) => prev || data.phone || "");
        setCountry((prev) => prev || data.country || "");
      });
    // Pull most recent jewelry order address as a stronger default
    supabase.from("orders").select("delivery_full_name, delivery_phone, delivery_address, delivery_country")
      .eq("user_id", user.id).eq("type", "jewelry").order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const d = data as unknown as { delivery_full_name: string; delivery_phone: string | null; delivery_address: string; delivery_country: string | null };
        setFullName((prev) => prev || d.delivery_full_name || "");
        setPhone((prev) => prev || d.delivery_phone || "");
        setAddress((prev) => prev || d.delivery_address || "");
        setCountry((prev) => prev || d.delivery_country || "");
      });
    supabase.from("wallets").select("balance_usd").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setWalletBalance(Number(data?.balance_usd ?? 0)));
  }, [user]);

  // Load cart products and couriers
  useEffect(() => {
    if (cart.items.length === 0) { setProducts([]); return; }
    const ids = cart.items.map((i) => i.product_id);
    supabase.from("jewelry_products" as never).select("*").in("id", ids)
      .then(({ data }) => setProducts((data ?? []) as unknown as JewelryProduct[]));
  }, [cart.items]);

  useEffect(() => {
    supabase.from("couriers").select("id, name, base_fee_usd, logo_url, regions").eq("active", true).is("deleted_at", null).order("base_fee_usd")
      .then(({ data }) => {
        const list = (data ?? []) as Courier[];
        setCouriers(list);
        if (list.length && !courierId) setCourierId(list[0].id);
      });
  }, []);

  const lines = useMemo(() => cart.items.map((it) => {
    const p = products.find((x) => x.id === it.product_id);
    if (!p) return null;
    const price = calcJewelryPrice(p, pricePerGram);
    return { p, qty: it.quantity, unit: price.total, subtotal: price.total * it.quantity };
  }).filter(Boolean) as { p: JewelryProduct; qty: number; unit: number; subtotal: number }[], [cart.items, products, pricePerGram]);

  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const selectedCourier = couriers.find((c) => c.id === courierId);
  const shipping = Number(selectedCourier?.base_fee_usd ?? 0);
  const total = subtotal + shipping;
  const walletShort = payMethod === "wallet" && walletBalance < total;

  const validateStep1 = () => {
    const parsed = schema.safeParse({ full_name: fullName, phone, address, country, notes });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return false; }
    return true;
  };

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !courierId) { toast.error("Please select a courier"); return; }
    setStep((s) => (Math.min(3, s + 1) as Step));
  };
  const prev = () => setStep((s) => (Math.max(1, s - 1) as Step));

  const submit = async () => {
    if (!validateStep1()) { setStep(1); return; }
    if (!courierId) { setStep(2); toast.error("Choose a courier"); return; }
    if (lines.length === 0) { toast.error("Cart is empty"); return; }
    // Re-validate stock against latest product data
    const stockIssue = lines.find(({ p, qty }) => qty > p.stock_quantity || p.stock_quantity <= 0);
    if (stockIssue) {
      toast.error(`${stockIssue.p.name}: only ${stockIssue.p.stock_quantity} in stock`);
      navigate({ to: "/app/cart" });
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.rpc("place_jewelry_order", {
      _items: cart.items,
      _gold_rate: pricePerGram,
      _delivery_full_name: fullName,
      _delivery_phone: phone || "",
      _delivery_address: address,
      _delivery_country: country || "",
      _courier_id: courierId,
      _notes: notes || undefined,
    });
    if (error) { setSubmitting(false); toast.error(error.message); return; }
    const orderId = (data as { order_id?: string } | null)?.order_id;
    if (!orderId) {
      setSubmitting(false);
      toast.error("Order placed but failed to retrieve ID");
      return;
    }
    setIsOrderPlaced(true);
    cart.clear();

    if (payMethod === "wallet") {
      const { error: payErr } = await supabase.rpc("pay_jewelry_order_with_wallet", { _order_id: orderId });
      setSubmitting(false);
      if (payErr) {
        toast.warning("Order placed, but wallet payment failed: " + payErr.message);
        navigate({ to: "/app/jewelry-orders/$id", params: { id: orderId } });
        return;
      }
      toast.success("Order paid from wallet!");
      navigate({ to: "/app/jewelry-orders/$id", params: { id: orderId } });
      return;
    }

    if (payMethod === "crypto") {
      await supabase.rpc("set_jewelry_payment_method", { _order_id: orderId, _method: "crypto" });
      setPaymentOrderId(orderId);
      setPaymentTotal(total);
      setShowPaymentDialog(true);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    toast.success("Order placed!");
    navigate({ to: "/app/jewelry-orders/$id", params: { id: orderId } });
  };

  if (cart.items.length === 0 && !isOrderPlaced) {
    return (
      <div className="space-y-3">
        <PageHeader title="Checkout" />
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild><Link to="/app/marketplace">Browse jewelry</Link></Button>
      </div>
    );
  }

  if (isOrderPlaced) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Order Placed" 
          subtitle="Your items have been reserved. Please complete the payment below." 
        />
        <Card className="border-gold bg-gold/5">
          <CardContent className="p-10 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-gold mx-auto" />
            <h2 className="text-2xl font-bold">Order Received</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your order has been recorded in our system. Please use the payment dialog to finalize your purchase.
            </p>
          </CardContent>
        </Card>
        
        <JewelryPaymentDialog
          open={showPaymentDialog}
          onOpenChange={(open) => {
            setShowPaymentDialog(open);
            if (!open && paymentOrderId) {
              navigate({ to: "/app/jewelry-orders/$id", params: { id: paymentOrderId } });
            }
          }}
          orderId={paymentOrderId}
          totalAmount={paymentTotal}
          onSuccess={() => {
            navigate({ to: "/app/jewelry-orders/$id", params: { id: paymentOrderId } });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Checkout" subtitle="Three quick steps to confirm your jewelry order." />

      {/* Stepper */}
      <Stepper step={step} onJump={(s) => {
        if (s === 1) setStep(1);
        if (s === 2 && validateStep1()) setStep(2);
        if (s === 3 && validateStep1() && courierId) setStep(3);
      }} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card><CardContent className="space-y-5 p-5 md:p-6">
          {step === 1 && (
            <>
              <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-gold" /><h2 className="font-semibold">Delivery details</h2></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Full name *</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" /></div>
                <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" /></div>
                <div><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United Arab Emirates" /></div>
                <div className="sm:col-span-2"><Label>Address *</Label><Textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, building, city, postal code" /></div>
                <div className="sm:col-span-2"><Label>Notes (optional)</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery instructions, gate code, etc." /></div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-gold" /><h2 className="font-semibold">Choose a courier</h2></div>
              {couriers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No couriers are currently available. Please contact support.</p>
              ) : (
                <RadioGroup value={courierId} onValueChange={setCourierId} className="space-y-2">
                  {couriers.map((c) => {
                    const eta = etaForCourier(c);
                    const selected = courierId === c.id;
                    return (
                      <Label key={c.id} className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${selected ? "border-gold bg-gold/5" : "border-border/60 hover:border-gold/50"}`}>
                        <RadioGroupItem value={c.id} />
                        {c.logo_url ? (
                          <img src={c.logo_url} alt={c.name} className="h-10 w-10 rounded object-contain" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gold/10 text-gold"><Truck className="h-5 w-5" /></div>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold">{c.name}</div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Est. {eta}</span>
                            {c.regions.length > 0 && <span>· {c.regions.slice(0, 3).join(", ")}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gold">{formatUSD(Number(c.base_fee_usd))}</div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Shipping</div>
                        </div>
                      </Label>
                    );
                  })}
                </RadioGroup>
              )}
              <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>All shipments are fully insured and require signature on delivery.</span>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-2"><Receipt className="h-5 w-5 text-gold" /><h2 className="font-semibold">Review your order</h2></div>

              <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivering to</div>
                  <button onClick={() => setStep(1)} className="text-xs text-gold hover:underline">Edit</button>
                </div>
                <div className="font-medium">{fullName}</div>
                <div className="text-sm text-muted-foreground">{address}</div>
                {country && <div className="text-sm text-muted-foreground">{country}</div>}
                {phone && <div className="text-sm text-muted-foreground">Phone: {phone}</div>}
              </div>

              <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Courier</div>
                  <button onClick={() => setStep(2)} className="text-xs text-gold hover:underline">Edit</button>
                </div>
                {selectedCourier ? (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{selectedCourier.name}</div>
                      <div className="text-xs text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />Est. {etaForCourier(selectedCourier)}</div>
                    </div>
                    <div className="text-sm font-semibold text-gold">{formatUSD(shipping)}</div>
                  </div>
                ) : <div className="text-sm text-muted-foreground">No courier selected</div>}
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</div>
                <div className="space-y-2">
                  {lines.map(({ p, qty, subtotal: s }) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-3">
                      <div className="h-12 w-12 overflow-hidden rounded bg-muted/40">
                        {p.thumbnail_url && <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.purity} · {p.weight_grams}g · qty {qty}</div>
                      </div>
                      <div className="font-semibold text-gold">{formatUSD(s)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment method</div>
                <RadioGroup value={payMethod} onValueChange={(v) => setPayMethod(v as PayMethod)} className="grid gap-2 sm:grid-cols-2">
                  <Label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${payMethod === "wallet" ? "border-gold bg-gold/5" : "border-border/60 hover:border-gold/50"}`}>
                    <RadioGroupItem value="wallet" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-semibold"><WalletIcon className="h-4 w-4 text-gold" /> Wallet balance</div>
                      <div className="mt-1 text-xs text-muted-foreground">Available: <span className={walletShort ? "text-ruby" : "text-foreground"}>{formatUSD(walletBalance)}</span></div>
                      {walletShort && <div className="mt-1 text-xs text-ruby">Insufficient — top up or pick crypto.</div>}
                    </div>
                  </Label>
                  <Label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${payMethod === "crypto" ? "border-gold bg-gold/5" : "border-border/60 hover:border-gold/50"}`}>
                    <RadioGroupItem value="crypto" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-semibold"><Bitcoin className="h-4 w-4 text-gold" /> Pay with crypto</div>
                      <div className="mt-1 text-xs text-muted-foreground">Send from your external wallet or buy from a provider. Order stays pending until confirmed.</div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <Button variant="outline" onClick={step === 1 ? () => navigate({ to: "/app/cart" }) : prev}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {step === 1 ? "Back to cart" : "Back"}
            </Button>
            {step < 3 ? (
              <Button onClick={next} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting || walletShort} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                {submitting ? "Placing order…" : <><CheckCircle2 className="mr-2 h-4 w-4" /> {payMethod === "wallet" ? "Pay & place order" : "Place order · Pay with crypto"}</>}
              </Button>
            )}
          </div>
        </CardContent></Card>

        {/* Summary */}
        <Card className="h-fit border-gold/40"><CardContent className="space-y-3 p-5">
          <h2 className="font-semibold">Order summary</h2>
          <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
            {lines.map(({ p, qty, subtotal: s }) => (
              <div key={p.id} className="flex justify-between gap-2"><span className="line-clamp-1">{p.name} × {qty}</span><span>{formatUSD(s)}</span></div>
            ))}
          </div>
          <div className="space-y-1 border-t border-border/60 pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatUSD(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping > 0 ? formatUSD(shipping) : "—"}</span></div>
            <div className="flex justify-between pt-2 text-base font-bold"><span>Total</span><span className="text-gold">{formatUSD(total)}</span></div>
          </div>
          {selectedCourier && (
            <div className="rounded-md border border-border/60 bg-background/40 p-2.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5 text-foreground"><Clock className="h-3 w-3 text-gold" /> Est. delivery</div>
              <div>{etaForCourier(selectedCourier)}</div>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">Stock is reserved at the moment your order is placed. Pricing is locked at the live gold rate at checkout.</p>
        </CardContent></Card>
      </div>

      <JewelryPaymentDialog
        open={showPaymentDialog}
        onOpenChange={(open) => {
          setShowPaymentDialog(open);
          if (!open && paymentOrderId) {
            navigate({ to: "/app/jewelry-orders/$id", params: { id: paymentOrderId } });
          }
        }}
        orderId={paymentOrderId}
        totalAmount={paymentTotal}
        onSuccess={() => {
          navigate({ to: "/app/jewelry-orders/$id", params: { id: paymentOrderId } });
        }}
      />
    </div>
  );
}

function Stepper({ step, onJump }: { step: Step; onJump: (s: Step) => void }) {
  const steps: Step[] = [1, 2, 3];
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/60 p-3">
      {steps.map((s, i) => {
        const reached = step >= s;
        const current = step === s;
        return (
          <div key={s} className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => onJump(s)}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${current ? "border-gold bg-gradient-gold text-gold-foreground shadow-gold" : reached ? "border-gold/60 bg-gold/10 text-gold" : "border-border/60 bg-card text-muted-foreground"}`}
            >
              {reached && !current ? <CheckCircle2 className="h-4 w-4" /> : s}
            </button>
            <div className="hidden flex-col sm:flex">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Step {s}</div>
              <div className={`text-xs font-semibold ${current || reached ? "text-foreground" : "text-muted-foreground"}`}>{STEP_LABELS[s]}</div>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 ${step > s ? "bg-gold" : "bg-border/60"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function etaForCourier(c: Courier): string {
  // Heuristic: domestic couriers tend to have lower base fees.
  const fee = Number(c.base_fee_usd);
  const name = c.name.toLowerCase();
  if (name.includes("express") || fee >= 75) return "1-2 business days";
  if (name.includes("priority") || fee >= 40) return "2-4 business days";
  if (name.includes("standard") || fee >= 15) return "4-7 business days";
  return "5-10 business days";
}
