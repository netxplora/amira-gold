import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FeaturedJewelry } from "@/components/FeaturedJewelry";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck, Award, ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg-luxury.jpg";

export const Route = createFileRoute("/jewelry")({
  head: () => ({
    meta: [
      { title: "Fine Jewelry Marketplace | Amira Gold" },
      { name: "description", content: "Browse and purchase authenticated fine jewelry, crafted with high-quality gold and precious stones. Secure delivery and certification included." },
    ],
  }),
  component: JewelryPage,
});

function JewelryPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
          aria-hidden
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/95 via-background/80 to-background" aria-hidden />
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center md:py-32">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Exclusive Collection</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
            Fine jewelry,
            <br />
            <span className="text-gradient-gold">crafted for generations.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Browse our curated marketplace of rings, necklaces, and bracelets. Each piece is crafted with certified 18k to 24k gold and independently authenticated.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg" className="rounded-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Link to="/app/jewelry-orders">View Collection</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-border/60 bg-card/40 backdrop-blur">
              <a href="#how-it-works">Learn More</a>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-gold" /> Authenticated Pieces</span>
            <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-gold" /> Certified Materials</span>
            <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-gold" /> Insured Delivery</span>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <div className="py-10">
        <FeaturedJewelry />
      </div>

      {/* Value Proposition / How it works */}
      <section id="how-it-works" className="bg-card/30 py-20 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">The Amira Standard</h2>
            <p className="mt-3 text-muted-foreground">Our commitment to quality, security, and transparency.</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Award,
                title: "Certified Quality",
                description: "Every item in our marketplace is inspected and certified by independent gemologists and precious metal experts."
              },
              {
                icon: ShieldCheck,
                title: "Secure Purchasing",
                description: "Pay securely using bank transfer, credit card, or digital currency. Your funds are protected until delivery is confirmed."
              },
              {
                icon: Truck,
                title: "Insured Delivery",
                description: "All orders are shipped via secure, fully-insured logistics partners with signature required upon delivery."
              }
            ].map((feature, idx) => (
              <div key={idx} className="rounded-2xl border border-border/50 bg-background p-8 text-center transition-all hover:border-gold/40 hover:shadow-gold">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground shadow-gold">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Craftsmanship Section */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl font-bold">Uncompromising Craftsmanship</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Every piece in the Amira Gold marketplace is selected for its exceptional quality and design. Our partner artisans combine traditional techniques with modern precision to create jewelry that stands the test of time.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { title: "Pure Gold Foundation", desc: "Crafted exclusively using 18k, 22k, and 24k gold, ensuring lasting value and durability." },
                  { title: "Ethical Sourcing", desc: "All precious metals and stones are strictly sourced from conflict-free, LBMA-approved origins." },
                  { title: "Meticulous Inspection", desc: "A rigorous quality control process guarantees that every clasp, setting, and polish meets our exacting standards." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                      <div className="h-2 w-2 rounded-full bg-gold" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2">
              <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/50 bg-card p-2">
                <div className="absolute inset-0 mix-blend-overlay bg-mesh-luxury opacity-40" />
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-background to-card">
                  <div className="text-center">
                    <Award className="mx-auto h-16 w-16 text-gold/40" />
                    <p className="mt-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">Master Artisans</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Concierge Service */}
      <section className="border-t border-border/40 bg-card/30 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald">Private Client</span>
          <h2 className="mt-3 text-3xl font-bold">Bespoke Concierge & Custom Commissions</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Looking for something entirely unique? Our Private Client concierge team assists high-net-worth individuals, family offices, and discerning collectors in designing and sourcing custom, one-of-a-kind pieces.
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 text-left md:grid-cols-3">
             {[
               { title: "Consultation", desc: "Begin with a private consultation with our master jewelers to discuss your vision, preferred materials, and budget requirements." },
               { title: "Design & Sourcing", desc: "We provide detailed 3D CAD renderings and source the finest, ethically-mined precious stones and high-karat gold globally to match your specifications." },
               { title: "Creation & Delivery", desc: "Your piece is hand-crafted by master artisans in our partner ateliers, independently certified, and securely delivered via armored transport." }
             ].map((step, i) => (
                <div key={i} className="rounded-2xl border border-border/50 bg-background p-6">
                  <div className="mb-2 text-sm font-bold text-emerald">Phase {i + 1}</div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                </div>
             ))}
          </div>
          <div className="mt-12">
            <Button asChild variant="outline" size="lg" className="rounded-full border-border/60 bg-background hover:bg-accent">
              <Link to="/contact">Contact Private Client Team</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-4 py-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-card to-background p-12 text-center">
          <div className="absolute inset-0 bg-mesh-luxury opacity-30" />
          <div className="relative">
            <h2 className="text-3xl font-bold">Ready to make a purchase?</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Sign in to browse the complete catalog, check pricing, and place your order securely.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
              <Link to="/auth">Sign In to Continue <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
