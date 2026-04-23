import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import {
  TrendingUp, DollarSign, Users, Target, Award, Search,
  ChevronUp, ChevronDown, ExternalLink, ArrowRight, Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const STAGE_ORDER = ["new_lead", "contacted", "qualified", "proposal_sent", "closed_won", "closed_lost"];

const STAGE_COLORS: Record<string, string> = {
  new_lead: "var(--brand-cyan)",
  contacted: "var(--primary)",
  qualified: "var(--brand-violet)",
  proposal_sent: "#fbbf24",
  closed_won: "var(--brand-emerald)",
  closed_lost: "var(--destructive)",
};

const SOURCE_COLORS = [
  "var(--primary)",
  "var(--brand-cyan)",
  "var(--brand-violet)",
  "var(--brand-emerald)",
  "var(--brand-blue)",
  "var(--accent)",
];

const OFFER_LABELS: Record<string, string> = {
  sprint: "The Sprint ($15K)",
  advisory: "The Advisory ($10K/mo)",
  both: "Both Offers",
  unknown: "Unknown",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function daysSince(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

function DaysSinceCell({ date }: { date: Date | string | null | undefined }) {
  const days = daysSince(date);
  if (days === null) return (
    <span className="inline-flex items-center gap-1 text-red-400 font-mono text-xs font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      NEVER
    </span>
  );
  if (days >= 7) return (
    <span className="inline-flex items-center gap-1 text-red-400 font-mono text-xs font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      {days}d ⚠
    </span>
  );
  if (days >= 3) return (
    <span className="inline-flex items-center gap-1 text-amber-400 font-mono text-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      {days}d
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      {days}d
    </span>
  );
}

// ─── Stage Dropdown ───────────────────────────────────────────────────────────
function StageDropdown({
  leadId,
  currentStage,
  onUpdate,
  isPending,
}: {
  leadId: number;
  currentStage: string;
  onUpdate: (id: number, stage: string) => void;
  isPending: boolean;
}) {
  const colors: Record<string, string> = {
    new_lead: "bg-accent/10 text-accent border-accent/30 hover:bg-accent/20",
    contacted: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20",
    qualified: "bg-violet-400/10 text-violet-400 border-violet-400/30 hover:bg-violet-400/20",
    proposal_sent: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/20",
    closed_won: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20",
    closed_lost: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20",
  };

  return (
    <Select
      value={currentStage}
      onValueChange={(val) => onUpdate(leadId, val)}
      disabled={isPending}
    >
      <SelectTrigger
        className={`h-6 px-2 text-xs font-mono border rounded w-auto min-w-[110px] transition-colors ${colors[currentStage] ?? "bg-white/10 text-white/60 border-white/20"} ${isPending ? "opacity-50 cursor-wait" : ""}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-black/95 border-white/10 backdrop-blur-xl">
        {STAGE_ORDER.map((s) => (
          <SelectItem
            key={s}
            value={s}
            className="text-xs font-mono text-white/70 hover:text-white focus:text-white focus:bg-white/10 cursor-pointer"
          >
            {STAGE_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, accent = "cyan",
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent?: string;
}) {
  const accents: Record<string, string> = {
    cyan: "border-accent/30 shadow-accent/5",
    amber: "border-primary/30 shadow-primary/5",
    violet: "border-violet-400/30 shadow-violet-400/5",
    green: "border-emerald-500/30 shadow-emerald-500/5",
    emerald: "border-emerald-500/30 shadow-emerald-500/5",
  };
  const iconColors: Record<string, string> = {
    cyan: "text-accent", amber: "text-primary", violet: "text-violet-400",
    green: "text-emerald-500", emerald: "text-emerald-500",
  };
  return (
    <Card className={`bg-card/40 border rounded-lg p-5 ${accents[accent]}`}>
      <CardHeader className="p-0 mb-3 flex flex-row items-start justify-between">
        <CardTitle className="text-foreground/50 font-mono text-[10px] font-bold uppercase tracking-[0.2em]">{label}</CardTitle>
        <Icon className={`w-4 h-4 ${iconColors[accent]}`} />
      </CardHeader>
      <CardContent className="p-0">
        <div className="text-3xl font-bold text-foreground font-display tracking-tight leading-none">{value}</div>
        {sub && <div className="text-foreground/40 text-[10px] mt-2 font-mono uppercase tracking-widest opacity-60">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function HudTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="hud-card bg-background/95 border border-primary/30 rounded p-3 font-mono text-xs shadow-2xl backdrop-blur-md">
      {label && <div className="text-foreground/60 mb-2 font-bold uppercase tracking-widest text-[9px] border-b border-border pb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-foreground/80">{p.name}:</span>
          <span className="font-bold text-foreground ml-auto">{typeof p.value === "number" && p.value > 1000 ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type SortField = "name" | "company" | "stage" | "dealValue" | "createdAt" | "lastContactedAt" | "daysSince";
type SortDir = "asc" | "desc";

export default function LeadsDashboard() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [offerFilter, setOfferFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = trpc.analytics.leadStats.useQuery();
  const { data: leads, isLoading: leadsLoading } = trpc.lead.list.useQuery({ includeArchived: false });
  const utils = trpc.useUtils();

  const updateLead = trpc.lead.update.useMutation({
    onMutate: ({ id }) => setUpdatingId(id),
    onSuccess: (_, { stage }) => {
      setUpdatingId(null);
      utils.lead.list.invalidate();
      utils.analytics.leadStats.invalidate();
      toast.success(`Stage updated to ${STAGE_LABELS[stage ?? ""] ?? stage}`);
    },
    onError: (err) => {
      setUpdatingId(null);
      toast.error(`Stage update failed: ${err.message}`);
    },
  });

  function handleStageUpdate(leadId: number, newStage: string) {
    updateLead.mutate({ id: leadId, stage: newStage as "new_lead" | "contacted" | "qualified" | "proposal_sent" | "closed_won" | "closed_lost" });
  }

  // ── Filtered + sorted lead table ──
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads
      .filter((l) => {
        const q = search.toLowerCase();
        const matchSearch = !q || `${l.firstName} ${l.lastName} ${l.company ?? ""} ${l.email}`.toLowerCase().includes(q);
        const matchStage = stageFilter === "all" || l.stage === stageFilter;
        const matchSource = sourceFilter === "all" || l.source === sourceFilter;
        const matchOffer = offerFilter === "all" || l.offerInterest === offerFilter;
        return matchSearch && matchStage && matchSource && matchOffer;
      })
      .sort((a, b) => {
        let va: string | number = "";
        let vb: string | number = "";
        if (sortField === "name") { va = `${a.firstName} ${a.lastName}`; vb = `${b.firstName} ${b.lastName}`; }
        else if (sortField === "company") { va = a.company ?? ""; vb = b.company ?? ""; }
        else if (sortField === "stage") { va = STAGE_ORDER.indexOf(a.stage); vb = STAGE_ORDER.indexOf(b.stage); }
        else if (sortField === "dealValue") { va = parseFloat(a.dealValue ?? "0"); vb = parseFloat(b.dealValue ?? "0"); }
        else if (sortField === "createdAt") { va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); }
        else if (sortField === "lastContactedAt") {
          va = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
          vb = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
        } else if (sortField === "daysSince") {
          // Sort by staleness: null (never) = most stale = highest days
          va = a.lastContactedAt ? daysSince(a.lastContactedAt) ?? 9999 : 9999;
          vb = b.lastContactedAt ? daysSince(b.lastContactedAt) ?? 9999 : 9999;
        }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [leads, search, stageFilter, sourceFilter, offerFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
  }

  // ── Chart data ──
  const stageFunnelData = STAGE_ORDER.map(s => {
    const found = stats?.byStage.find(b => b.stage === s);
    return { stage: STAGE_LABELS[s], count: found?.count ?? 0, value: found?.totalValue ?? 0 };
  });

  const sourceData = (stats?.bySource ?? []).map(s => ({
    name: s.source.replace("_", " "),
    value: s.count,
  }));

  const velocityData = stats?.recentLeads ?? [];

  const offerData = (stats?.byOffer ?? [])
    .filter(o => o.offerInterest !== "unknown")
    .map(o => ({ name: OFFER_LABELS[o.offerInterest] ?? o.offerInterest, value: o.totalValue, count: o.count }));

  const summary = stats?.summary;

  // Count stale leads (never contacted or not contacted in 7+ days)
  const staleCount = leads?.filter(l => {
    const d = daysSince(l.lastContactedAt);
    return d === null || d >= 7;
  }).length ?? 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] font-bold text-primary tracking-[0.3em] mb-1 uppercase opacity-60">// LEAD INTELLIGENCE.CORE</div>
            <h1 className="text-4xl font-bold text-foreground font-display tracking-tight">Strategy Pipeline</h1>
          </div>
          <div className="flex items-center gap-3">
            {staleCount > 0 && (
              <div
                className="font-mono text-[10px] font-bold text-destructive border border-destructive/30 bg-destructive/5 rounded-lg px-4 py-2 cursor-pointer hover:bg-destructive/15 transition-all shadow-sm"
                onClick={() => { setSortField("daysSince"); setSortDir("desc"); }}
                title="Click to sort by staleness"
              >
                ⚠ {staleCount} STALE LEAD{staleCount !== 1 ? "S" : ""}
              </div>
            )}
            <div className="font-mono text-[10px] font-bold text-foreground/40 border border-border rounded-lg px-4 py-2 bg-secondary/30">
              {leads?.length ?? 0} NODES ACTIVE
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard label="Total Pipeline" value={fmt(summary?.totalPipeline ?? 0)} sub="Active deals" icon={DollarSign} accent="amber" />
            <KpiCard label="Active Leads" value={String(summary?.totalActive ?? 0)} sub="Non-archived" icon={Users} accent="cyan" />
            <KpiCard label="Avg Deal Size" value={fmt(summary?.avgDealSize ?? 0)} sub="Per active lead" icon={TrendingUp} accent="violet" />
            <KpiCard label="Win Rate" value={`${summary?.winRate ?? 0}%`} sub={`${summary?.wonCount ?? 0} deals closed`} icon={Award} accent="green" />
            <KpiCard label="Won Revenue" value={fmt(summary?.wonValue ?? 0)} sub="Closed won total" icon={Target} accent="emerald" />
          </div>
        )}

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 rounded-xl p-6 shadow-2xl bg-card/40 border-border/40">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="font-mono text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">// PIPELINE BY STAGE</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stageFunnelData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<HudTooltip />} />
                  <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                    {stageFunnelData.map((entry, index) => (
                      <Cell key={index} fill={STAGE_COLORS[STAGE_ORDER[index]] ?? "var(--primary)"} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-xl p-6 shadow-2xl bg-card/40 border-border/40">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="font-mono text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">// LEAD SOURCES</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sourceData.length === 0 ? (
                <div className="flex items-center justify-center h-[240px] text-foreground/20 font-mono text-[10px] uppercase">// NO SOURCE DATA FOUND</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                      {sourceData.map((_, index) => (
                        <Cell key={index} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} fillOpacity={0.8} />
                      ))}
                    </Pie>
                    <Tooltip content={<HudTooltip />} />
                    <Legend
                      iconType="rect"
                      iconSize={8}
                      formatter={(value) => <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{value}</span>}
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Velocity + Offer Value ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="rounded-xl p-6 shadow-2xl bg-card/40 border-border/40">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="font-mono text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">// VELOCITY MONITOR [30D]</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {velocityData.length === 0 ? (
                <div className="flex items-center justify-center h-[180px] text-foreground/20 font-mono text-[10px] uppercase">// INSUFFICIENT VELOCITY DATA</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<HudTooltip />} />
                    <Line type="monotone" dataKey="count" name="Leads" stroke="var(--primary)" strokeWidth={3} dot={{ fill: "var(--primary)", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl p-6 shadow-2xl bg-card/40 border-border/40">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="font-mono text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">// REVENUE ATTRIBUTION BY OFFER</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {offerData.length === 0 ? (
                <div className="flex items-center justify-center h-[180px] text-foreground/20 font-mono text-[10px] uppercase">// NO ATTRIBUTION DATA</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={offerData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip content={<HudTooltip />} />
                    <Bar dataKey="value" name="Pipeline Value" fill="var(--primary)" radius={[0, 4, 4, 0]} fillOpacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Lead Table ── */}
        <Card className="rounded-xl overflow-hidden shadow-2xl border-border/40 bg-card/40">
          <div className="p-5 border-b border-border bg-secondary/20 flex flex-wrap gap-4 items-center">
            <div className="font-mono text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] mr-4">// LEAD INTEL ACCESS</div>
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" />
              <Input
                placeholder="AUTHENTICATE SEARCH QUERY..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 bg-background/50 border-border text-foreground font-mono text-[11px] placeholder:text-foreground/20 focus:border-primary/50 transition-all rounded-lg"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-40 h-10 bg-background/50 border-border text-foreground text-[11px] font-mono rounded-lg">
                <Filter className="w-3.5 h-3.5 mr-2 text-foreground/30" />
                <SelectValue placeholder="STAGE" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="all" className="text-foreground/70 text-[11px] font-mono">ALL STAGES</SelectItem>
                {STAGE_ORDER.map(s => <SelectItem key={s} value={s} className="text-foreground/70 text-[11px] font-mono">{STAGE_LABELS[s].toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-36 h-10 bg-background/50 border-border text-foreground text-[11px] font-mono rounded-lg">
                <SelectValue placeholder="SOURCE" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="all" className="text-foreground/70 text-[11px] font-mono">ALL SOURCES</SelectItem>
                {["linkedin", "website_contact", "book_download", "booking", "referral", "other"].map(s => (
                  <SelectItem key={s} value={s} className="text-foreground/70 text-[11px] font-mono">{s.replace("_", " ").toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={offerFilter} onValueChange={setOfferFilter}>
              <SelectTrigger className="w-40 h-10 bg-background/50 border-border text-foreground text-[11px] font-mono rounded-lg">
                <SelectValue placeholder="OFFER" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="all" className="text-foreground/70 text-[11px] font-mono">ALL OFFERS</SelectItem>
                {Object.entries(OFFER_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-foreground/70 text-[11px] font-mono">{v.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-foreground/30 font-mono text-[10px] ml-auto uppercase font-bold">{filteredLeads.length} RESULTS FOUND</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/10">
                  {[
                    { label: "Identity", field: "name" as SortField },
                    { label: "Entity", field: "company" as SortField },
                    { label: "Status", field: "stage" as SortField },
                    { label: "Valuation", field: "dealValue" as SortField },
                    { label: "Entry", field: "createdAt" as SortField },
                    { label: "X-Contact", field: "lastContactedAt" as SortField },
                    { label: "Drift", field: "daysSince" as SortField },
                  ].map(col => (
                    <th
                      key={col.field}
                      className="px-6 py-4 text-left font-mono text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleSort(col.field)}
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        <SortIcon field={col.field} />
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-left font-mono text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">Cmds</th>
                </tr>
              </thead>
              <tbody>
                {leadsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-white/5 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-white/30 font-mono text-xs">
                      {leads?.length === 0 ? "NO LEADS YET — RUN THE BATCH IMPORT SCRIPT TO SEED YOUR PIPELINE" : "NO LEADS MATCH CURRENT FILTERS"}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isStale = daysSince(lead.lastContactedAt) === null || (daysSince(lead.lastContactedAt) ?? 0) >= 7;
                    return (
                      <tr
                        key={lead.id}
                        className={`border-b border-border/40 hover:bg-primary/5 transition-colors group ${isStale ? "border-l-2 border-l-destructive/40" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div className="text-foreground font-semibold text-sm font-display tracking-tight">{lead.firstName} {lead.lastName}</div>
                          <div className="text-foreground/40 text-[10px] font-mono uppercase tracking-widest mt-0.5">{lead.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-foreground/70 text-sm font-medium">{lead.company ?? "—"}</div>
                          <div className="text-foreground/30 text-[10px] font-mono uppercase tracking-tighter mt-1">{lead.jobTitle ?? "N/A"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <StageDropdown
                            leadId={lead.id}
                            currentStage={lead.stage}
                            onUpdate={handleStageUpdate}
                            isPending={updatingId === lead.id}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-primary font-mono font-bold text-sm">
                            {lead.dealValue ? fmt(parseFloat(lead.dealValue)) : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-foreground/40 font-mono text-[11px]">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-foreground/40 font-mono text-[11px]">
                          {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString() : <span className="text-destructive/60 font-bold uppercase text-[9px]">NEVER</span>}
                        </td>
                        <td className="px-6 py-4">
                          <DaysSinceCell date={lead.lastContactedAt} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-3 text-primary hover:text-primary hover:bg-primary/10 font-mono text-[10px] font-bold uppercase tracking-widest rounded-lg border border-transparent hover:border-primary/30 transition-all"
                              onClick={() => navigate(`/admin/crm/${lead.id}`)}
                            >
                              ENCRYPTED VIEW <ArrowRight className="w-3 h-3 ml-1.5" />
                            </Button>
                            {lead.linkedIn && (
                              <a href={lead.linkedIn} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-white/40 hover:text-white hover:bg-white/10">
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {filteredLeads.length > 0 && (
            <div className="px-6 py-4 border-t border-border/40 bg-secondary/10 flex items-center justify-between">
              <div className="font-mono text-[10px] font-bold text-foreground/40 tracking-[0.1em] uppercase">
                AGGREGATE VELOCITY VALUE: <span className="text-primary ml-2">
                  {fmt(filteredLeads.reduce((sum, l) => sum + parseFloat(l.dealValue ?? "0"), 0))}
                </span>
              </div>
              <div className="font-mono text-[10px] font-bold text-foreground/20 flex items-center gap-6 uppercase tracking-widest">
                {staleCount > 0 && (
                  <span className="text-red-400/70">// {staleCount} DRIFT NODES</span>
                )}
                <span>{filteredLeads.filter(l => l.stage === "closed_won").length} WON · {filteredLeads.filter(l => l.stage === "closed_lost").length} LOST</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

