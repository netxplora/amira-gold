import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail, MessageCircle, Phone, Clock, MapPin,
  CheckCircle2, Shield, ArrowRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Amira Gold" },
      { name: "description", content: "Get in touch with the Amira Gold support and concierge team. Live chat, email, and phone support available 24/7." },
      { property: "og:title", content: "Contact — Amira Gold" },
      { property: "og:description", content: "Reach the Amira Gold team for account, vault, or investment enquiries." },
    ],
  }),
  component: ContactPage,
});

const CHANNELS = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    detail: "24/7 inside your dashboard",
    note: "Average response under 2 minutes",
    href: "/app/support",
    cta: "Open Chat",
    external: false,
  },
  {
    icon: Mail,
    title: "Email Support",
    detail: "support@amiragold.com",
    note: "Replies typically within 1 hour",
    href: "mailto:support@amiragold.com",
    cta: "Send Email",
    external: true,
  },
  {
    icon: Phone,
    title: "Phone",
    detail: "+971 4 000 0000",
    note: "Monday–Friday, 9 am–6 pm GST",
    href: "tel:+97140000000",
    cta: "Call Now",
    external: true,
  },
] as const;

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border/40 bg-gradient-to-b from-card/30 via-background to-background py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Contact Us</span>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            We're Available <span className="text-primary">24 Hours a Day</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground leading-relaxed sm:text-sm">
            Our support team handles general account enquiries, vault questions, delivery tracking, and compliance matters. For investments above $100,000, our Private Wealth desk provides a dedicated service.
          </p>
        </div>
      </section>

      {/* Channel Cards */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {CHANNELS.map(({ icon: Icon, title, detail, note, href, cta, external }) => (
            <Card key={title} className="border-border/70 bg-card shadow-card p-5 sm:p-6 flex flex-col gap-4 transition-all hover:border-primary/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-0.5 text-sm text-foreground/90">{detail}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
              </div>
              {external ? (
                <a
                  href={href}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {cta} <ArrowRight className="h-3 w-3" />
                </a>
              ) : (
                <Link
                  to={href as "/app/support"}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {cta} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </Card>
          ))}
        </div>

        {/* Info strips */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-card">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Always Available</div>
              <div className="text-xs text-muted-foreground">Live chat and automated support operate around the clock, seven days a week.</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-card">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Global Headquarters</div>
              <div className="text-xs text-muted-foreground">Level 42, Dubai International Financial Centre (DIFC), UAE.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form + Private Wealth side-by-side */}
      <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Form */}
            <Card className="border-border/70 bg-card shadow-card p-6 sm:p-8">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="font-display mt-4 text-xl font-bold text-foreground">Message Received</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
                    A member of our support team will respond to your enquiry within one business hour.
                  </p>
                  <Button variant="outline" className="mt-6 border-border/70" onClick={() => setSent(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">Send a Message</span>
                  <h2 className="font-display mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Submit an Enquiry
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use this form for general account, vault, or product questions. Expect a reply within one hour during business hours.
                  </p>
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
                        <Input
                          id="name"
                          required
                          placeholder="Your name"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          className="h-9 text-sm border-border/70 bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          className="h-9 text-sm border-border/70 bg-background"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subject" className="text-xs font-medium">Subject</Label>
                      <Input
                        id="subject"
                        required
                        placeholder="e.g. Delivery enquiry, Account verification…"
                        value={form.subject}
                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                        className="h-9 text-sm border-border/70 bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="message" className="text-xs font-medium">Message</Label>
                      <Textarea
                        id="message"
                        required
                        rows={5}
                        placeholder="Describe your enquiry in detail…"
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                        className="resize-none text-sm border-border/70 bg-background"
                      />
                    </div>
                    <Button type="submit" className="w-full font-semibold shadow-xs">
                      Send Message <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground">
                      By submitting you agree to our{" "}
                      <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
                    </p>
                  </form>
                </>
              )}
            </Card>

            {/* Private Wealth */}
            <div className="flex flex-col gap-4">
              <Card className="border-border/70 bg-card shadow-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="font-display mt-3 text-base font-bold text-foreground">Private Wealth Desk</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  For institutional clients, family offices, and individual purchases exceeding $100,000. Our team provides a dedicated relationship manager, bespoke procurement, and private vault logistics.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                  {[
                    "Dedicated relationship manager",
                    "Custom bar sizing and refining",
                    "Priority vault allocation",
                    "Discrete armored transport",
                    "Bespoke reporting and audits",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-col gap-2">
                  <a
                    href="mailto:privatewealth@amiragold.com"
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" /> Email Private Wealth
                  </a>
                  <a
                    href="tel:+97140000001"
                    className="flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-card px-4 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" /> +971 4 000 0001 (VIP Desk)
                  </a>
                </div>
              </Card>

              <Card className="border-border/70 bg-card shadow-card p-5">
                <h4 className="font-display text-sm font-semibold text-foreground">Office Hours</h4>
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  {[
                    { day: "Monday – Friday", hours: "9:00 am – 6:00 pm GST" },
                    { day: "Saturday", hours: "10:00 am – 2:00 pm GST" },
                    { day: "Sunday", hours: "Closed (chat available)" },
                  ].map(({ day, hours }) => (
                    <div key={day} className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                      <span className="font-medium text-foreground/80">{day}</span>
                      <span>{hours}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
