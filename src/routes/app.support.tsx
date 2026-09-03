import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Headphones, Clock, Check, CheckCheck, Paperclip, Shield, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SupportTicket, SupportMessage } from "@/lib/support/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/support")({ component: SupportPage });

function SupportPage() {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchActiveTicket = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["pending", "active", "in_progress", "escalated"])
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setTicket(data as any);
      const { data: msgs } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", data.id)
        .order("created_at", { ascending: true });
      setMessages((msgs ?? []) as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveTicket();
  }, [user]);

  useEffect(() => {
    if (!ticket) return;
    const ch = supabase.channel(`ticket-${ticket.id}`)
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "support_messages", 
        filter: `ticket_id=eq.${ticket.id}` 
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as any]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [ticket?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startNewTicket = async (subject: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject,
        status: "pending",
        priority: "medium"
      })
      .select()
      .single();

    if (error) return toast.error(error.message);
    setTicket(data as any);
    setMessages([]);
  };

  const send = async () => {
    if (!user || !ticket || !input.trim()) return;
    const content = input.trim();
    setInput("");
    
    const { error } = await supabase.from("support_messages").insert({ 
      ticket_id: ticket.id, 
      sender_id: user.id, 
      sender_role: "user", 
      content,
      type: "text"
    });

    if (error) toast.error(error.message);
  };

  const quickReplies = [
    "How do I complete ID verification?",
    "When will my physical delivery arrive?",
    "How do crypto deposits work?",
    "Assistance with account withdrawal",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Direct Assistance"
        title="Client Support"
        subtitle="Connect with our bullion custody support desk for assistance with orders, allocations, or account queries."
        icon={<Headphones className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Main Area */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-border/70 bg-card shadow-card flex flex-col h-[70vh]">
            <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    AG
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500 shadow-2xs" />
                </div>
                <div>
                  <div className="font-display text-sm font-semibold tracking-tight text-foreground">Amira Custody Support</div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Representatives Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {ticket && (
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Ticket</span>
                    <span className="text-xs font-mono text-foreground font-semibold">#{ticket.id.slice(0, 8)}</span>
                  </div>
                )}
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">SECURE</span>
              </div>
            </div>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5 scroll-smooth">
                {!ticket ? (
                  <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4 py-8">
                    <div className="h-14 w-14 rounded-xl border border-primary/20 bg-primary/10 flex items-center justify-center text-primary">
                      <MessageCircle className="h-7 w-7" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-display text-base font-semibold text-foreground">Start a Conversation</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Our support team is available to assist you. Select a topic below or type your inquiry.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      {quickReplies.map((q) => (
                        <button
                          key={q}
                          onClick={() => startNewTicket(q)}
                          className="rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-4">
                      <span className="text-[10px] text-muted-foreground bg-muted/40 px-3 py-1 rounded-full uppercase tracking-wider font-semibold border border-border/50">
                        Inquiry opened {format(new Date(ticket.created_at), "PPP")}
                      </span>
                    </div>
                    {messages.map((m) => {
                      const isUser = m.sender_role === "user";
                      return (
                        <div key={m.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                          <div className={cn("flex gap-2.5 max-w-[80%]", isUser ? "flex-row-reverse" : "flex-row")}>
                            {!isUser && (
                              <div className="h-7 w-7 rounded-lg border border-primary/20 bg-primary/10 shrink-0 flex items-center justify-center text-primary font-bold text-[10px]">AG</div>
                            )}
                            <div className="space-y-1">
                              <div className={cn(
                                "rounded-xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed",
                                isUser 
                                  ? "bg-primary text-primary-foreground font-medium rounded-tr-none" 
                                  : "border border-border/70 bg-muted/30 text-foreground rounded-tl-none"
                              )}>
                                {m.content}
                              </div>
                              <div className={cn("flex items-center gap-1.5 px-1", isUser ? "justify-end" : "justify-start")}>
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(m.created_at), "HH:mm")}
                                </span>
                                {isUser && (
                                  m.is_read ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              
              <div className="p-3.5 border-t border-border/50 bg-background/50">
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (!ticket) startNewTicket(input || "General Inquiry");
                    else send(); 
                  }} 
                  className="flex gap-2 bg-card p-1.5 rounded-xl border border-border/70 shadow-2xs"
                >
                  <Input 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Type your message…" 
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 h-9 text-xs shadow-none"
                  />
                  <Button 
                    type="submit" 
                    disabled={!input.trim() && !ticket} 
                    className="h-9 px-4 text-xs font-semibold shadow-xs"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" /> {ticket ? "Send" : "Start"}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card className="border-border/70 bg-card shadow-card p-5 space-y-4">
            <h4 className="font-display font-semibold text-sm border-b border-border/40 pb-2 text-foreground">Support Hours & Standards</h4>
            <div className="space-y-3.5">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Rapid Response</div>
                  <p className="text-[11px] text-muted-foreground">General inquiries typically answered in under 5 minutes during operating hours.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Custody Specialists</div>
                  <p className="text-[11px] text-muted-foreground">Direct assistance with bar allocations, audit certificates, and insured transit.</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-border/70 bg-card shadow-card p-5 space-y-3">
            <h4 className="font-display font-semibold text-sm text-foreground">Institutional & VIP Desk</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Clients holding allocations over $100,000 have access to a dedicated relationship manager and custom settlement options.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full border-border/70 text-xs font-medium">
              <a href="mailto:privatewealth@amiragold.com">Contact Private Wealth</a>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
