import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Sparkles, Headphones, Clock, Check, CheckCheck, Paperclip } from "lucide-react";
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
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'active', 'in_progress', 'escalated'])
      .order('last_message_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setTicket(data as any);
      const { data: msgs } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', data.id)
        .order('created_at', { ascending: true });
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
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        status: 'pending',
        priority: 'medium'
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
      type: 'text'
    });

    if (error) toast.error(error.message);
  };

  const quickReplies = [
    "How do I verify my account?",
    "When will my gold be delivered?",
    "How do crypto deposits work?",
    "I need help with a withdrawal",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Concierge"
        title="Support Center"
        subtitle="Experience production-grade real-time support from our elite concierge team."
        icon={<Headphones className="h-6 w-6 text-gold" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Main Area */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-border/60 bg-card/40 backdrop-blur-md shadow-xl flex flex-col h-[70vh]">
            <div className="flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-gold/10 to-transparent px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-11 w-11 rounded-full bg-gradient-gold flex items-center justify-center text-gold-foreground font-bold text-lg shadow-gold/20">
                    A
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500 shadow-sm" />
                </div>
                <div>
                  <div className="text-sm font-bold tracking-tight">Amira Concierge</div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] text-emerald-500 font-medium">Ready to assist</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {ticket && (
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Ticket ID</span>
                    <span className="text-xs font-mono text-gold">#{ticket.id.slice(0, 8)}</span>
                  </div>
                )}
                <span className="rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gold">SECURE</span>
              </div>
            </div>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-6 scroll-smooth">
                {!ticket ? (
                  <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-6">
                    <div className="h-20 w-20 rounded-full bg-gold/10 flex items-center justify-center text-gold border border-gold/20 shadow-inner">
                      <Sparkles className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold">Start a new conversation</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Our support team is online and ready to help. Choose a common topic below or type your message.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      {quickReplies.map((q) => (
                        <button
                          key={q}
                          onClick={() => startNewTicket(q)}
                          className="rounded-full border border-border/40 bg-background/40 px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-gold hover:bg-gold/10 hover:text-foreground active:scale-95"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-4">
                      <span className="text-[10px] text-muted-foreground bg-muted/30 px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-border/40">
                        Conversation started {format(new Date(ticket.created_at), "PPP")}
                      </span>
                    </div>
                    {messages.map((m, idx) => {
                      const isUser = m.sender_role === "user";
                      return (
                        <div key={m.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                          <div className={cn("flex gap-3 max-w-[80%]", isUser ? "flex-row-reverse" : "flex-row")}>
                            {!isUser && (
                              <div className="h-8 w-8 rounded-full bg-gradient-gold shrink-0 flex items-center justify-center text-gold-foreground font-bold text-[10px]">A</div>
                            )}
                            <div className="space-y-1">
                              <div className={cn(
                                "rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed",
                                isUser 
                                  ? "bg-gradient-gold text-gold-foreground rounded-tr-none" 
                                  : "border border-border/60 bg-accent/40 text-foreground rounded-tl-none backdrop-blur-sm"
                              )}>
                                {m.content}
                              </div>
                              <div className={cn("flex items-center gap-1.5 px-1", isUser ? "justify-end" : "justify-start")}>
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(m.created_at), "HH:mm")}
                                </span>
                                {isUser && (
                                  m.is_read ? <CheckCheck className="h-3.5 w-3.5 text-blue-500" /> : <Check className="h-3.5 w-3.5 text-muted-foreground" />
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
              
              <div className="p-4 border-t border-border/50 bg-background/30 backdrop-blur-xl">
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (!ticket) startNewTicket(input || "General Inquiry");
                    else send(); 
                  }} 
                  className="flex gap-3 bg-background/60 p-2 rounded-2xl border border-border/40 shadow-inner"
                >
                  <div className="flex items-center px-1">
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-gold transition-colors">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </div>
                  <Input 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Type your message here..." 
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 h-10 text-sm shadow-none"
                  />
                  <Button 
                    type="submit" 
                    disabled={!input.trim() && !ticket} 
                    className="h-10 bg-gradient-gold px-6 text-gold-foreground hover:shadow-gold/20 shadow-lg rounded-xl transition-all active:scale-95"
                  >
                    <Send className="h-4 w-4 mr-2" /> {ticket ? "Send" : "Start"}
                  </Button>
                </form>
                <p className="mt-2 text-[10px] text-center text-muted-foreground italic">
                  End-to-end encrypted with Amira Security Protocol v2.4
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="bg-card/40 border-border/60">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-bold text-sm border-b border-border/40 pb-2">Support Highlights</h4>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Fast Response</div>
                    <p className="text-[10px] text-muted-foreground">Typical reply time is under 5 minutes during business hours.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <Headphones className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Expert Agents</div>
                    <p className="text-[10px] text-muted-foreground">Our concierge team is trained in high-value asset management.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-gold text-gold-foreground border-none">
            <CardContent className="p-6 text-center space-y-3">
              <Sparkles className="h-8 w-8 mx-auto opacity-80" />
              <h4 className="font-bold text-sm">Priority Support</h4>
              <p className="text-xs opacity-90 leading-relaxed">
                VIP members receive instant escalation and dedicated account managers.
              </p>
              <Button variant="secondary" size="sm" className="w-full bg-white/20 hover:bg-white/30 border-none text-white text-xs font-bold">
                Learn About VIP
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
