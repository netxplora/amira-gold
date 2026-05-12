import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

type Notif = { id: string; title: string; body: string | null; read: boolean; created_at: string };

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("id,title,body,read,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data ?? []) as Notif[]);
        setLoading(false);
      });
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const markRead = async (id: string) => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread message${unread === 1 ? "" : "s"}` : "You're all caught up."}
        icon={<Bell className="h-6 w-6" />}
        actions={
          unread > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="border-gold/40 hover:bg-gold/10">
              <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
            </Button>
          )
        }
      />

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <Card className="border-border/60 bg-card/80">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
            <Bell className="h-10 w-10 opacity-40" />
            <p>No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card
              key={n.id}
              className={`border-border/60 bg-card/80 transition-all ${
                !n.read ? "border-l-4 border-l-gold shadow-gold/30" : ""
              }`}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 rounded-full p-2 ${!n.read ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"}`}>
                  {!n.read ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{n.title}</h3>
                    <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                </div>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark read</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
