import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Users, Calendar, Mail, DollarSign, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const STAGE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const STAGE_COLORS: Record<string, string> = {
  new_lead: "var(--brand-cyan)",
  contacted: "var(--primary)",
  qualified: "var(--brand-violet)",
  proposal_sent: "#fbbf24", // keep gold
  closed_won: "var(--brand-emerald)",
  closed_lost: "var(--destructive)",
};

const BOOKING_COLORS: Record<string, string> = {
  pending: "var(--primary)",
  confirmed: "var(--brand-cyan)",
  completed: "var(--brand-emerald)",
  cancelled: "var(--destructive)",
};

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="rounded-xl border border-border/40 bg-card/40 p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <Icon className="w-12 h-12 rotate-12" />
      </div>
      <CardHeader className="p-0 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-secondary/50 border border-border flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <CardTitle className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em]">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`text-3xl font-display font-bold mb-1 ${color}`}>{value}</div>
        {sub && <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider opacity-60">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { data, isLoading } = trpc.analytics.summary.useQuery();

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-muted-foreground">No data available.</div>
  );

  const totalLeads = data.leadCounts.reduce((s, l) => s + Number(l.count), 0);
  const totalBookings = data.bookingCounts.reduce((s, b) => s + Number(b.count), 0);
  const closedWon = data.leadCounts.find((l) => l.stage === "closed_won");
  const wonCount = Number(closedWon?.count ?? 0);
  const convRate = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : "0";
  const pipelineVal = Number(data.pipelineValue[0]?.total ?? 0);
  const emailCount = Number(data.emailCaptureCount[0]?.count ?? 0);

  const leadChartData = data.leadCounts.map((l) => ({
    name: STAGE_LABELS[l.stage] ?? l.stage,
    count: Number(l.count),
    fill: STAGE_COLORS[l.stage] ?? "#6366f1",
  }));

  const bookingChartData = data.bookingCounts.map((b) => ({
    name: b.status.charAt(0).toUpperCase() + b.status.slice(1),
    count: Number(b.count),
    fill: BOOKING_COLORS[b.status] ?? "#6366f1",
  }));

  const pieData = leadChartData.filter((d) => d.count > 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 pb-6 border-b border-border/40">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary glow-sm-amber">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="sys-online uppercase font-mono tracking-tighter">ANALYTICS.ENGAGEMENT</span>
            <span className="hud-label opacity-40 text-[10px]">// REAL-TIME METRICS</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Infrastructure Intelligence</h1>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={Users} label="Total Pipeline Leads" value={totalLeads} sub="QUANTITATIVE BASE" />
        <StatCard icon={DollarSign} label="Projected Revenue" value={`$${(pipelineVal / 1000).toFixed(0)}k`} sub="LOCKED PIPELINE" color="text-primary" />
        <StatCard icon={Target} label="Success Velocity" value={`${convRate}%`} sub="CONVERSION EFFICIENCY" color="text-accent" />
        <StatCard icon={Calendar} label="Deployment Bookings" value={totalBookings} sub="SCHEDULED CAPACITY" color="text-accent" />
        <StatCard icon={Mail} label="Intels Captured" value={emailCount} sub="WHITEPAPER INTEREST" color="text-primary" />
        <StatCard icon={TrendingUp} label="Deployments Won" value={wonCount} sub="CLOSED CONTRACTS" color="text-emerald-500" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lead pipeline bar */}
        <Card className="rounded-xl border border-border/40 bg-card/40 p-6 shadow-2xl">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="font-display font-bold text-lg text-foreground">Pipeline Progression</CardTitle>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">// STAGE DISTRIBUTION ANALYSIS</p>
          </CardHeader>
          <CardContent className="p-0">
            {leadChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={leadChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--foreground)", fontSize: "12px", fontFamily: "inherit" }}
                    cursor={{ fill: "rgba(var(--primary-rgb), 0.05)" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                    {leadChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground font-mono text-xs uppercase tracking-widest">No intelligence gathered.</div>
            )}
          </CardContent>
        </Card>

        {/* Lead stage pie */}
        <Card className="rounded-xl border border-border/40 bg-card/40 p-6 shadow-2xl">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="font-display font-bold text-lg text-foreground">Portfolio Composition</CardTitle>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">// SEGMENTATION OVERVIEW</p>
          </CardHeader>
          <CardContent className="p-0">
            {pieData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" paddingAngle={5}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--foreground)", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-3xl font-display font-bold text-foreground">{totalLeads}</div>
                    <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-tighter">Total</div>
                  </div>
                </div>
                <div className="flex-1 w-full space-y-3">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between group p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: d.fill }} />
                        <span className="text-muted-foreground font-mono text-[11px] font-bold uppercase tracking-wider">{d.name}</span>
                      </div>
                      <span className="font-display font-bold text-foreground text-sm">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground font-mono text-xs uppercase tracking-widest">Data buffer empty.</div>
            )}
          </CardContent>
        </Card>

        {/* Bookings status */}
        <Card className="rounded-xl border border-border/40 bg-card/40 p-6 shadow-2xl lg:col-span-2">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="font-display font-bold text-lg text-foreground">Operational Status</CardTitle>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">// DEPLOYMENT LIFECYCLE MONITORING</p>
          </CardHeader>
          <CardContent className="p-0">
            {bookingChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bookingChartData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip
                    contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--foreground)", fontSize: "12px" }}
                    cursor={{ fill: "rgba(var(--primary-rgb), 0.05)" }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                    {bookingChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground font-mono text-xs uppercase tracking-widest">No operational telemetry found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
