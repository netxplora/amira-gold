import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketManager } from "@/components/admin/support/TicketManager";
import { LiveChat } from "@/components/admin/support/LiveChat";
import { SupportAnalytics } from "@/components/admin/support/SupportAnalytics";
import { Headphones, MessageSquare, BarChart3, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/support")({
  component: AdminSupportPage,
});

function AdminSupportPage() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [counts, setCounts] = useState({ pending: 0, active: 0, unread: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const [
        { count: pending },
        { count: active },
        { count: unread }
      ] = await Promise.all([
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('support_messages').select('*', { count: 'exact', head: true }).eq('is_read', false).eq('sender_role', 'user')
      ]);

      setCounts({
        pending: pending || 0,
        active: active || 0,
        unread: unread || 0
      });
    };

    fetchCounts();

    // Realtime listener for counts
    const channel = supabase.channel('support-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Support Center" 
        subtitle="Manage user inquiries, live chat, and support performance"
        icon={<Headphones className="h-6 w-6 text-gold" />}
      />

      <Tabs defaultValue="tickets" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-background/60 backdrop-blur">
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tickets
              {counts.pending > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] text-gold-foreground">
                  {counts.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="live-chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Live Chat
              {counts.unread > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald text-[10px] text-emerald-foreground">
                  {counts.unread}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tickets" className="space-y-4">
          <TicketManager />
        </TabsContent>

        <TabsContent value="live-chat" className="space-y-4">
          <LiveChat />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <SupportAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
