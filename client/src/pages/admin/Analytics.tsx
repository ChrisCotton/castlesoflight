import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Users, Calendar, Mail, DollarSign, Target } from "lucide-react";
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
  new_lead: "oklch(0.65 0.18 200)",
  contacted: "oklch(0.78 0.18 55)",
  qualified: "oklch(0.62 0.22 280)",
  proposal_sent: "oklch(0.7 0.2 30)",
  closed_won: "oklch(0.65 0.18 160)",
  closed_lost: "oklch(0.55 0.22 25)",
};

const BOOKING_COLORS: Record<string, string> = {
  pending: "oklch(0.78 0.18 55)",
  confirmed: "oklch(0.65 0.18 160)",
  completed: "oklch(0.62 0.22 280)",
  cancelled: "oklch(0.55 0.22 25)",
};

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className={`text-3xl font-display font-bold mb-1 ${color}`}>{value}</div>
      <div className="text-sm font-medium text-foreground">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
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
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pipeline performance and conversion metrics.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Leads" value={totalLeads} sub="All time" />
        <StatCard icon={DollarSign} label="Pipeline Value" value={`$${(pipelineVal / 1000).toFixed(0)}k`} sub="Active deals" color="text-primary" />
        <StatCard icon={Target} label="Conversion Rate" value={`${convRate}%`} sub="Lead to Closed Won" color="text-[oklch(0.65_0.18_160)]" />
        <StatCard icon={Calendar} label="Total Bookings" value={totalBookings} sub="All time" color="text-[oklch(0.62_0.22_280)]" />
        <StatCard icon={Mail} label="Email Captures" value={emailCount} sub="Book downloads" color="text-[oklch(0.7_0.2_30)]" />
        <StatCard icon={TrendingUp} label="Closed Won" value={wonCount} sub="Deals closed" color="text-[oklch(0.65_0.18_160)]" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lead pipeline bar */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-6">Lead Pipeline</h3>
          {leadChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leadChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 260)" />
                <XAxis dataKey="name" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", borderRadius: "8px", color: "oklch(0.95 0.01 260)" }}
                  cursor={{ fill: "oklch(0.22 0.02 260 / 0.3)" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {leadChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No lead data yet.</div>
          )}
        </div>

        {/* Lead stage pie */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-6">Stage Distribution</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", borderRadius: "8px", color: "oklch(0.95 0.01 260)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-muted-foreground text-xs">{d.name}</span>
                    </div>
                    <span className="font-semibold text-foreground text-xs">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data yet.</div>
          )}
        </div>

        {/* Bookings status */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h3 className="font-display font-semibold text-foreground mb-6">Booking Status Overview</h3>
          {bookingChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={bookingChartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 260)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", borderRadius: "8px", color: "oklch(0.95 0.01 260)" }}
                  cursor={{ fill: "oklch(0.22 0.02 260 / 0.3)" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {bookingChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No booking data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
