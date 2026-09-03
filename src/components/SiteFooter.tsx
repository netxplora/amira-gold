import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { ShieldCheck, Mail, Globe2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              The trusted way to buy, store, and invest in physical gold —
              backed 1:1 by allocated bullion in LBMA-certified vaults.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 shadow-2xs font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> LBMA-Certified
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 shadow-2xs font-medium">
                <Globe2 className="h-3.5 w-3.5 text-primary" /> Global Vault Network
              </span>
            </div>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-display mb-3 text-sm font-semibold tracking-tight text-foreground">Products</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/buy" className="hover:text-foreground transition-colors">Buy Gold</Link></li>
              <li><Link to="/invest" className="hover:text-foreground transition-colors">Invest</Link></li>
              <li><Link to="/jewelry" className="hover:text-foreground transition-colors">Jewelry</Link></li>
              <li><Link to="/proof-of-reserves" className="hover:text-foreground transition-colors">Reserves</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-display mb-3 text-sm font-semibold tracking-tight text-foreground">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-display mb-3 text-sm font-semibold tracking-tight text-foreground">Legal</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link to="/aml-policy" className="hover:text-foreground transition-colors">AML Policy</Link></li>
              <li><Link to="/aml-compliance" className="hover:text-foreground transition-colors">AML Compliance</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-display mb-3 text-sm font-semibold tracking-tight text-foreground">Contact</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span>support@amiragold.com</span></li>
              <li className="text-xs leading-relaxed text-muted-foreground/90">24/7 dedicated customer assistance in-app</li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Amira Gold. All rights reserved.</span>
          <span className="text-muted-foreground/80">Gold is a long-term store of value. Market values fluctuate based on international spot prices.</span>
        </div>
      </div>
    </footer>
  );
}
