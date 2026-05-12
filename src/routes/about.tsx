import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Target, Users, Globe2 } from "lucide-react";
import ceoPortrait from "@/assets/ceo-portrait.jpg";
import vaultInterior from "@/assets/vault-interior.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Amira Gold — Our Mission" },
      { name: "description", content: "Amira Gold's mission is to make gold ownership simple, secure, and accessible globally." },
      { property: "og:title", content: "About Amira Gold" },
      { property: "og:description", content: "Our mission: simple, secure, accessible gold ownership." },
      { property: "og:image", content: vaultInterior },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden bg-mesh-luxury py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">About</span>
          <h1 className="mt-3 text-4xl font-bold md:text-6xl">
            Real gold,<br /><span className="text-gradient-gold">made accessible.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Amira Gold is the world's most trusted and accessible gold ownership platform.
            We let individuals and institutions buy, store, invest, and transact with gold seamlessly.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { i: Target, t: "Our Mission", d: "Make gold ownership simple, secure, and accessible globally." },
            { i: Award, t: "LBMA-Certified", d: "Every bar meets the London Bullion Market Association standard." },
            { i: Users, t: "12,400+ investors", d: "Trusted by individuals and institutions across 40+ countries." },
            { i: Globe2, t: "4 vaults", d: "Zurich, Dubai, Singapore and London — fully insured." },
          ].map(({ i: Icon, t, d }) => (
            <Card key={t} className="border-border/60 bg-card">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground shadow-gold">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="grid gap-10 rounded-3xl border border-border/60 bg-card/50 p-10 md:grid-cols-[auto_1fr] md:items-center md:p-14">
          <div className="relative mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-gold opacity-30 blur-2xl" />
            <div className="relative h-40 w-40 overflow-hidden rounded-full ring-2 ring-gold/40">
              <img src={ceoPortrait} alt="Amira Aldahab, Founder & CEO" loading="lazy" className="h-full w-full object-cover" />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">Leadership</span>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">Founded by Amira Aldahab</h2>
            <p className="mt-3 text-muted-foreground">
              Our team brings together decades of experience in precious metals, fintech, and security.
              We believe everyone — not just institutions — deserves access to allocated, insured physical gold.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
