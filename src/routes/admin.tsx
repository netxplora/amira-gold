import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, Package, Vault, Truck, Users, 
  ArrowLeft, ShieldCheck, Bitcoin, MessageCircle, 
  Send, Sparkles, BarChart3, FileCheck2, ShoppingBag, 
  Gem, Menu, X, HelpCircle, Receipt, Activity, 
  Settings, Database, FileCode, History, Headphones
} from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type AdminNav = { 
  to: string; 
  label: string; 
  icon: typeof LayoutDashboard; 
  exact?: boolean 
};

const items: AdminNav[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/system-health", label: "System Health", icon: Activity },
  { to: "/admin/configs", label: "Registry", icon: Settings },
  { to: "/admin/config-versions", label: "Audit Trail", icon: History },
  { to: "/admin/config-backups", label: "Backups", icon: Database },
  { to: "/admin/seed-exports", label: "Seed Engine", icon: FileCode },
  { to: "/admin/products", label: "Gold Products", icon: Package },
  { to: "/admin/marketplace", label: "Jewelry", icon: Gem },
  { to: "/admin/jewelry-orders", label: "Jewelry Orders", icon: Receipt },
  { to: "/admin/vaults", label: "Vaults", icon: Vault },
  { to: "/admin/couriers", label: "Couriers", icon: Send },
  { to: "/admin/orders", label: "Orders", icon: Truck },
  { to: "/admin/crypto", label: "Crypto", icon: Bitcoin },
  { to: "/admin/providers", label: "Crypto Providers", icon: ShoppingBag },
  { to: "/admin/kyc", label: "KYC Review", icon: ShieldCheck },
  { to: "/admin/audits", label: "Audit Log", icon: FileCheck2 },
  { to: "/admin/support", label: "Support Center", icon: Headphones },
  { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/waitlist", label: "Card Waitlist", icon: Sparkles },
];

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [loc.pathname]);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/app" });
  }, [user, isAdmin, loading, navigate]);

  if (loading || !user || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Checking access…</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/50 bg-sidebar p-4 md:flex">
        <Logo />
        <div className="mt-2 inline-flex w-fit items-center rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">Admin</div>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {items.map((i) => {
            const active = i.exact ? loc.pathname === i.to : loc.pathname.startsWith(i.to);
            const Icon = i.icon;
            return (
              <Link key={i.to} to={i.to} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-gradient-gold text-gold-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                <Icon className="h-4 w-4" /> {i.label}
              </Link>
            );
          })}
        </nav>
        <Button asChild variant="ghost" size="sm" className="justify-start">
          <Link to="/app"><ArrowLeft className="mr-2 h-4 w-4" /> Back to app</Link>
        </Button>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in" onClick={() => setDrawerOpen(false)} aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border/60 bg-sidebar p-4 shadow-2xl animate-in slide-in-from-left">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setDrawerOpen(false)} className="rounded-full p-2 hover:bg-accent" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-2 inline-flex w-fit items-center rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">Admin Console</div>
            <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
              {items.map((i) => {
                const active = i.exact ? loc.pathname === i.to : loc.pathname.startsWith(i.to);
                const Icon = i.icon;
                return (
                  <Link key={i.to} to={i.to} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-gradient-gold text-gold-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                    <Icon className="h-4 w-4" /> {i.label}
                  </Link>
                );
              })}
              <Link to="/app" className="mt-3 flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to app
              </Link>
            </nav>
            <div className="mt-3 border-t border-border/50 pt-3"><ThemeToggle variant="inline" /></div>
          </aside>
        </div>
      )}

      <main className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-background/70 px-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawerOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/40" aria-label="Open menu"><Menu className="h-4 w-4" /></button>
            <Logo size="sm" />
            <span className="rounded-full border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-gold">Admin</span>
          </div>
          <ThemeToggle />
        </header>
        <div className="flex-1 p-4 md:p-8">
          <div className="mb-4 hidden justify-end md:flex"><CommandPalette /></div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
