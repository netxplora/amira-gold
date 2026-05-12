import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageCircle, Phone, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Amira Gold" },
      { name: "description", content: "Get in touch with the Amira Gold team. Live chat, email and phone support 24/7." },
      { property: "og:title", content: "Contact — Amira Gold" },
      { property: "og:description", content: "Get in touch with the Amira Gold team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden bg-mesh-luxury py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Get in touch</span>
          <h1 className="mt-3 text-4xl font-bold md:text-6xl">
            We're <span className="text-gradient-gold">here 24/7</span>
          </h1>
          <p className="mt-4 text-muted-foreground">Talk to a real human about your gold, your account, or anything else.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { i: MessageCircle, t: "Live Chat", d: "Available 24/7 inside your dashboard.", a: "Open chat" },
            { i: Mail, t: "Email", d: "support@amiragold.com", a: "Typically replies within 1 hour" },
            { i: Phone, t: "Phone", d: "+971 4 000 0000", a: "Mon–Fri, 9am–6pm GST" },
          ].map(({ i: Icon, t, d, a }) => (
            <Card key={t} className="group border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground shadow-gold">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-1 text-sm">{d}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-5">
            <Clock className="h-5 w-5 text-gold" />
            <div>
              <div className="text-sm font-medium">Always on</div>
              <div className="text-xs text-muted-foreground">Markets and chat support never sleep.</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-5">
            <MapPin className="h-5 w-5 text-gold" />
            <div>
              <div className="text-sm font-medium">Headquartered in Dubai</div>
              <div className="text-xs text-muted-foreground">Serving customers globally.</div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
