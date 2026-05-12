import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GoldPriceTicker } from "@/components/GoldPriceTicker";
import { Flag, VAULT_LOCATIONS } from "@/components/Flag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ShieldCheck, Vault, Truck, TrendingUp, Award, CheckCircle2, Sparkles, ArrowRight, Star,
  CreditCard, Globe, Wallet,
} from "lucide-react";
import heroGold from "@/assets/hero-gold-premium.jpg";
import vaultInterior from "@/assets/vault-interior.jpg";
import ceoPortrait from "@/assets/ceo-portrait.jpg";
import deliveryTruck from "@/assets/delivery-truck.jpg";
import heroBg from "@/assets/hero-bg-luxury.jpg";
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
      { name: "description", content: "Buy LBMA-certified physical gold bars, invest in fractional digital gold from $10, and store in insured vaults across Zurich, Dubai, Singapore and London." },
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
      <VaultsStrip />
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
  return (
    <section className="relative overflow-hidden">
      {/* Hero background image */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background/95 via-background/80 to-background/60" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-mesh-luxury opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-emerald/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 -top-20 h-96 w-96 rounded-full bg-gold/20 blur-[120px]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-2 md:gap-16 md:py-28">
        <div className="flex flex-col justify-center">
          <GoldPriceTicker />
          <h1 className="mt-6 text-4xl font-bold leading-[1.04] tracking-tight md:text-6xl">
            Own real gold.
            <br />
            <span className="text-gradient-gold">Stored. Insured.</span>
            <br />
            <span className="text-gradient-silver">Yours.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Buy physical gold bars from 1g to 100g, invest in fractional digital
            gold from <span className="text-foreground font-medium">$10</span>, and store securely in
            <span className="text-foreground font-medium"> Zurich, Dubai, Riyadh, Singapore</span> and
            <span className="text-foreground font-medium"> London</span>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90 rounded-full">
              <Link to="/buy">Buy Gold <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-border/60 bg-card/40 backdrop-blur">
              <Link to="/invest"><Sparkles className="mr-1 h-4 w-4 text-gold" /> Start Investing</Link>
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground">
            <Stat label="Under custody" value="$84M+" />
            <Stat label="Active investors" value="12,400+" />
            <Stat label="Avg. delivery" value="3–7 days" />
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-gold opacity-15 blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl border border-border/60 ring-gold-soft">
            <img
              src={heroGold}
              alt="Premium gold bars stacked on dark marble with red velvet accent"
              width={1920}
              height={1280}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-background/95 via-background/70 to-transparent p-5">
              <div>
                <div className="text-xs uppercase tracking-widest text-gold">Allocated Physical Gold</div>
                <div className="mt-1 text-sm font-medium">999.9 fineness · LBMA approved</div>
              </div>
              <span className="rounded-full bg-gradient-silver px-3 py-1 text-xs font-semibold text-silver-foreground">Audited</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xl font-bold text-foreground md:text-2xl">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider">{label}</div>
    </div>
  );
}

function TrustBar() {
  const items = ["LBMA-Certified", "Insured by Lloyd's", "ISO 27001", "SOC 2 Type II", "Audited Reserves"];
  return (
    <div className="border-y border-border/40 bg-card/20 py-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {items.map((i) => (<span key={i} className="opacity-80">{i}</span>))}
      </div>
    </div>
  );
}

function VaultsStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Global Vaults</span>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">Stored in the world's most secure jurisdictions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Six LBMA-approved facilities across four continents. Fully insured by Lloyd's of London.</p>
        </div>
        <Link to="/proof-of-reserves" className="text-sm text-muted-foreground hover:text-foreground">View Proof of Reserves →</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VAULT_LOCATIONS.map((v) => (
          <Card key={v.code} className="group relative overflow-hidden border-border/60 bg-card p-0 transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold">
            <div className="relative h-40 w-full overflow-hidden">
              <img
                src={VAULT_IMAGES[v.code] ?? vaultInterior}
                alt={`${v.city}, ${v.country} vault location`}
                width={1024}
                height={768}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute left-4 top-4">
                <Flag code={v.code} className="h-7 w-10 text-2xl shadow-lg" />
              </div>
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-emerald/30 bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald backdrop-blur">
                <ShieldCheck className="h-3 w-3" /> Insured
              </span>
            </div>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between">
                <div className="font-semibold">{v.city}</div>
                <div className="text-xs text-muted-foreground">{v.country}</div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{v.desc}</p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gold">
                <Vault className="h-3.5 w-3.5" /> LBMA-approved facility
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Create your account", d: "Sign up in 60 seconds with email or Google." },
    { n: "02", t: "Verify your identity", d: "Quick and secure KYC, fully encrypted." },
    { n: "03", t: "Fund your wallet", d: "Top up via card, bank or crypto." },
    { n: "04", t: "Buy your gold", d: "Choose grams or full bars at spot price." },
    { n: "05", t: "Store or deliver", d: "Vault storage or insured doorstep delivery." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="mb-12 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Simple Process</span>
        <h2 className="mt-2 text-3xl font-bold md:text-4xl">From signup to gold in minutes</h2>
        <p className="mt-3 text-muted-foreground">No paperwork. No middlemen. Just real gold.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {steps.map((s) => (
          <Card key={s.n} className="group relative overflow-hidden border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold">
            <div className="absolute right-3 top-3 text-5xl font-bold text-gold/10 transition-colors group-hover:text-gold/20">{s.n}</div>
            <CardContent className="relative p-6">
              <div className="text-gradient-gold text-sm font-bold">Step {s.n}</div>
              <h3 className="mt-2 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ProductHighlight() {
  return (
    <section className="relative overflow-hidden bg-card/30 py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-2 md:items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Invest</span>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Fractional gold investing,
            <br />
            <span className="text-gradient-gold">made simple.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start with as little as $10. Buy and sell digital gold instantly at the live spot price.
            Track performance, build your portfolio, withdraw anytime.
          </p>
          <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            {["Live spot pricing", "Zero hidden fees", "Sell back instantly", "Backed 1:1 by physical gold"].map((i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-gold" /> {i}
              </li>
            ))}
          </ul>
          <Button asChild className="mt-8 rounded-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
            <Link to="/invest">Start investing <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <Card className="relative overflow-hidden border-border/60 bg-background ring-gold-soft">
          <CardContent className="p-8">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-sm">Sample portfolio</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                <TrendingUp className="h-3 w-3" /> +8.2%
              </span>
            </div>
            <div className="mt-4 text-5xl font-bold text-gradient-gold">$12,840.50</div>
            <div className="text-sm text-muted-foreground">past 12 months · 84.2 g held</div>
            <div className="relative mt-8 h-40 overflow-hidden rounded-xl bg-gradient-to-tr from-gold/10 via-transparent to-ruby/5">
              <svg viewBox="0 0 400 160" className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.14 84)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="oklch(0.78 0.14 84)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,120 L40,100 L80,110 L120,80 L160,90 L200,60 L240,70 L280,40 L320,50 L360,30 L400,20 L400,160 L0,160 Z" fill="url(#grad)" />
                <path d="M0,120 L40,100 L80,110 L120,80 L160,90 L200,60 L240,70 L280,40 L320,50 L360,30 L400,20" fill="none" stroke="oklch(0.78 0.14 84)" strokeWidth="2" />
              </svg>
            </div>
            <div className="mt-4 grid grid-cols-3 border-t border-border/50 pt-4 text-xs">
              <div><div className="text-muted-foreground">1D</div><div className="text-emerald-400">+0.4%</div></div>
              <div><div className="text-muted-foreground">1M</div><div className="text-emerald-400">+2.1%</div></div>
              <div><div className="text-muted-foreground">YTD</div><div className="text-emerald-400">+8.2%</div></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function DeliverySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="relative overflow-hidden rounded-3xl border border-border/60">
          <img
            src={deliveryTruck}
            alt="Insured armored security courier truck delivering precious metals"
            width={1280}
            height={832}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Storage & Delivery</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Insured every step of the way</h2>
          <p className="mt-3 text-muted-foreground">
            Whether you store in a vault or take physical delivery, every gram is fully insured by Lloyd's of London.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-1">
            {[
              { i: Truck, t: "Insured delivery", d: "Brinks, Loomis & Malca-Amit. 3–7 business days globally." },
              { i: Vault, t: "Vault storage", d: "Free first-year storage in Dubai, Zurich, Singapore or London vaults." },
              { i: Award, t: "Certificates", d: "Receive a serialized PDF certificate for every bar you own." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="flex gap-4 rounded-xl border border-border/60 bg-card/60 p-5 transition-colors hover:border-gold/40">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground shadow-gold">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CardSection() {
  return (
    <section className="relative overflow-hidden border-y border-border/40 bg-gradient-to-br from-card/60 via-background to-background py-24">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-gold/15 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-emerald/15 blur-[140px]" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-2 md:items-center">
        {/* Animated tilting card mockup */}
        <div className="relative mx-auto w-full max-w-md [perspective:1200px]">
          <div className="absolute -inset-10 rounded-[2rem] bg-gradient-gold opacity-20 blur-3xl" />
          <div className="group relative aspect-[1.586/1] w-full transition-transform duration-700 ease-out [transform-style:preserve-3d] hover:[transform:rotateY(-8deg)_rotateX(6deg)_scale(1.02)]">
            {/* Card image */}
            <img
              src={amiraCardHero}
              alt="Amira Gold Card concept — black metal with gold rim and emerald accent"
              width={1280}
              height={832}
              loading="lazy"
              className="absolute inset-0 h-full w-full rounded-3xl object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.6)]"
            />
            {/* Overlayed text on card */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-7 [transform:translateZ(40px)]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold/90">Amira</div>
                  <div className="font-display text-lg font-semibold text-foreground/95">Gold Card</div>
                </div>
                <span className="rounded-full border border-emerald/40 bg-emerald/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-emerald backdrop-blur">
                  Concept
                </span>
              </div>
              <div>
                <div className="font-mono text-sm tracking-[0.35em] text-foreground/85">•••• •••• •••• 8417</div>
                <div className="mt-3 flex items-end justify-between text-[10px] uppercase tracking-widest text-foreground/70">
                  <div>
                    <div className="opacity-70">Member</div>
                    <div className="mt-0.5 text-foreground/90">A. Aldahab</div>
                  </div>
                  <div className="text-right">
                    <div className="opacity-70">Exp</div>
                    <div className="mt-0.5 font-mono text-foreground/90">12/30</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Subtle shine */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute -inset-1 animate-shimmer opacity-30" />
            </div>
          </div>

          <div className="relative mt-6 flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px w-8 bg-border" />
            Concept render · Hover to tilt
            <span className="h-px w-8 bg-border" />
          </div>
        </div>

        {/* Copy + waitlist CTA */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald">
            <Sparkles className="h-3.5 w-3.5" /> Coming 2026
          </span>
          <h2 className="mt-4 text-3xl font-bold md:text-5xl">
            Spend your gold,
            <br />
            <span className="text-gradient-gold">anywhere.</span>
          </h2>
          <p className="mt-5 max-w-lg text-muted-foreground">
            The Amira Gold Card converts your allocated gold to local currency at
            the point of sale — accepted everywhere Visa is. No conversion fees,
            no holding cash, no inflation drag.
          </p>

          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              { i: CreditCard, t: "Tap & pay globally" },
              { i: Globe, t: "180+ currencies, no FX fees" },
              { i: Wallet, t: "Spend directly from gold" },
              { i: ShieldCheck, t: "Apple Pay & Google Pay" },
            ].map(({ i: Icon, t }) => (
              <li key={t} className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-sm">
                <Icon className="h-4 w-4 text-gold" /> {t}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <WaitlistDialog
              trigger={
                <Button size="lg" className="rounded-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
                  Join the Waitlist <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              }
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex -space-x-2">
                {["A", "M", "J", "K"].map((c, i) => (
                  <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border border-background bg-gradient-gold text-[10px] font-bold text-gold-foreground">{c}</div>
                ))}
              </div>
              <span><span className="font-semibold text-foreground">2,400+</span> on the waitlist</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CEOSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <div className="grid gap-10 rounded-3xl border border-border/60 bg-gradient-to-br from-card to-background p-10 md:grid-cols-[auto_1fr] md:items-center md:p-14">
        <div className="relative mx-auto">
          <div className="absolute inset-0 rounded-full bg-gradient-gold opacity-30 blur-2xl" />
          <div className="relative h-32 w-32 overflow-hidden rounded-full ring-2 ring-gold/40">
            <img src={ceoPortrait} alt="Amira Aldahab, Founder & CEO" width={768} height={768} loading="lazy" className="h-full w-full object-cover" />
          </div>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Founder Letter</span>
          <blockquote className="mt-3 text-xl italic leading-snug text-foreground md:text-2xl">
            "Gold has protected wealth for thousands of years. Our mission is to make
            owning real gold simple, secure, and accessible to everyone."
          </blockquote>
          <div className="mt-4 font-semibold">Amira Aldahab</div>
          <div className="text-sm text-muted-foreground">Founder & CEO, Amira Gold</div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    { n: "Sarah K.", role: "London, UK", r: "Smoothest gold buying experience I've had. Delivered in 4 days." },
    { n: "Ahmed R.", role: "Dubai, UAE", r: "Love the vault storage. Feel completely secure with my holdings." },
    { n: "Maya T.", role: "Singapore", r: "Started with $50, now I check my gold portfolio every morning." },
  ];
  return (
    <section className="bg-card/30 py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Reviews</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Trusted by gold owners worldwide</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <Card key={r.n} className="border-border/60 bg-background transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold">
              <CardContent className="p-6">
                <div className="flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="h-4 w-4 fill-current" />))}
                </div>
                <p className="mt-4 text-sm leading-relaxed">"{r.r}"</p>
                <div className="mt-5 flex items-center gap-3 border-t border-border/50 pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold text-sm font-bold text-gold-foreground">
                    {r.n[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{r.n}</div>
                    <div className="text-xs text-muted-foreground">{r.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "Is my gold really mine?", a: "Yes. Every gram you buy is allocated to you and stored in your name. You can request delivery anytime." },
    { q: "Where is the gold stored?", a: "In LBMA-approved vaults in Zurich, Dubai, Singapore and London. Fully insured by Lloyd's of London." },
    { q: "How fast is delivery?", a: "Insured courier delivery typically takes 3–7 business days globally via Brinks, Loomis or Malca-Amit." },
    { q: "What's the minimum to invest?", a: "You can start investing in fractional digital gold from just $10. Buy and sell at the live spot price." },
    { q: "How do you prove the gold exists?", a: "We publish an audited Proof of Reserves with vault-by-vault holdings updated regularly." },
  ];
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">FAQ</span>
        <h2 className="mt-2 text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
      </div>
      <Accordion type="single" collapsible className="mt-10">
        {items.map((i) => (
          <AccordionItem key={i.q} value={i.q} className="border-border/50">
            <AccordionTrigger className="text-left hover:text-gold">{i.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{i.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-4 pb-20">
      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-gold/30 p-10 md:p-16"
        style={{
          backgroundImage: `linear-gradient(110deg, oklch(0.18 0.012 250) 0%, oklch(0.18 0.012 250 / 0.85) 50%, transparent 100%), url(${vaultInterior})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold md:text-4xl">Start owning real gold today</h2>
          <p className="mt-3 text-muted-foreground">No paperwork. Buy in minutes. Stored in insured vaults — or shipped to your door.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Link to="/auth">Open Account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-border/60 bg-card/60 backdrop-blur">
              <Link to="/buy">Browse Gold Bars</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
