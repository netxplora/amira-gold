import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  X, 
  Search, 
  ChevronLeft, 
  Send, 
  ChevronDown, 
  Headphones, 
  Sparkles, 
  Paperclip,
  Image as ImageIcon,
  Check,
  CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SupportTicket, SupportMessage, SupportDepartment } from "@/lib/support/types";
import { supportService } from "@/lib/support/support-service";

type Faq = { id: string; category: string; question: string; answer: string };
type Mode = "faq" | "answer" | "chat" | "new-ticket";

export function SupportWidget() {
  const { user } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("faq");
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [search, setSearch] = useState("");
  const [activeFaq, setActiveFaq] = useState<Faq | null>(null);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [departments, setDepartments] = useState<SupportDepartment[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hide on admin console — admins use the dedicated /admin/support
  const hide = loc.pathname.startsWith("/admin") || loc.pathname.startsWith("/auth");

  // Load FAQs + Departments
  useEffect(() => {
    if (!open) return;
    
    if (!faqs.length) {
      supabase.from("faqs").select("id,category,question,answer").eq("active", true).order("priority", { ascending: false })
        .then(({ data }) => setFaqs((data ?? []) as Faq[]));
    }

    if (!departments.length) {
      supabase.from('support_departments').select('*').order('name')
        .then(({ data }) => setDepartments((data ?? []) as SupportDepartment[]));
    }
  }, [open]);

  // Load user's active ticket
  useEffect(() => {
    if (!user || !open) return;
    
    const fetchActiveTicket = async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          department:support_departments(name)
        `)
        .eq('user_id', user.id)
        .in('status', ['pending', 'active', 'in_progress', 'escalated'])
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setActiveTicket(data as any);
      }
    };

    fetchActiveTicket();
  }, [user, open]);

  // Load unread count
  useEffect(() => {
    if (!user) return;
    
    const fetchUnread = async () => {
      const count = await supportService.getUnreadCount(user.id);
      setUnreadCount(count);
    };

    fetchUnread();

    const ch = supabase.channel('unread-support-messages').on("postgres_changes",
      { event: "*", schema: "public", table: "support_messages" },
      () => {
        fetchUnread();
      }).subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // Load + subscribe to messages
  useEffect(() => {
    if (mode !== "chat" || !activeTicket) return;
    
    supabase.from("support_messages").select("*").eq("ticket_id", activeTicket.id).order("created_at")
      .then(({ data }) => setMessages((data ?? []) as SupportMessage[]));

    const ch = supabase.channel(`ticket-${activeTicket.id}`).on("postgres_changes",
      { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${activeTicket.id}` },
      (payload) => {
        setMessages((m) => [...m, payload.new as SupportMessage]);
      }).subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [mode, activeTicket?.id]);

  // Mark messages as read
  useEffect(() => {
    if (mode === "chat" && activeTicket && user) {
      supportService.markMessagesAsRead(activeTicket.id, user.id);
    }
  }, [mode, activeTicket?.id, messages.length, user?.id]);

  // Auto-scroll
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, mode]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
  }, [search, faqs]);

  const grouped = useMemo(() => {
    const map = new Map<string, Faq[]>();
    filtered.forEach((f) => {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const startSupport = async () => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    if (activeTicket) {
      setMode("chat");
    } else {
      setMode("new-ticket");
    }
  };

  const createTicket = async () => {
    if (!user || !ticketSubject.trim()) return;
    
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: ticketSubject.trim(),
        department_id: selectedDept || null,
        status: 'pending',
        priority: 'medium'
      })
      .select()
      .single();

    if (!error && ticket) {
      setActiveTicket(ticket as any);
      setMode("chat");
    }
  };

  const send = async () => {
    if (!user || !activeTicket || !input.trim()) return;
    const body = input.trim();
    setInput("");
    
    await supabase.from("support_messages").insert({ 
      ticket_id: activeTicket.id, 
      sender_id: user.id, 
      sender_role: "user", 
      content: body,
      type: 'text'
    });
  };

  if (hide) return null;

  return (
    <>
      {/* Floating button */}
      <button
        aria-label="Open support"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-5 md:right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-gold transition-all hover:scale-105",
          "bg-gradient-gold text-gold-foreground",
          open && "rotate-90"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-40 right-4 md:bottom-24 md:right-5 z-50 w-[calc(100vw-2rem)] max-w-[380px] origin-bottom-right overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl backdrop-blur transition-all",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
        style={{ height: "min(560px, calc(100vh - 12rem))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-gold/15 via-card to-card px-4 py-3">
          <div className="flex items-center gap-2">
            {mode !== "faq" && (
              <button onClick={() => { setMode("faq"); setActiveFaq(null); }} className="rounded p-1 hover:bg-accent">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground">
              {mode === "chat" ? <Headphones className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>
            <div>
              <div className="text-sm font-semibold">
                {mode === "chat" ? "Live Support" : mode === "new-ticket" ? "New Ticket" : mode === "answer" ? "FAQ" : "How can we help?"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {mode === "chat" ? "Avg reply: under 5 min" : "Search frequent questions"}
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-accent" aria-label="Close">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        {mode === "faq" && (
          <div className="flex h-[calc(100%-3.5rem)] flex-col">
            <div className="border-b border-border/40 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions…" className="pl-8" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {grouped.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">No matching FAQs.</p>
              )}
              {grouped.map(([cat, items]) => (
                <div key={cat} className="mb-3">
                  <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-gold">{cat}</div>
                  <ul className="space-y-1">
                    {items.map((f) => (
                      <li key={f.id}>
                        <button
                          onClick={() => { setActiveFaq(f); setMode("answer"); }}
                          className="w-full rounded-lg border border-border/40 bg-background/40 p-2.5 text-left text-xs hover:border-gold/40 hover:bg-gold/5"
                        >
                          {f.question}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-border/40 p-3">
              <Button onClick={startSupport} className="w-full bg-gradient-emerald text-emerald-foreground hover:opacity-90">
                <Headphones className="mr-2 h-4 w-4" /> {activeTicket ? "Continue Chat" : "Chat with support"}
              </Button>
            </div>
          </div>
        )}

        {mode === "new-ticket" && (
          <div className="flex h-[calc(100%-3.5rem)] flex-col p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gold">Subject</label>
              <Input 
                placeholder="What do you need help with?" 
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gold">Department (Optional)</label>
              <select 
                className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 ring-gold"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">General Support</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex-1" />
            <Button onClick={createTicket} disabled={!ticketSubject.trim()} className="w-full bg-gradient-gold text-gold-foreground">
              Start Conversation
            </Button>
          </div>
        )}

        {mode === "answer" && activeFaq && (
          <div className="flex h-[calc(100%-3.5rem)] flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gold">{activeFaq.category}</div>
              <h3 className="mt-1 font-display text-base font-semibold">{activeFaq.question}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{activeFaq.answer}</p>
            </div>
            <div className="border-t border-border/40 p-3">
              <p className="mb-2 text-center text-[11px] text-muted-foreground">Did this answer your question?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => setMode("faq")}>Yes, thanks</Button>
                <Button size="sm" onClick={startSupport} className="bg-gradient-emerald text-emerald-foreground">No, chat now</Button>
              </div>
            </div>
          </div>
        )}

        {mode === "chat" && (
          <div className="flex h-[calc(100%-3.5rem)] flex-col">
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth">
              {messages.length === 0 && (
                <div className="rounded-xl border border-border/40 bg-background/40 p-4 text-xs text-muted-foreground leading-relaxed">
                  <div className="font-semibold text-gold mb-1">Ticket #{activeTicket?.id.slice(0, 8)}</div>
                  Hi! Tell us more about your issue and our support team will get back to you shortly.
                </div>
              )}
              {messages.map((m) => {
                const own = m.sender_role === "user";
                return (
                  <div key={m.id} className={cn("flex flex-col", own ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed shadow-sm",
                        own ? "bg-gradient-gold text-gold-foreground rounded-tr-none" : "border border-border/40 bg-background/60 rounded-tl-none"
                      )}
                    >
                      <div>{m.content}</div>
                      <div className={cn("mt-1.5 flex items-center gap-1.5 text-[9px]", own ? "text-gold-foreground/70" : "text-muted-foreground")}>
                        {format(new Date(m.created_at), "HH:mm")}
                        {own && (
                          m.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border/40 p-3 bg-background/20">
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Type your message…" 
                    className="bg-background/60 pr-10"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button type="button" className="p-1 text-muted-foreground hover:text-gold">
                      <Paperclip className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <Button type="submit" size="icon" disabled={!input.trim()} className="bg-gradient-gold text-gold-foreground shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}