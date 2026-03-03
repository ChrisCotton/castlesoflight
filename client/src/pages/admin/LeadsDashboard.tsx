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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  new_lead: "#22d3ee",
  contacted: "#f59e0b",
  qualified: "#a78bfa",
  proposal_sent: "#34d399",
  closed_won: "#10b981",
  closed_lost: "#ef4444",
};

const SOURCE_COLORS = ["#22d3ee", "#f59e0b", "#a78bfa", "#34d399", "#f472b6", "#fb923c"];

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

function stageBadge(stage: string) {
  const colors: Record<string, string> = {
    new_lead: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    contacted: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    qualified: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    proposal_sent: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    closed_won: "bg-green-500/20 text-green-300 border-green-500/30",
    closed_lost: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${colors[stage] ?? "bg-white/10 text-white/60"}`}>
      {STAGE_LABELS[stage] ?? stage}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, accent = "cyan",
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent?: string;
}) {
  const accents: Record<string, string> = {
    cyan: "border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.08)]",
    amber: "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]",
    violet: "border-violet-500/30 shadow-[0_0_20px_rgba(167,139,250,0.08)]",
    green: "border-green-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]",
    emerald: "border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.08)]",
  };
  const iconColors: Record<string, string> = {
    cyan: "text-cyan-400", amber: "text-amber-400", violet: "text-violet-400",
    green: "text-green-400", emerald: "text-emerald-400",
  };
  return (
    <div className={`bg-black/60 border rounded-lg p-5 ${accents[accent]}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-white/50 font-mono text-xs uppercase tracking-widest">{label}</span>
        <Icon className={`w-4 h-4 ${iconColors[accent]}`} />
      </div>
      <div className="text-2xl font-bold text-white font-mono">{value}</div>
      {sub && <div className="text-white/40 text-xs mt-1 font-mono">{sub}</div>}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function HudTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black/90 border border-cyan-500/30 rounded p-3 font-mono text-xs">
      {label && <div className="text-white/60 mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === "number" && p.value > 1000 ? fmt(p.value) : p.value}</div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type SortField = "name" | "company" | "stage" | "dealValue" | "createdAt" | "lastContactedAt";
type SortDir = "asc" | "desc";

export default function LeadsDashboard() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [offerFilter, setOfferFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: stats, isLoading: statsLoading } = trpc.analytics.leadStats.useQuery();
  const { data: leads, isLoading: leadsLoading } = trpc.lead.list.useQuery({ includeArchived: false });

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
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-cyan-400" /> : <ChevronDown className="w-3 h-3 text-cyan-400" />;
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

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-xs text-cyan-400 tracking-widest mb-1">// LEAD INTELLIGENCE</div>
            <h1 className="text-2xl font-bold text-white">Pipeline Dashboard</h1>
          </div>
          <div className="font-mono text-xs text-white/30 border border-white/10 rounded px-3 py-1.5">
            {leads?.length ?? 0} TOTAL LEADS
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
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
          {/* Stage Funnel */}
          <div className="lg:col-span-2 bg-black/60 border border-white/10 rounded-lg p-5">
            <div className="font-mono text-xs text-white/50 uppercase tracking-widest mb-4">Pipeline by Stage</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stageFunnelData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="stage" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip content={<HudTooltip />} />
                <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                  {stageFunnelData.map((entry, index) => (
                    <Cell key={index} fill={STAGE_COLORS[STAGE_ORDER[index]] ?? "#22d3ee"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Source Breakdown */}
          <div className="bg-black/60 border border-white/10 rounded-lg p-5">
            <div className="font-mono text-xs text-white/50 uppercase tracking-widest mb-4">Lead Sources</div>
            {sourceData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-white/30 font-mono text-xs">NO DATA YET</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {sourceData.map((_, index) => (
                      <Cell key={index} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<HudTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "JetBrains Mono" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Velocity + Offer Value ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 30-day velocity */}
          <div className="bg-black/60 border border-white/10 rounded-lg p-5">
            <div className="font-mono text-xs text-white/50 uppercase tracking-widest mb-4">Lead Velocity — Last 30 Days</div>
            {velocityData.length === 0 ? (
              <div className="flex items-center justify-center h-[160px] text-white/30 font-mono text-xs">NO LEADS IN LAST 30 DAYS</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<HudTooltip />} />
                  <Line type="monotone" dataKey="count" name="Leads Added" stroke="#22d3ee" strokeWidth={2} dot={{ fill: "#22d3ee", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Offer pipeline value */}
          <div className="bg-black/60 border border-white/10 rounded-lg p-5">
            <div className="font-mono text-xs text-white/50 uppercase tracking-widest mb-4">Pipeline Value by Offer</div>
            {offerData.length === 0 ? (
              <div className="flex items-center justify-center h-[160px] text-white/30 font-mono text-xs">NO OFFER DATA YET</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={offerData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip content={<HudTooltip />} />
                  <Bar dataKey="value" name="Pipeline Value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Lead Table ── */}
        <div className="bg-black/60 border border-white/10 rounded-lg overflow-hidden">
          {/* Table header + filters */}
          <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center">
            <div className="font-mono text-xs text-white/50 uppercase tracking-widest mr-2">Lead Intel</div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <Input
                placeholder="Search name, company, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 bg-white/5 border-white/10 text-white text-xs font-mono placeholder:text-white/20 focus:border-cyan-500/50"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-36 h-8 bg-white/5 border-white/10 text-white text-xs font-mono">
                <Filter className="w-3 h-3 mr-1 text-white/30" />
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/10">
                <SelectItem value="all" className="text-white/70 text-xs font-mono">All Stages</SelectItem>
                {STAGE_ORDER.map(s => <SelectItem key={s} value={s} className="text-white/70 text-xs font-mono">{STAGE_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-32 h-8 bg-white/5 border-white/10 text-white text-xs font-mono">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/10">
                <SelectItem value="all" className="text-white/70 text-xs font-mono">All Sources</SelectItem>
                {["linkedin", "website_contact", "book_download", "booking", "referral", "other"].map(s => (
                  <SelectItem key={s} value={s} className="text-white/70 text-xs font-mono">{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={offerFilter} onValueChange={setOfferFilter}>
              <SelectTrigger className="w-36 h-8 bg-white/5 border-white/10 text-white text-xs font-mono">
                <SelectValue placeholder="Offer" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/10">
                <SelectItem value="all" className="text-white/70 text-xs font-mono">All Offers</SelectItem>
                {Object.entries(OFFER_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-white/70 text-xs font-mono">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-white/30 font-mono text-xs ml-auto">{filteredLeads.length} results</div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {[
                    { label: "Name", field: "name" as SortField },
                    { label: "Company", field: "company" as SortField },
                    { label: "Stage", field: "stage" as SortField },
                    { label: "Deal Value", field: "dealValue" as SortField },
                    { label: "Added", field: "createdAt" as SortField },
                    { label: "Last Contact", field: "lastContactedAt" as SortField },
                  ].map(col => (
                    <th
                      key={col.field}
                      className="px-4 py-3 text-left font-mono text-xs text-white/40 uppercase tracking-widest cursor-pointer hover:text-white/70 transition-colors"
                      onClick={() => toggleSort(col.field)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <SortIcon field={col.field} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-mono text-xs text-white/40 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leadsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-white/5 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-white/30 font-mono text-xs">
                      {leads?.length === 0 ? "NO LEADS YET — RUN THE BATCH IMPORT SCRIPT TO SEED YOUR PIPELINE" : "NO LEADS MATCH CURRENT FILTERS"}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="text-white font-medium text-sm">{lead.firstName} {lead.lastName}</div>
                        <div className="text-white/40 text-xs font-mono">{lead.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white/70 text-sm">{lead.company ?? "—"}</div>
                        <div className="text-white/30 text-xs">{lead.jobTitle ?? ""}</div>
                      </td>
                      <td className="px-4 py-3">{stageBadge(lead.stage)}</td>
                      <td className="px-4 py-3">
                        <span className="text-amber-400 font-mono font-bold text-sm">
                          {lead.dealValue ? fmt(parseFloat(lead.dealValue)) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/40 font-mono text-xs">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-white/40 font-mono text-xs">
                        {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString() : <span className="text-red-400/60">Never</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 font-mono text-xs"
                            onClick={() => navigate(`/admin/crm/${lead.id}`)}
                          >
                            View <ArrowRight className="w-3 h-3 ml-1" />
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {filteredLeads.length > 0 && (
            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
              <div className="font-mono text-xs text-white/30">
                TOTAL FILTERED PIPELINE: <span className="text-amber-400 font-bold">
                  {fmt(filteredLeads.reduce((sum, l) => sum + parseFloat(l.dealValue ?? "0"), 0))}
                </span>
              </div>
              <div className="font-mono text-xs text-white/20">
                {filteredLeads.filter(l => l.stage === "closed_won").length} WON · {filteredLeads.filter(l => l.stage === "closed_lost").length} LOST
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
