import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { GoldPriceTicker } from "@/components/GoldPriceTicker";
import { CommandPalette } from "@/components/CommandPalette";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MiniCart } from "@/components/MiniCart";
import {
  LayoutDashboard, ShoppingBag, TrendingUp, Vault, Wallet, Award, LogOut, Shield, Receipt, Bell, ShieldCheck, Bitcoin, MessageCircle, UserCog, Menu, X, Home, Gem, CreditCard, BellRing,
} from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

type NavItem = { to: "/app" | "/app/buy" | "/app/marketplace" | "/app/jewelry-orders" | "/app/card" | "/app/invest" | "/app/holdings" | "/app/wallet" | "/app/crypto" | "/app/certificates" | "/app/orders" | "/app/notifications" | "/app/alerts" | "/app/kyc" | "/app/profile" | "/app/support"; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const navItems: NavItem[] = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/buy", label: "Buy Gold", icon: ShoppingBag },
  { to: "/app/marketplace", label: "Jewelry", icon: Gem },
  { to: "/app/jewelry-orders", label: "Jewelry Orders", icon: Receipt },
  { to: "/app/card", label: "Amira Card", icon: CreditCard },
  { to: "/app/invest", label: "Invest", icon: TrendingUp },
  { to: "/app/holdings", label: "Holdings", icon: Vault },
  { to: "/app/orders", label: "Orders", icon: Receipt },
  { to: "/app/wallet", label: "Wallet", icon: Wallet },
  { to: "/app/crypto", label: "Crypto", icon: Bitcoin },
  { to: "/app/certificates", label: "Certificates", icon: Award },
  { to: "/app/support", label: "Support", icon: MessageCircle },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/alerts", label: "Price Alerts", icon: BellRing },
  { to: "/app/kyc", label: "Verify ID", icon: ShieldCheck },
  { to: "/app/profile", label: "Profile", icon: UserCog },
];

function AppLayout() {
  const { user, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [unread, setUnread] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [loc.pathname]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = () => supabase
      .from("notifications").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).eq("read", false)
      .then(({ count }) => setUnread(count ?? 0));
    load();
    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen bg-background bg-mesh-luxury">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/50 bg-sidebar/80 p-4 backdrop-blur md:flex">
        <Logo />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((i) => {
            const active = i.exact ? loc.pathname === i.to : loc.pathname.startsWith(i.to);
            const Icon = i.icon;
            const showBadge = i.to === "/app/notifications" && unread > 0;
            return (
              <Link
                key={i.to}
                to={i.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                  active
                    ? "bg-gradient-gold text-gold-foreground shadow-gold"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "" : "group-hover:text-gold"}`} />
                <span className="flex-1">{i.label}</span>
                {showBadge && (
                  <span className="rounded-full bg-ruby px-1.5 py-0.5 text-[10px] font-bold text-ruby-foreground">{unread}</span>
                )}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin" className="mt-4 flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/5 px-3 py-2 text-sm text-gold hover:bg-gold/10">
              <Shield className="h-4 w-4" /> Admin Console
            </Link>
          )}
        </nav>
        <div className="mt-4 rounded-xl border border-border/60 bg-card/60 p-3 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground">Need help?</div>
          <p className="mt-1">Live chat with our concierge — replies in minutes.</p>
          <Link to="/app/support" className="mt-2 inline-flex items-center gap-1 text-gold hover:underline">
            Open chat →
          </Link>
        </div>
        <div className="mt-3">
          <ThemeToggle variant="inline" />
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="mt-3 justify-start">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border/60 bg-sidebar p-4 shadow-2xl animate-in slide-in-from-left">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setDrawerOpen(false)} className="rounded-full p-2 hover:bg-accent" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-xs">
              <div className="text-muted-foreground">Signed in</div>
              <div className="truncate font-medium">{user.email}</div>
            </div>
            <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
              <Link
                to="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Home className="h-4 w-4" /> Home
              </Link>
              {navItems.map((i) => {
                const active = i.exact ? loc.pathname === i.to : loc.pathname.startsWith(i.to);
                const Icon = i.icon;
                const showBadge = i.to === "/app/notifications" && unread > 0;
                return (
                  <Link
                    key={i.to}
                    to={i.to}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active ? "bg-gradient-gold text-gold-foreground shadow-gold" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{i.label}</span>
                    {showBadge && (
                      <span className="rounded-full bg-ruby px-1.5 py-0.5 text-[10px] font-bold text-ruby-foreground">{unread}</span>
                    )}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link to="/admin" className="mt-3 flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/5 px-3 py-2.5 text-sm text-gold hover:bg-gold/10">
                  <Shield className="h-4 w-4" /> Admin Console
                </Link>
              )}
            </nav>
            <div className="mt-3 border-t border-border/50 pt-3">
              <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Theme</div>
              <ThemeToggle variant="inline" />
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="mt-3 justify-start">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </aside>
        </div>
      )}

      <main className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/70 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/40"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <Logo size="sm" />
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <GoldPriceTicker compact />
          </div>
          <div className="flex items-center gap-3">
            <CommandPalette />
            <MiniCart />
            <ThemeToggle />
            <Link to="/app/notifications" className="relative rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ruby px-1 text-[9px] font-bold text-ruby-foreground">
                  {unread}
                </span>
              )}
            </Link>
            <div className="hidden text-right text-xs sm:block">
              <div className="text-muted-foreground">Signed in</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} className="md:hidden"><LogOut className="h-4 w-4" /></Button>
          </div>
        </header>
        <div className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
          <Outlet />
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-card/95 backdrop-blur md:hidden">
          <div className="grid grid-cols-5">
            {navItems.slice(0, 5).map((i) => {
              const active = i.exact ? loc.pathname === i.to : loc.pathname.startsWith(i.to);
              const Icon = i.icon;
              return (
                <Link key={i.to} to={i.to} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${active ? "text-gold" : "text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                  {i.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
