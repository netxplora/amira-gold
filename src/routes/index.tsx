import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GoldPriceTicker } from "@/components/GoldPriceTicker";
import { Flag, VAULT_LOCATIONS } from "@/components/Flag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import {
  ShieldCheck, Vault, Truck, TrendingUp, Award, CheckCircle2, Sparkles, ArrowRight, Star,
  CreditCard, Globe, Wallet, Lock, Calculator, FileCheck, Scale, RefreshCw, BarChart3,
  Layers, ChevronRight,
} from "lucide-react";
import heroGold from "@/assets/hero-gold-premium.jpg";
import vaultInterior from "@/assets/vault-interior.jpg";
import ceoPortrait from "@/assets/ceo-portrait.jpg";
import deliveryTruck from "@/assets/delivery-truck.jpg";
import amiraCardHero from "@/assets/amira-card-hero.png";
import vaultZurich from "@/assets/vault-zurich.jpg";
import vaultDubai from "@/assets/vault-dubai.jpg";
import vaultSingapore from "@/assets/vault-singapore.jpg";
import vaultLondon from "@/assets/vault-london.jpg";
import vaultToronto from "@/assets/vault-toronto.jpg";
import vaultRiyadh from "@/assets/vault-riyadh.jpg";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { FeaturedJewelry } from "@/components/FeaturedJewelry";

