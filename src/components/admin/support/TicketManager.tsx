import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SupportTicket, SupportTicketStatus, SupportPriority } from "@/lib/support/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  MoreVertical
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TicketManager() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchTickets = async () => {
    setLoading(true);
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user_profile:profiles(full_name, avatar_url),
        department:support_departments(name)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq('status', statusFilter as SupportTicketStatus);
    }

    const { data, error } = await query;
    if (!error && data) {
      setTickets(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();

    const channel = supabase.channel('tickets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchTickets)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const getStatusBadge = (status: SupportTicketStatus) => {
    const styles = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      escalated: "bg-red-500/10 text-red-500 border-red-500/20",
      resolved: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
      closed: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    };
    return (
      <Badge variant="outline" className={cn("capitalize", styles[status])}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: SupportPriority) => {
    const styles = {
      low: "bg-slate-500/10 text-slate-500",
      medium: "bg-blue-500/10 text-blue-500",
      high: "bg-orange-500/10 text-orange-500",
      urgent: "bg-red-500/10 text-red-500",
      VIP: "bg-gold/10 text-gold border-gold/20",
    };
    return (
      <Badge variant="outline" className={cn("capitalize font-semibold", styles[priority])}>
        {priority}
      </Badge>
    );
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.user_profile?.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/40 p-4 rounded-xl border border-border/60">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tickets or users..." 
            className="pl-9 bg-background/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select 
            className="bg-background/60 border border-border/60 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 ring-gold"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[100px]">Priority</TableHead>
              <TableHead>User / Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading tickets...</TableCell>
              </TableRow>
            ) : filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">No tickets found.</TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm flex items-center gap-2">
                        {ticket.user_profile?.full_name || "Unknown User"}
                        {ticket.priority === 'VIP' && <Badge className="h-4 px-1 bg-gold text-gold-foreground text-[8px]">VIP</Badge>}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {ticket.subject}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {(ticket as any).department?.name || "General"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(ticket.created_at), "MMM d, HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Ticket Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2">
                          <ExternalLink className="h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <User className="h-4 w-4" /> Assign Agent
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <AlertCircle className="h-4 w-4" /> Escalate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-emerald-500">
                          <CheckCircle2 className="h-4 w-4" /> Mark Resolved
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
