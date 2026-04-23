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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-10">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="sys-online">ACTIVE SESSION</span>
            <span className="hud-label opacity-40 text-[10px]">// OPERATOR: {user?.role?.toUpperCase()}</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0] ?? "Christopher"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Nerve Center / Pipeline Overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-md border border-border">
          <Clock className="w-3.5 h-3.5" />
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} PT
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: Users, label: "Total Leads", value: analyticsLoading ? "—" : totalLeads, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", glow: "glow-sm-amber" },
          { icon: DollarSign, label: "Pipeline Value", value: analyticsLoading ? "—" : `$${(pipelineVal / 1000).toFixed(0)}k`, color: "text-accent", bg: "bg-accent/5", border: "border-accent/20", glow: "glow-sm-cyan" },
          { icon: Calendar, label: "Pending Bookings", value: bookingsLoading ? "—" : pendingBookings, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", glow: "glow-sm-amber" },
          { icon: Mail, label: "Email Captures", value: analyticsLoading ? "—" : emailCount, color: "text-accent", bg: "bg-accent/5", border: "border-accent/20", glow: "glow-sm-cyan" },
        ].map((stat) => (
          <Card key={stat.label} className={`border ${stat.border} ${stat.bg} ${stat.glow} transition-all duration-300 hover:translate-y-[-2px]`}>
            <CardHeader className="pb-2">
              <div className={`w-10 h-10 rounded-lg bg-background/60 flex items-center justify-center ${stat.color} border ${stat.border}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-display font-bold ${stat.color} tracking-tight`}>{stat.value}</div>
              <p className="text-[10px] font-mono mt-1 opacity-60 tracking-[0.2em] font-semibold uppercase">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent leads */}
        <Card className="bg-secondary/5 border-border/40 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display font-bold text-lg text-foreground">Recent Leads</CardTitle>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">// LATEST TRANSMISSIONS</p>
            </div>
            <Link href="/admin/crm">
              <Button variant="outline" size="sm" className="text-[10px] font-mono uppercase tracking-wider h-8 border-border hover:bg-muted">
                Open CRM <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" /></div>
            ) : recentLeads.length === 0 ? (
              <div className="text-center py-12"><p className="text-sm text-muted-foreground font-mono">NO LEADS DETECTED</p></div>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <Link key={lead.id} href={`/admin/leads/${lead.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-background/40 hover:bg-background/80 transition-all cursor-pointer border border-border/30 hover:border-primary/40 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary/50 border border-border flex items-center justify-center text-primary text-xs font-bold shadow-inner uppercase font-mono">
                          {lead.firstName[0]}{lead.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {lead.firstName} {lead.lastName}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{lead.company?.toUpperCase() ?? lead.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-[9px] font-mono font-bold opacity-60 border-border/50">
                          {STAGE_LABELS[lead.stage]?.toUpperCase()}
                        </Badge>
                        {lead.dealValue && (
                          <p className="text-xs text-primary font-bold mt-1.5 font-mono">${Number(lead.dealValue).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending bookings */}
        <Card className="bg-secondary/5 border-border/40 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display font-bold text-lg text-foreground">Pending Bookings</CardTitle>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">// SCHEDULED ENGAGEMENTS</p>
            </div>
            <Link href="/admin/bookings">
              <Button variant="outline" size="sm" className="text-[10px] font-mono uppercase tracking-wider h-8 border-border hover:bg-muted">
                View Calendar <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" /></div>
            ) : !bookings?.length ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20 text-accent" />
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">SCHEDULE CLEAR</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 4).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{booking.firstName} {booking.lastName}</p>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground mt-1.5">
                        <span className="flex items-center gap-1 uppercase"><Calendar className="w-3 h-3 text-primary" /> {new Date(booking.scheduledDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}</span>
                        <span className="flex items-center gap-1 uppercase"><Clock className="w-3 h-3 text-primary" /> {booking.scheduledTime} PT</span>
                      </div>
                    </div>
                    <Link href="/admin/bookings">
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-bold h-7 uppercase tracking-wider px-4">
                        Review
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline stage summary */}
      <Card className="bg-secondary/5 border-border/40 shadow-2xl">
        <CardHeader>
          <CardTitle className="font-display font-bold text-lg text-foreground">Pipeline Stage Summary</CardTitle>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">// QUANTITATIVE ANALYSIS</p>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {analytics?.leadCounts.map((l) => (
                <div key={l.stage} className="text-center p-4 rounded-xl bg-background/50 border border-border shadow-inner">
                  <div className="text-2xl font-display font-bold text-foreground mb-1">{l.count}</div>
                  <div className="text-[9px] font-mono font-bold text-muted-foreground uppercase leading-tight tracking-[0.1em]">{STAGE_LABELS[l.stage]}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
