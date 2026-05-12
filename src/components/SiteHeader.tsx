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
  { to: "/proof-of-reserves", label: "Reserves" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-1 rounded-full border border-border/50 bg-card/40 px-2 py-1.5 md:flex">
          {navItems.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              className="rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold rounded-full">
              <Link to="/app">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="rounded-full">
                <Link to="/auth">Login</Link>
              </Button>
              <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold rounded-full">
                <Link to="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/40"
            onClick={() => setOpen((o) => !o)}
            aria-label="menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/50 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {navItems.map((i) => (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm hover:bg-accent"
              >
                {i.label}
              </Link>
            ))}
            <Link
              to={user ? "/app" : "/auth"}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-gradient-gold px-3 py-2.5 text-center text-sm font-medium text-gold-foreground shadow-gold"
            >
              {user ? "Open Dashboard" : "Login / Sign up"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
