import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { ShieldCheck, Mail, Globe2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The trusted way to buy, store, and invest in physical gold —
              backed 1:1 by allocated bullion in LBMA-certified vaults.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" /> LBMA-Certified
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1">
                <Globe2 className="h-3.5 w-3.5 text-gold" /> 4 Vaults Worldwide
              </span>
            </div>
          </div>
          <div className="md:col-span-2">
            <h4 className="mb-3 text-sm font-semibold">Products</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/buy" className="hover:text-foreground">Buy Gold</Link></li>
              <li><Link to="/invest" className="hover:text-foreground">Invest</Link></li>
              <li><Link to="/proof-of-reserves" className="hover:text-foreground">Reserves</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="mb-3 text-sm font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Terms &amp; Conditions</Link></li>
              <li><Link to="/aml-policy" className="hover:text-foreground">AML Policy</Link></li>
              <li><Link to="/aml-compliance" className="hover:text-foreground">AML Compliance</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="mb-3 text-sm font-semibold">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gold" /><span>support@amiragold.com</span></li>
              <li className="text-xs">24/7 live chat in app</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Amira Gold. All rights reserved.</span>
          <span className="text-muted-foreground/70">Gold is a long-term store of value. Prices fluctuate; capital at risk.</span>
        </div>
      </div>
    </footer>
  );
}
