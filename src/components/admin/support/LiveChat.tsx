import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SupportTicket, SupportMessage } from "@/lib/support/types";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  User,
  Search,
  Check,
  CheckCheck,
  Clock,
  MoreHorizontal,
  Headphones
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function LiveChat() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchActiveTickets = async () => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        user_profile:profiles(full_name, avatar_url),
        department:support_departments(name)
      `)
      .in('status', ['pending', 'active', 'in_progress', 'escalated'])
      .order('last_message_at', { ascending: false });

    if (!error && data) {
      setTickets(data as any);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select(`
        *,
        attachments:support_attachments(*)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as any);
      // Mark as read
      await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('ticket_id', ticketId)
        .eq('sender_role', 'user');
    }
  };

  useEffect(() => {
    fetchActiveTickets();
    const sub = supabase.channel('chat-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchActiveTickets)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  useEffect(() => {
    if (!selectedTicket) return;
    fetchMessages(selectedTicket.id);

    const sub = supabase.channel(`ticket-${selectedTicket.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages', 
        filter: `ticket_id=eq.${selectedTicket.id}` 
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as any]);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [selectedTicket?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !selectedTicket || !input.trim()) return;
    const content = input.trim();
    setInput("");

    const { error } = await supabase.from('support_messages').insert({
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      sender_role: 'admin',
      content,
      type: 'text'
    });

    if (error) {
      console.error(error);
    } else {
      // Update ticket status to in_progress if it was pending
      if (selectedTicket.status === 'pending') {
        await supabase.from('support_tickets').update({ status: 'in_progress' }).eq('id', selectedTicket.id);
      }
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.user_profile?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 h-[calc(100vh-250px)] min-h-[500px] border border-border/60 rounded-xl overflow-hidden bg-card/20 backdrop-blur-sm">
      {/* Sidebar - Chat List */}
      <div className="md:col-span-4 lg:col-span-3 border-r border-border/60 bg-card/40 flex flex-col">
        <div className="p-4 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-9 bg-background/40 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/40">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={cn(
                  "w-full p-4 text-left hover:bg-muted/30 transition-colors flex gap-3",
                  selectedTicket?.id === ticket.id && "bg-muted/50 border-l-2 border-l-gold"
                )}
              >
                <Avatar className="h-10 w-10 border border-border/60">
                  <AvatarImage src={ticket.user_profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-gold text-gold-foreground text-xs">
                    {ticket.user_profile?.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-semibold text-sm truncate">{ticket.user_profile?.full_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(ticket.last_message_at), "HH:mm")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{ticket.subject}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="h-4 text-[9px] px-1 capitalize">
                      {ticket.status}
                    </Badge>
                    {ticket.priority === 'urgent' || ticket.priority === 'VIP' ? (
                      <Badge className="h-4 text-[9px] px-1 bg-red-500/20 text-red-500 border-red-500/30">
                        {ticket.priority}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="md:col-span-8 lg:col-span-9 flex flex-col bg-background/20">
        {selectedTicket ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border/60 bg-card/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border/60">
                  <AvatarImage src={selectedTicket.user_profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-gold text-gold-foreground">
                    {selectedTicket.user_profile?.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm leading-none">{selectedTicket.user_profile?.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">Subject: {selectedTicket.subject}</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                    <span className="text-[10px] text-gold font-medium uppercase tracking-wider">
                      {(selectedTicket as any).department?.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Clock className="h-3 w-3" /> History
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              {messages.map((msg, idx) => {
                const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'system';
                const showTime = idx === 0 || 
                  new Date(msg.created_at).getTime() - new Date(messages[idx-1].created_at).getTime() > 1000 * 60 * 30;

                return (
                  <div key={msg.id} className="space-y-2">
                    {showTime && (
                      <div className="flex justify-center">
                        <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                          {format(new Date(msg.created_at), "MMM d, HH:mm")}
                        </span>
                      </div>
                    )}
                    <div className={cn("flex", isAdmin ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "flex gap-3 max-w-[75%]",
                        isAdmin ? "flex-row-reverse" : "flex-row"
                      )}>
                        {!isAdmin && (
                          <Avatar className="h-8 w-8 mt-1 border border-border/60">
                            <AvatarImage src={selectedTicket.user_profile?.avatar_url} />
                            <AvatarFallback>{selectedTicket.user_profile?.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="space-y-1">
                          <div className={cn(
                            "rounded-2xl p-3 text-sm leading-relaxed shadow-sm relative",
                            isAdmin 
                              ? "bg-gradient-gold text-gold-foreground rounded-tr-none" 
                              : "bg-card border border-border/60 rounded-tl-none"
                          )}>
                            {msg.content}
                            {msg.type === 'system' && (
                              <div className="text-[10px] italic opacity-70 mt-1 border-t border-white/10 pt-1">
                                System Notification
                              </div>
                            )}
                          </div>
                          <div className={cn(
                            "flex items-center gap-1.5 px-1",
                            isAdmin ? "justify-end" : "justify-start"
                          )}>
                            <span className="text-[9px] text-muted-foreground">
                              {format(new Date(msg.created_at), "HH:mm")}
                            </span>
                            {isAdmin && (
                              msg.is_read ? <CheckCheck className="h-3 w-3 text-blue-500" /> : <Check className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border/60 bg-card/60 backdrop-blur-md">
              <div className="flex items-end gap-3 bg-background/60 p-2 rounded-xl border border-border/40">
                <div className="flex gap-1 mb-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-gold">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-gold">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <textarea 
                    rows={1}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 resize-none outline-none"
                    placeholder="Type your reply here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </div>
                <Button 
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="bg-gradient-gold text-gold-foreground h-9 px-4 rounded-lg shadow-lg shadow-gold/10"
                >
                  <Send className="h-4 w-4 mr-2" /> Send
                </Button>
              </div>
              <div className="flex justify-between items-center mt-2 px-1">
                <div className="flex gap-3">
                  <button className="text-[10px] text-muted-foreground hover:text-gold flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Insert Template
                  </button>
                </div>
                <span className="text-[10px] text-muted-foreground italic">Press Enter to send</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-6 border border-border/40">
              <Headphones className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2 font-display">Select a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Choose a support ticket from the list on the left to start communicating with the user in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
