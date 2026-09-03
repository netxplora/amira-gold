import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { to: "/buy", label: "Buy Gold" },
  { to: "/invest", label: "Invest" },
  { to: "/jewelry", label: "Jewelry" },
  { to: "/proof-of-reserves", label: "Reserves" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/60 px-2 py-1 shadow-xs md:flex">
          {navItems.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-accent/70"
              activeProps={{ className: "bg-accent text-foreground font-semibold shadow-xs" }}
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {user ? (
            <Button asChild className="rounded-full shadow-sm">
              <Link to="/app">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="rounded-full text-sm">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild className="rounded-full shadow-sm">
                <Link to="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-card/60 transition-colors hover:bg-accent"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden animate-fade-in">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {navItems.map((i) => (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                activeProps={{ className: "bg-accent text-foreground font-semibold" }}
              >
                {i.label}
              </Link>
            ))}
            <Link
              to={user ? "/app" : "/auth"}
              onClick={() => setOpen(false)}
              className="mt-3 rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
            >
              {user ? "Open Dashboard" : "Sign In / Register"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
