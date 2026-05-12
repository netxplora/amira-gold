import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Users,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SupportAnalytics() {
  const [stats, setStats] = useState({
    avgResponseTime: "12m",
    avgResolutionTime: "4h 20m",
    satisfactionRate: 98,
    activeTickets: 0,
    totalTickets: 0,
    resolvedToday: 0
  });

  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const [
        { count: total },
        { count: active },
        { count: resolvedToday },
        { data: tickets }
      ] = await Promise.all([
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['pending', 'active', 'in_progress']),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('updated_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
        supabase.from('support_tickets').select('status, department:support_departments(name)')
      ]);

      setStats(prev => ({
        ...prev,
        totalTickets: total || 0,
        activeTickets: active || 0,
        resolvedToday: resolvedToday || 0
      }));

      // Process department data
      const deptMap: Record<string, number> = {};
      const statusMap: Record<string, number> = {};

      tickets?.forEach((t: any) => {
        const deptName = t.department?.name || "General";
        deptMap[deptName] = (deptMap[deptName] || 0) + 1;
        statusMap[t.status] = (statusMap[t.status] || 0) + 1;
      });

      setDepartmentData(Object.entries(deptMap).map(([name, value]) => ({ name, value })));
      setStatusData(Object.entries(statusMap).map(([name, value]) => ({ name, value })));
    };

    fetchAnalytics();
  }, []);

  const COLORS = ['#D4AF37', '#22C55E', '#3B82F6', '#EF4444', '#8B5CF6', '#F97316'];

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/40 border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Active Tickets</p>
              <Clock className="h-4 w-4 text-gold" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{stats.activeTickets}</div>
              <div className="text-[10px] text-emerald-500 flex items-center font-medium">
                <TrendingDown className="h-3 w-3 mr-0.5" /> 12% from yesterday
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{stats.resolvedToday}</div>
              <div className="text-[10px] text-emerald-500 flex items-center font-medium">
                <TrendingUp className="h-3 w-3 mr-0.5" /> 8% from avg
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
              <div className="text-[10px] text-emerald-500 font-medium">Under SLA</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Satisfaction</p>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{stats.satisfactionRate}%</div>
              <div className="text-[10px] text-emerald-500 font-medium">Target: 95%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Department Volume Chart */}
        <Card className="lg:col-span-4 bg-card/40 border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gold" /> Ticket Volume by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    className="capitalize"
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    itemStyle={{ color: '#D4AF37' }}
                  />
                  <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="lg:col-span-3 bg-card/40 border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-emerald-500" /> Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {statusData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] text-muted-foreground capitalize">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BarChart3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M7 16h3" />
      <path d="M11 12h3" />
      <path d="M15 8h3" />
    </svg>
  )
}

function PieChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
}
