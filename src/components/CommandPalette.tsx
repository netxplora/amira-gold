import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, ShoppingBag, TrendingUp, Vault, Wallet, Award, Receipt, Bell, ShieldCheck, Bitcoin,
  MessageCircle, UserCog, Shield, Users, Truck, Sparkles, BarChart3, FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

type Item = { label: string; icon: any; to: string; group: string; keywords?: string };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => { setOpen(false); navigate({ to: to as any }); };

  const userItems: Item[] = [
    { label: "Overview", icon: LayoutDashboard, to: "/app", group: "Dashboard" },
    { label: "Buy Gold", icon: ShoppingBag, to: "/app/buy", group: "Dashboard", keywords: "purchase order" },
    { label: "Invest / Sell", icon: TrendingUp, to: "/app/invest", group: "Dashboard" },
    { label: "Holdings", icon: Vault, to: "/app/holdings", group: "Dashboard" },
    { label: "Orders", icon: Receipt, to: "/app/orders", group: "Dashboard" },
    { label: "Wallet", icon: Wallet, to: "/app/wallet", group: "Dashboard", keywords: "balance" },
    { label: "Crypto Deposit / Withdraw", icon: Bitcoin, to: "/app/crypto", group: "Dashboard" },
    { label: "Certificates", icon: Award, to: "/app/certificates", group: "Dashboard" },
    { label: "Support / Live Chat", icon: MessageCircle, to: "/app/support", group: "Dashboard" },
    { label: "Notifications", icon: Bell, to: "/app/notifications", group: "Dashboard" },
    { label: "Verify ID (KYC)", icon: ShieldCheck, to: "/app/kyc", group: "Dashboard" },
    { label: "Profile & Settings", icon: UserCog, to: "/app/profile", group: "Dashboard" },
  ];
  const publicItems: Item[] = [
    { label: "About", icon: Sparkles, to: "/about", group: "Public" },
    { label: "Buy Gold (Public)", icon: ShoppingBag, to: "/buy", group: "Public" },
    { label: "Invest", icon: TrendingUp, to: "/invest", group: "Public" },
    { label: "Proof of Reserves", icon: FileText, to: "/proof-of-reserves", group: "Public" },
    { label: "Insurance Tiers", icon: ShieldCheck, to: "/insurance", group: "Public" },
    { label: "AML Compliance", icon: Shield, to: "/aml-compliance", group: "Public" },
    { label: "Contact", icon: MessageCircle, to: "/contact", group: "Public" },
  ];
  const adminItems: Item[] = isAdmin ? [
    { label: "Admin Overview", icon: BarChart3, to: "/admin", group: "Admin" },
    { label: "Users", icon: Users, to: "/admin/users", group: "Admin" },
    { label: "Orders", icon: Receipt, to: "/admin/orders", group: "Admin" },
    { label: "KYC Review", icon: ShieldCheck, to: "/admin/kyc", group: "Admin" },
    { label: "Crypto Approvals", icon: Bitcoin, to: "/admin/crypto", group: "Admin" },
    { label: "Vaults", icon: Vault, to: "/admin/vaults", group: "Admin" },
    { label: "Products", icon: ShoppingBag, to: "/admin/products", group: "Admin" },
    { label: "Couriers", icon: Truck, to: "/admin/couriers", group: "Admin" },
    { label: "Support Center", icon: MessageCircle, to: "/admin/support", group: "Admin" },
    { label: "Card Waitlist", icon: Sparkles, to: "/admin/waitlist", group: "Admin" },
  ] : [];

  const groups = [
    { name: "Dashboard", items: userItems },
    { name: "Admin", items: adminItems },
    { name: "Public", items: publicItems },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 text-xs text-muted-foreground hover:border-gold/40 hover:text-foreground md:flex"
        aria-label="Open command palette"
      >
        <span>Search…</span>
        <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Jump to a page or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((g, gi) => (
            <div key={g.name}>
              {gi > 0 && <CommandSeparator />}
              <CommandGroup heading={g.name}>
                {g.items.map((i) => (
                  <CommandItem key={i.to} value={`${i.label} ${i.keywords ?? ""}`} onSelect={() => go(i.to)}>
                    <i.icon className="mr-2 h-4 w-4" />
                    {i.label}
                    <CommandShortcut>↵</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
