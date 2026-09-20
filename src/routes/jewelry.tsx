import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FeaturedJewelry } from "@/components/FeaturedJewelry";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Truck, Award, ArrowRight, CheckCircle2 } from "lucide-react";
import heroBg from "@/assets/hero-bg-luxury.jpg";

export const Route = createFileRoute("/jewelry")({
  head: () => ({
    meta: [
      { title: "Fine Jewelry Marketplace — Amira Gold" },
      { name: "description", content: "Browse and purchase authenticated fine gold jewelry, crafted in 18k to 24k solid gold and priced against live market spot rates." },
      { property: "og:title", content: "Fine Jewelry Marketplace — Amira Gold" },
      { property: "og:description", content: "Authenticated solid gold jewelry priced against live market rates." },
    ],
  }),
  component: JewelryPage,
});

function JewelryPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-card/40 via-background to-background py-14 sm:py-24">
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Award className="h-3.5 w-3.5" /> Solid Gold Jewelry
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Fine Gold Jewelry,<br />
            <span className="text-primary">Priced at Live Spot Rates</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-xs text-muted-foreground leading-relaxed sm:text-sm md:text-base">
            Explore handcrafted rings, chains, bracelets, and pendants crafted in certified 18k, 21k, 22k, and 24k gold, backed by verifiable assays and secure insured delivery.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="shadow-xs font-semibold">
              <Link to="/app/marketplace">Explore Marketplace <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border/70">
              <a href="#standards">The Amira Standard</a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Authenticated Purity</span>
            <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-primary" /> Certified Assays</span>
            <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-primary" /> Fully Insured Transit</span>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <div>
        <FeaturedJewelry />
      </div>

      {/* The Amira Standard */}
      <section id="standards" className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center sm:mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Quality Assurance</span>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">The Amira Standard</h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed sm:text-sm max-w-xl mx-auto">
              Our principles for fine precious metal jewelry craftsmanship, verification, and insured logistics.
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Award,
                title: "Certified Gold Purity",
                description: "Every item is weighed, assayed, and stamped for exact karat specification (18k to 24k) with independent gemological certificates."
              },
              {
                icon: ShieldCheck,
                title: "Spot-Linked Transparent Pricing",
                description: "Jewelry prices fluctuate dynamically with the international gold spot price, ensuring fair fabrication margins and total transparency."
              },
              {
                icon: Truck,
                title: "Insured Armored Logistics",
                description: "Dispatched via specialized precious metal couriers with discrete security packaging and mandatory recipient signature verification."
              }
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="card-3d border-border/70 bg-card p-5 sm:p-6 transition-all">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display mt-3 text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Craftsmanship Section */}
      <section className="border-t border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Artisanship</span>
              <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Meticulous Precious Metal Craft</h2>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed sm:text-sm">
                Every piece in our marketplace is created by master goldsmiths combining classical hand-finishing with modern casting precision.
              </p>
              <ul className="mt-6 space-y-3 text-xs sm:text-sm">
                {[
                  { title: "Solid Gold Base", desc: "No hollow fills or plating. Crafted exclusively from solid gold alloys." },
                  { title: "Ethical Sourcing", desc: "Precious metals sourced from LBMA-compliant and conflict-free supply chains." },
                  { title: "Multi-Point Assay Check", desc: "Precision optical emission spectroscopy testing on every manufactured batch." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">{item.title}:</span>{" "}
                      <span className="text-muted-foreground text-xs">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Card className="card-3d border-border/70 bg-card p-6 sm:p-8">
                <div className="space-y-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">Custom Commissions</span>
                  <h3 className="font-display text-xl font-bold text-foreground">Bespoke Jewelry Orders</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    For custom designs, engagement sets, or bespoke family heirlooms, our private client concierge assists with CAD modeling, stone sourcing, and hand fabrication.
                  </p>
                  <Button asChild className="w-full shadow-xs font-semibold">
                    <Link to="/contact">Inquire About Custom Pieces <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <Card className="border-border/70 bg-card p-8 sm:p-12 shadow-card">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Start Browsing</span>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Access the Full Jewelry Marketplace</h2>
            <p className="mx-auto mt-2 max-w-lg text-xs text-muted-foreground leading-relaxed sm:text-sm">
              Sign in to your account to view live inventory, compare weights and spot premiums, and place orders with insured delivery.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="shadow-xs font-semibold">
                <Link to="/auth">Sign In / Register <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border/70">
                <Link to="/buy">View Bullion Bars</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
