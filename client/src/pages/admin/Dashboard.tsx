import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users,
  Calendar,
  DollarSign,
  Mail,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: analytics, isLoading: analyticsLoading } = trpc.analytics.summary.useQuery();
  const { data: leads, isLoading: leadsLoading } = trpc.lead.list.useQuery({ includeArchived: false });
  const { data: bookings, isLoading: bookingsLoading } = trpc.booking.list.useQuery({ status: "pending" });

  const totalLeads = analytics?.leadCounts.reduce((s, l) => s + Number(l.count), 0) ?? 0;
  const pipelineVal = Number(analytics?.pipelineValue[0]?.total ?? 0);
  const emailCount = Number(analytics?.emailCaptureCount[0]?.count ?? 0);
  const pendingBookings = bookings?.length ?? 0;

  const recentLeads = (leads ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0] ?? "Christopher"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Here's your pipeline at a glance.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Leads", value: analyticsLoading ? "—" : totalLeads, color: "text-[oklch(0.62_0.22_280)]", bg: "bg-[oklch(0.62_0.22_280_/_0.1)]", border: "border-[oklch(0.62_0.22_280_/_0.3)]" },
          { icon: DollarSign, label: "Pipeline Value", value: analyticsLoading ? "—" : `$${(pipelineVal / 1000).toFixed(0)}k`, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
          { icon: Calendar, label: "Pending Bookings", value: bookingsLoading ? "—" : pendingBookings, color: "text-[oklch(0.7_0.2_30)]", bg: "bg-[oklch(0.7_0.2_30_/_0.1)]", border: "border-[oklch(0.7_0.2_30_/_0.3)]" },
          { icon: Mail, label: "Email Captures", value: analyticsLoading ? "—" : emailCount, color: "text-[oklch(0.65_0.18_160)]", bg: "bg-[oklch(0.65_0.18_160_/_0.1)]", border: "border-[oklch(0.65_0.18_160_/_0.3)]" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border ${stat.border} ${stat.bg} p-5`}>
            <div className={`w-9 h-9 rounded-lg bg-background/50 flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <div className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent leads */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-foreground">Recent Leads</h2>
            <Link href="/admin/crm">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-7">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          {leadsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet.</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <Link key={lead.id} href={`/admin/leads/${lead.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                        {lead.firstName[0]}{lead.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{lead.company ?? lead.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{STAGE_LABELS[lead.stage]}</p>
                      {lead.dealValue && (
                        <p className="text-xs text-primary font-semibold">${Number(lead.dealValue).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending bookings */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-foreground">Pending Bookings</h2>
            <Link href="/admin/bookings">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-7">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          {bookingsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : !bookings?.length ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No pending bookings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 4).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{booking.firstName} {booking.lastName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(booking.scheduledDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      <Clock className="w-3 h-3 ml-1" />
                      {booking.scheduledTime} PT
                    </div>
                  </div>
                  <Link href="/admin/bookings">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 font-semibold">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline stage summary */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display font-semibold text-foreground mb-5">Pipeline Stage Summary</h2>
        {analyticsLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {analytics?.leadCounts.map((l) => (
              <div key={l.stage} className="text-center p-3 rounded-lg bg-secondary border border-border">
                <div className="text-2xl font-display font-bold text-foreground">{l.count}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{STAGE_LABELS[l.stage]}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
