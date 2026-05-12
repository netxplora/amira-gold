import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { Sparkles, CheckCircle2, CreditCard, Globe2, ShieldCheck, Zap, Wallet, ArrowRight } from "lucide-react";
import amiraCard from "@/assets/amira-card.jpg";

export const Route = createFileRoute("/app/card")({
  component: CardPage,
});

function CardPage() {
  const { user } = useAuth();
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    supabase.from("card_waitlist").select("id", { count: "exact", head: true }).eq("email", user.email)
      .then(({ count }) => setJoined((count ?? 0) > 0));
  }, [user]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Coming Soon"
        title="The Amira Gold Card"
        subtitle="Spend your gold like cash. Earn rewards in real gold. The world's first card backed by allocated bullion."
        icon={<CreditCard className="h-6 w-6" />}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Card visual */}
        <Card className="relative overflow-hidden border-border/60 bg-card">
          <div className="absolute inset-0" style={{ backgroundImage: `url(${amiraCard})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0 bg-gradient-to-br from-background/30 via-background/10 to-background/80" />
          <CardContent className="relative z-10 flex min-h-[360px] flex-col justify-end p-8">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold">
              <Sparkles className="h-3 w-3" /> Limited Early Access
            </div>
            <h2 className="mt-4 text-2xl font-bold md:text-3xl">A card backed by real gold</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">Tap, swipe, or pay online — anywhere Visa is accepted. Your spending is auto-converted from your gold balance at the live spot price.</p>
          </CardContent>
        </Card>

        {/* Waitlist CTA */}
        <Card className="border-gold/30 bg-card/80">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
              <Sparkles className="h-3.5 w-3.5" /> Join the waitlist
            </div>
            <h3 className="mt-3 text-2xl font-bold">Be first in line</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We're rolling out the Amira Gold Card in waves. Waitlist members get priority access, founder-tier pricing, and a complimentary 0.1g of physical gold on activation.
            </p>

            <div className="mt-5 space-y-2.5 text-sm">
              {[
                "Priority early access",
                "Founder-tier pricing — locked for life",
                "0.1g physical gold welcome gift",
                "No setup fee",
              ].map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              {joined ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">You're on the waitlist</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">We'll email you the moment your spot opens.</p>
                </div>
              ) : (
                <WaitlistDialog
                  trigger={
                    <Button size="lg" className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
                      <Sparkles className="mr-2 h-4 w-4" /> Join the waitlist
                    </Button>
                  }
                />
              )}
            </div>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">No spam. We'll only email about the card launch.</p>
          </CardContent>
        </Card>
      </section>

      {/* Benefits */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Why the Amira Card</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Benefit icon={Wallet} title="Spend gold instantly" body="Pay in any currency. We auto-convert from your gold balance at the live spot price." />
          <Benefit icon={Zap} title="No FX surprises" body="Transparent conversion. No hidden fees. The mid-market rate, every time." />
          <Benefit icon={Globe2} title="Accepted worldwide" body="Tap, chip, contactless and online — anywhere Visa is accepted." />
          <Benefit icon={ShieldCheck} title="Insured & allocated" body="Your gold sits in vaulted, insured, fully allocated reserves — not an IOU." />
        </div>
      </section>

      {/* Cross-sell */}
      <Card className="border-border/60 bg-card/80">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h3 className="text-lg font-semibold">No gold yet?</h3>
            <p className="text-sm text-muted-foreground">Buy your first gram in under a minute.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/app/buy">Buy gold <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Benefit({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <Card className="border-border/60 bg-card transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-gold">
      <CardContent className="p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground shadow-gold">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-3 font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}