const VAULT_IMAGES: Record<string, string> = {
  CH: vaultZurich,
  AE: vaultDubai,
  SG: vaultSingapore,
  GB: vaultLondon,
  CA: vaultToronto,
  SA: vaultRiyadh,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Amira Gold — Buy, Store & Invest in Physical Gold" },
      { name: "description", content: "Buy LBMA-certified physical gold bars, invest in fractional gold from $10, and store in insured vaults across Zurich, Dubai, Singapore and London." },
      { property: "og:title", content: "Amira Gold — Buy, Store & Invest in Physical Gold" },
      { property: "og:description", content: "Allocated physical gold. Insured vaults. Instant trading from $10." },
      { property: "og:image", content: heroGold },
      { name: "twitter:image", content: heroGold },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <TrustBar />
      <InteractiveCalculatorSection />
      <BullionCatalogSection />
      <VaultsStrip />
      <VaultComparisonSection />
      <SecurityArchitectureSection />
      <HowItWorks />
      <ProductHighlight />
      <FeaturedJewelry />
      <DeliverySection />
      <CardSection />
      <CEOSection />
      <Testimonials />
      <FAQ />
      <CTASection />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  const { pricePerGram } = useGoldPrice();
  return (
    <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-card/40 via-background to-background pt-6 pb-12 sm:pt-10 sm:pb-16 lg:py-20">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 items-center md:grid-cols-12 md:gap-12">
          {/* Left Hero Content */}
          <div className="flex flex-col justify-center md:col-span-7 animate-fade-in">
            <div className="flex items-center gap-2">
              <GoldPriceTicker />
            </div>

            <h1 className="font-display mt-5 text-3xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
              Physical gold ownership.
              <br />
              <span className="text-primary">Insured &amp; Allocated.</span>
              <br />
              <span className="text-muted-foreground">Stored globally.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed sm:text-base md:text-lg">
              Purchase authenticated LBMA bullion bars from 1g to 1kg, invest in fractional gold from
              <span className="text-foreground font-semibold"> $10</span>, and hold allocated title in
              <span className="text-foreground font-medium"> Zurich, Dubai, Riyadh, Singapore</span>, and
              <span className="text-foreground font-medium"> London</span>.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-xs font-semibold">
                <Link to="/buy">Buy Gold Bars <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border/80 bg-card/80">
                <Link to="/invest"><TrendingUp className="mr-1.5 h-4 w-4 text-primary" /> Fractional Investing</Link>
              </Button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border/60 pt-5">
              <div>
                <div className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">$84M+</div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Under Custody</div>
              </div>
              <div>
                <div className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">100%</div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Direct Title</div>
              </div>
              <div>
                <div className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">3–7 Days</div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Insured Delivery</div>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Card */}
          <div className="md:col-span-5 animate-slide-up">
            <div className="card-3d overflow-hidden rounded-2xl border border-border/80 bg-card shadow-3d">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40">
                <img
                  src={heroGold}
                  alt="Physical gold bullion bars"
                  width={1920}
                  height={1280}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-emerald/30 bg-emerald/10 px-2.5 py-1 text-xs font-semibold text-emerald-500 backdrop-blur-md">
                  <ShieldCheck className="h-3.5 w-3.5" /> Insured by Lloyd's
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-primary">Standard 100g Bar</div>
                    <div className="font-display text-sm font-bold text-foreground">999.9 Fine Gold · Mint Serialized</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-muted-foreground">Live Market Value</div>
                    <div className="font-display text-sm font-bold text-primary">{formatUSD(pricePerGram * 100)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Free Year 1 Vault Storage</span>
                  <Link to="/buy" className="font-semibold text-primary hover:underline">View Bars →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    "LBMA-Certified Good Delivery",
    "Underwritten by Lloyd's of London",
    "ISO 27001 Security Standard",
    "SOC 2 Type II Verified",
    "Quarterly Physical Audits by BDO",
  ];
  return (
    <div className="border-b border-border/60 bg-muted/30 py-4 sm:py-5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2.5 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {items.map((i) => (
          <span key={i} className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{i}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function InteractiveCalculatorSection() {
  const { pricePerGram } = useGoldPrice();
  const [mode, setMode] = useState<"grams" | "usd">("grams");
  const [amount, setAmount] = useState<number>(50);

  const grams = mode === "grams" ? amount : amount / pricePerGram;
  const usdValue = mode === "grams" ? amount * pricePerGram : amount;
  const troyOz = grams / 31.1035;
  const annualStorageEstimate = usdValue * 0.0025; // 0.25% annual fee

  const PRESET_GRAMS = [10, 50, 100, 250, 500, 1000];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 text-center sm:mb-12">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">Allocation Estimator</span>
        <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Calculate Your Gold Allocation</h2>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-lg mx-auto sm:text-sm leading-relaxed">
          Estimate live bullion valuation, troy ounce equivalent, and custody fees in real-time.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Input Controller */}
        <Card className="border-border/70 bg-card shadow-card p-6 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="font-display text-sm font-semibold text-foreground">Allocation Parameters</span>
            </div>
            <div className="flex items-center rounded-lg border border-border/70 bg-muted/40 p-1 text-xs">
              <button
                type="button"
                onClick={() => { setMode("grams"); setAmount(50); }}
                className={`rounded-md px-3 py-1 font-medium transition-all ${mode === "grams" ? "bg-primary text-primary-foreground shadow-xs font-semibold" : "text-muted-foreground"}`}
              >
                Weight (Grams)
              </button>
              <button
                type="button"
                onClick={() => { setMode("usd"); setAmount(5000); }}
                className={`rounded-md px-3 py-1 font-medium transition-all ${mode === "usd" ? "bg-primary text-primary-foreground shadow-xs font-semibold" : "text-muted-foreground"}`}
              >
                Amount ($ USD)
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                {mode === "grams" ? "Selected Bullion Weight" : "Investment Budget"}
              </label>
              <span className="font-display text-xl font-bold text-foreground">
                {mode === "grams" ? `${amount} g` : formatUSD(amount)}
              </span>
            </div>

            <input
              type="range"
              min={mode === "grams" ? 5 : 100}
              max={mode === "grams" ? 1000 : 100000}
              step={mode === "grams" ? 5 : 250}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-3 w-full accent-primary cursor-pointer"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {PRESET_GRAMS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setMode("grams"); setAmount(g); }}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                    mode === "grams" && amount === g
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  {g >= 1000 ? "1 kg" : `${g}g`}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/50 pt-5 text-xs sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="text-muted-foreground">Gross Weight</div>
              <div className="font-display mt-1 text-sm font-bold text-foreground">{grams.toFixed(2)} g</div>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="text-muted-foreground">Troy Ounces</div>
              <div className="font-display mt-1 text-sm font-bold text-foreground">{troyOz.toFixed(2)} oz</div>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 col-span-2 sm:col-span-1">
              <div className="text-muted-foreground">Purity Standard</div>
              <div className="font-display mt-1 text-sm font-bold text-foreground">999.9 (24K)</div>
            </div>
          </div>
        </Card>

        {/* Live Estimation Output Card */}
        <Card className="border-border/70 bg-card/95 shadow-card p-6 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Allocation Summary</div>
            <div className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {formatUSD(usdValue)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Based on spot rate of {formatUSD(pricePerGram)}/gram
            </div>

            <div className="mt-6 space-y-3 text-xs border-t border-border/50 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Year 1 Vault Custody</span>
                <span className="font-bold text-emerald-500">$0.00 (Free)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lloyd's Insurance Coverage</span>
                <span className="font-medium text-foreground">Included 100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Serialized Mint Assays</span>
                <span className="font-medium text-foreground">Included</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subsequent Annual Custody (0.25%)</span>
                <span className="font-medium text-muted-foreground">{formatUSD(annualStorageEstimate)}/year</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/60">
            <Button asChild className="w-full shadow-xs font-semibold">
              <Link to="/buy">Proceed With Allocation <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

function BullionCatalogSection() {
  const { pricePerGram } = useGoldPrice();

  const BARS = [
    { name: "10g Cast Bar", grams: 10, purity: "999.9", ref: "LBMA-10G", refiner: "Valcambi / PAMP" },
    { name: "50g Minted Bar", grams: 50, purity: "999.9", ref: "LBMA-50G", refiner: "Heraeus / Metalor" },
    { name: "100g Minted Bar", grams: 100, purity: "999.9", ref: "LBMA-100G", refiner: "Argor-Heraeus" },
    { name: "1000g (1kg) Bullion Bar", grams: 1000, purity: "999.9", ref: "LBMA-1KG", refiner: "PAMP Suisse" },
  ];

  const COINS = [
    { name: "1 oz American Eagle", grams: 31.1035, purity: "916.7 (22K)", origin: "United States Mint" },
    { name: "1 oz Maple Leaf", grams: 31.1035, purity: "999.9 (24K)", origin: "Royal Canadian Mint" },
    { name: "1 oz Britannia", grams: 31.1035, purity: "999.9 (24K)", origin: "The Royal Mint UK" },
    { name: "1 oz Krugerrand", grams: 31.1035, purity: "916.7 (22K)", origin: "South African Mint" },
  ];

  return (
    <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Bullion Product Catalog</span>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">LBMA-Approved Minted Bullion</h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed sm:text-sm max-w-xl">
              All physical bars and coins are certified for purity, individually serialized, and stored in bonded depositories.
            </p>
          </div>
          <Button asChild variant="outline" className="border-border/70 shadow-2xs">
            <Link to="/buy">View All Products <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>

        <Tabs defaultValue="bars" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="bars">Minted Bars</TabsTrigger>
            <TabsTrigger value="coins">Sovereign Coins</TabsTrigger>
          </TabsList>

          <TabsContent value="bars">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BARS.map((b) => {
                const total = b.grams * pricePerGram;
                return (
                  <Card key={b.name} className="card-3d border-border/70 bg-card p-3.5 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary sm:text-[10px] sm:px-2">
                          {b.purity}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">{b.grams}g</span>
                      </div>
                      <h3 className="font-display mt-2.5 text-xs font-bold text-foreground sm:text-base">{b.name}</h3>
                      <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1 sm:text-xs sm:mt-1">{b.refiner}</p>
                    </div>
                    <div className="mt-4 border-t border-border/50 pt-3 flex flex-col gap-2 sm:mt-5 sm:pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">Live Rate</div>
                        <div className="font-display text-xs font-bold text-primary sm:text-base">{formatUSD(total)}</div>
                      </div>
                      <Button asChild size="sm" className="h-7 text-xs sm:h-8 shadow-xs w-full sm:w-auto font-semibold">
                        <Link to="/buy">Buy</Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="coins">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {COINS.map((c) => {
                const total = c.grams * pricePerGram;
                return (
                  <Card key={c.name} className="card-3d border-border/70 bg-card p-3.5 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="inline-flex items-center rounded-full border border-emerald/20 bg-emerald/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-500 sm:text-[10px] sm:px-2">
                          {c.purity}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">1 oz</span>
                      </div>
                      <h3 className="font-display mt-2.5 text-xs font-bold text-foreground sm:text-base">{c.name}</h3>
                      <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1 sm:text-xs sm:mt-1">{c.origin}</p>
                    </div>
                    <div className="mt-4 border-t border-border/50 pt-3 flex flex-col gap-2 sm:mt-5 sm:pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">Live Rate</div>
                        <div className="font-display text-xs font-bold text-primary sm:text-base">{formatUSD(total)}</div>
                      </div>
                      <Button asChild size="sm" className="h-7 text-xs sm:h-8 shadow-xs w-full sm:w-auto font-semibold">
                        <Link to="/buy">Buy</Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function VaultsStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Global Custody</span>
          <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Stored in Secure Depository Jurisdictions</h2>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed sm:text-sm max-w-2xl">
            Six LBMA-approved facilities across major financial centers. Fully insured by Lloyd's of London.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="border-border/70">
          <Link to="/proof-of-reserves">View Proof of Reserves →</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VAULT_LOCATIONS.map((v) => (
          <Card key={v.code} className="card-3d group overflow-hidden border-border/70 bg-card/90 shadow-card p-0">
            <div className="relative h-40 w-full overflow-hidden bg-muted/40">
              <img
                src={VAULT_IMAGES[v.code] ?? vaultInterior}
                alt={`${v.city}, ${v.country} vault location`}
                width={1024}
                height={768}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute left-3 top-3">
                <Flag code={v.code} className="h-6 w-9 text-xl shadow-md rounded-xs" />
              </div>
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> Insured
              </span>
            </div>
            <CardContent className="p-4">
              <div className="flex items-baseline justify-between">
                <div className="font-display font-semibold text-foreground text-base">{v.city}</div>
                <div className="text-xs text-muted-foreground">{v.country}</div>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              <div className="mt-3.5 flex items-center gap-1.5 text-xs font-medium text-primary border-t border-border/50 pt-2.5">
                <Vault className="h-3.5 w-3.5" /> LBMA-approved facility
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function VaultComparisonSection() {
  const JURISDICTIONS = [
    { city: "Zurich", country: "Switzerland", tax: "0% VAT / 0% Wealth Duty", audit: "Monthly Physical Inventory", customs: "Bonded FreePort", access: "Direct Inspection Available" },
    { city: "Dubai", country: "United Arab Emirates", tax: "0% VAT (DMCC Zone)", audit: "Quarterly Audit by BDO", customs: "Tax-Free Precious Metals Zone", access: "Armored Export Available" },
    { city: "Singapore", country: "Singapore", tax: "0% Investment Precious Metals GST", audit: "Bi-annual Verification", customs: "Singapore FreePort", access: "Direct Asian Hub" },
    { city: "London", country: "United Kingdom", tax: "0% Investment Gold VAT", audit: "Continuous LBMA Oversight", customs: "Bonded Bank Depository", access: "Global OTC Settlement" },
  ];

  return (
    <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Jurisdiction Matrix</span>
          <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Depository Comparison Matrix</h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-xl mx-auto sm:text-sm leading-relaxed">
            Choose the regulatory and geographic jurisdiction that matches your wealth preservation strategy.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-card">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 font-semibold text-foreground">
                <th className="p-4">Jurisdiction</th>
                <th className="p-4">Tax Treatment</th>
                <th className="p-4">Audit Protocol</th>
                <th className="p-4">Customs Status</th>
                <th className="p-4">Physical Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-muted-foreground">
              {JURISDICTIONS.map((j) => (
                <tr key={j.city} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-display font-semibold text-foreground">
                    {j.city}, <span className="text-xs font-normal text-muted-foreground">{j.country}</span>
                  </td>
                  <td className="p-4">{j.tax}</td>
                  <td className="p-4">{j.audit}</td>
                  <td className="p-4">{j.customs}</td>
                  <td className="p-4 font-medium text-foreground">{j.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SecurityArchitectureSection() {
  const PILLARS = [
    { icon: Scale, title: "Direct Title Bailment", desc: "You hold direct, unencumbered legal ownership. Your bullion is never treated as a liability on our balance sheet." },
    { icon: ShieldCheck, title: "Lloyd's Underwritten Policy", desc: "100% of vault reserves and courier transit shipments are underwritten against physical theft, damage, and loss." },
    { icon: FileCheck, title: "Cryptographic Proof of Reserves", desc: "Regularly published itemized holdings reconciled against depository receipts for complete transparency." },
    { icon: Lock, title: "Multi-Signature Authorizations", desc: "Digital allocation transfers and withdrawal requests require multi-party biometric authorization checks." },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center sm:mb-14">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">Security Architecture</span>
        <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Institutional-Grade Custody Standards</h2>
        <p className="mt-1 text-xs text-muted-foreground max-w-xl mx-auto sm:text-sm leading-relaxed">
          Four foundational pillars safeguarding every gram of precious metal under our administration.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.title} className="card-3d border-border/70 bg-card/90 shadow-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display mt-3 text-base font-semibold text-foreground">{p.title}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Open Account", d: "Register a secure custody account in minutes." },
    { n: "02", t: "Verify Identity", d: "Standard encrypted KYC verification for asset safety." },
    { n: "03", t: "Fund Account", d: "Deposit via bank transfer, card, or digital payment." },
    { n: "04", t: "Buy Gold", d: "Select exact grams or standard bullion bars at spot price." },
    { n: "05", t: "Vault or Ship", d: "Hold in insured vaults or request direct home delivery." },
  ];
  return (
    <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Process</span>
          <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Straightforward Gold Custody</h2>
          <p className="mt-1 text-muted-foreground max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">Direct allocation of precious metals without intermediaries.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s) => (
            <Card key={s.n} className="card-3d border-border/70 bg-card shadow-card p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">Step {s.n}</div>
              <h3 className="font-display mt-2 font-semibold text-sm sm:text-base text-foreground">{s.t}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.d}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductHighlight() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-2 md:items-center lg:px-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Fractional Ownership</span>
          <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Fractional Gold Investing,
            <br />
            <span className="text-primary">Accessible From $10.</span>
          </h2>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed sm:text-sm md:text-base">
            Buy and sell digital gold instantly at live market spot rates. Track portfolio growth, adjust allocations, and withdraw funds at any time.
          </p>
          <ul className="mt-5 grid gap-2 text-xs sm:grid-cols-2">
            {[
              "Live market spot pricing",
              "Transparent low custody fees",
              "Instant sell & settlement",
              "100% physically backed reserves",
            ].map((i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-foreground font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-6 shadow-xs">
            <Link to="/invest">Start Investing Now <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>

        <Card className="border-border/70 bg-card shadow-card">
          <CardContent className="p-5 sm:p-6 md:p-8">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sample Portfolio</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald/30 bg-emerald/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                <TrendingUp className="h-3 w-3" /> +8.2% Past Year
              </span>
            </div>
            <div className="font-display mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">$12,840.50</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total weight: 84.20 grams · 100% Allocated</div>

            <div className="relative mt-5 h-32 w-full overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-2">
              <svg viewBox="0 0 400 120" className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <path d="M0,90 L40,80 L80,85 L120,65 L160,70 L200,50 L240,55 L280,35 L320,40 L360,25 L400,15 L400,120 L0,120 Z" fill="url(#chartGrad)" />
                <path d="M0,90 L40,80 L80,85 L120,65 L160,70 L200,50 L240,55 L280,35 L320,40 L360,25 L400,15" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            <div className="mt-4 grid grid-cols-3 border-t border-border/60 pt-3 text-xs">
              <div><div className="text-muted-foreground">1 Day</div><div className="font-semibold text-emerald-500">+0.4%</div></div>
              <div><div className="text-muted-foreground">1 Month</div><div className="font-semibold text-emerald-500">+2.1%</div></div>
              <div><div className="text-muted-foreground">Year to Date</div><div className="font-semibold text-emerald-500">+8.2%</div></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function DeliverySection() {
  return (
    <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
            <img
              src={deliveryTruck}
              alt="Insured armored security courier delivering precious metals"
              width={1280}
              height={832}
              loading="lazy"
              className="h-full w-full object-cover aspect-[4/3]"
            />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Logistics &amp; Security</span>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Insured Protection at Every Step</h2>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed sm:text-sm">
              Whether you store your bars in our global vaults or choose direct delivery, every gram is insured against transit risk and loss by Lloyd's of London.
            </p>
            <div className="mt-5 grid gap-3">
              {[
                { i: Truck, t: "Insured Global Courier Delivery", d: "Dispatched via Brinks, Loomis, and Malca-Amit. Standard delivery in 3–7 business days." },
                { i: Vault, t: "Secure Vault Storage", d: "First-year storage included in Zurich, Dubai, Singapore, and London depository vaults." },
                { i: Award, t: "Serialized Certificates", d: "Receive an authenticated, serialized digital certificate for each minted bar in your custody." },
              ].map(({ i: Icon, t, d }) => (
                <div key={t} className="flex gap-3.5 rounded-xl border border-border/70 bg-card p-4 shadow-2xs transition-colors hover:border-primary/40">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground">{t}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CardSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-2 md:items-center lg:px-8">
        <div className="relative mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-card">
            <img
              src={amiraCardHero}
              alt="Amira Gold Card concept — solid black metal with gold rim"
              width={1280}
              height={832}
              loading="lazy"
              className="h-auto w-full rounded-xl object-contain"
            />
            <div className="mt-3 flex items-center justify-between px-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Amira Gold Metal Debit Card</span>
              <span className="text-[11px] font-semibold text-primary">Pre-Release</span>
            </div>
          </div>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Coming 2026
          </span>
          <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-foreground md:text-4xl">
            Spend Directly From Your Gold Balance.
          </h2>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed sm:text-sm md:text-base">
            The Amira Gold Card converts your allocated gold holdings to local currency at the point of sale. Accepted worldwide across the global Visa network with zero foreign transaction fees.
          </p>

          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {[
              { i: CreditCard, t: "Tap & pay worldwide" },
              { i: Globe, t: "180+ currencies with no FX markup" },
              { i: Wallet, t: "Direct spend from vaulted gold" },
              { i: ShieldCheck, t: "Apple Pay & Google Pay ready" },
            ].map(({ i: Icon, t }) => (
              <li key={t} className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-xs font-medium text-foreground">
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <WaitlistDialog
              trigger={
                <Button size="lg" className="shadow-xs">
                  Join Card Waitlist <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              }
            />
            <span className="text-xs text-muted-foreground">
              <strong className="text-foreground font-semibold">2,400+</strong> investors on the waitlist
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CEOSection() {
  return (
    <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-2xl border border-border/70 bg-card p-6 shadow-card md:grid-cols-[auto_1fr] md:items-center md:p-10">
          <div className="relative mx-auto">
            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-primary/30 shadow-xs sm:h-28 sm:w-28">
              <img
                src={ceoPortrait}
                alt="Amira Aldahab, Founder & CEO"
                width={768}
                height={768}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Executive Message</span>
            <blockquote className="mt-2 text-base italic leading-snug text-foreground sm:text-lg md:text-xl">
              "Gold has safeguarded wealth through centuries of economic cycles. Our commitment is to provide transparent, direct, and secure physical gold custody for modern investors."
            </blockquote>
            <div className="mt-3 font-display font-semibold text-foreground">Amira Aldahab</div>
            <div className="text-xs text-muted-foreground">Founder &amp; Chief Executive Officer, Amira Gold</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    { n: "Sarah K.", role: "London, UK", r: "Clean interface, fast settlement, and fully insured delivery within 4 business days." },
    { n: "Ahmed R.", role: "Dubai, UAE", r: "The vault allocation reports and serial certificate verification provide complete confidence." },
    { n: "Maya T.", role: "Singapore", r: "Started with fractional purchases and built up to standard bars. Very transparent pricing." },
  ];
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Client Feedback</span>
          <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Trusted by Investors Worldwide</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((r) => (
            <Card key={r.n} className="border-border/70 bg-card/90 shadow-card p-5">
              <div className="flex gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-primary" />
                ))}
              </div>
              <p className="mt-3 text-xs text-foreground/90 leading-relaxed">"{r.r}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-border/50 pt-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {r.n[0]}
                </div>
                <div>
                  <div className="font-display text-xs font-semibold text-foreground">{r.n}</div>
                  <div className="text-[11px] text-muted-foreground">{r.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "Is the gold physically allocated in my name?", a: "Yes. Every gram and bar purchased is 100% allocated to you and held directly in your name in audited vault facilities under direct bailment law." },
    { q: "Where are the depository vaults located?", a: "We operate within LBMA-approved vaults located in Zurich, Dubai, Singapore, London, Toronto, and Riyadh. All facilities are fully insured by Lloyd's of London." },
    { q: "How does physical bar delivery work?", a: "You can request insured delivery of your bars at any time. Shipments are handled via specialized armored security carriers including Brinks, Loomis, and Malca-Amit." },
    { q: "What is the minimum amount required to invest?", a: "You can begin investing in fractional gold from as little as $10 at live market spot rates." },
    { q: "How do you verify proof of reserves?", a: "We publish regular, third-party audited Proof of Reserves reports with itemized vault-by-vault holdings reconciled directly with depository records." },
  ];
  return (
    <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Frequently Asked Questions</span>
          <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Answers to Common Questions</h2>
        </div>
        <Accordion type="single" collapsible className="mt-6 space-y-2">
          {items.map((i) => (
            <AccordionItem key={i.q} value={i.q} className="border border-border/70 rounded-xl bg-card px-4">
              <AccordionTrigger className="text-left font-display font-medium text-xs sm:text-sm text-foreground hover:no-underline py-3.5">
                {i.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3.5">
                {i.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-2xl border border-primary/30 bg-card p-6 shadow-card sm:p-10 md:p-12">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Get Started</span>
          <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Start Your Gold Custody Account Today
          </h2>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed sm:text-sm">
            Open an account in minutes. Buy physical bullion bars or fractional gold backed by insured global vaults, with optional doorstep delivery.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-xs font-semibold">
              <Link to="/auth">Open Free Account <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border/70">
              <Link to="/buy">Browse Gold Bars</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
