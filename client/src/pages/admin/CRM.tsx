import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  Search,
  Filter,
  User,
  Building2,
  Mail,
  Phone,
  DollarSign,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  MoreHorizontal,
  Tag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

type Stage = "new_lead" | "contacted" | "qualified" | "proposal_sent" | "closed_won" | "closed_lost";

const STAGES: { key: Stage; label: string; color: string; bg: string; border: string }[] = [
  { key: "new_lead", label: "New Lead", color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  { key: "contacted", label: "Contacted", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  { key: "qualified", label: "Qualified", color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20" },
  { key: "proposal_sent", label: "Proposal Sent", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
  { key: "closed_won", label: "Closed Won", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  { key: "closed_lost", label: "Closed Lost", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
];

const OFFER_LABELS: Record<string, string> = {
  sprint: "Sprint ($15k)",
  advisory: "Advisory ($10k/mo)",
  both: "Both",
  unknown: "Unknown",
};

function StageChip({ stage }: { stage: Stage }) {
  const s = STAGES.find((x) => x.key === stage)!;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.color} border ${s.border}`}>
      {s.label}
    </span>
  );
}

function AddLeadDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", company: "", jobTitle: "",
    linkedIn: "", stage: "new_lead" as Stage, offerInterest: "unknown" as const,
    dealValue: "", notes: "", source: "other" as const,
  });

  const create = trpc.lead.create.useMutation({
    onSuccess: () => {
      toast.success("Lead added.");
      setOpen(false);
      onAdded();
    },
    onError: () => toast.error("Failed to add lead."),
  });

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add New Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">First Name *</Label>
              <Input value={form.firstName} onChange={f("firstName")} className="bg-input border-border text-foreground h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Last Name *</Label>
              <Input value={form.lastName} onChange={f("lastName")} className="bg-input border-border text-foreground h-9" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Email *</Label>
            <Input type="email" value={form.email} onChange={f("email")} className="bg-input border-border text-foreground h-9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Phone</Label>
              <Input value={form.phone} onChange={f("phone")} className="bg-input border-border text-foreground h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Company</Label>
              <Input value={form.company} onChange={f("company")} className="bg-input border-border text-foreground h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Job Title</Label>
              <Input value={form.jobTitle} onChange={f("jobTitle")} className="bg-input border-border text-foreground h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Deal Value ($)</Label>
              <Input value={form.dealValue} onChange={f("dealValue")} placeholder="15000" className="bg-input border-border text-foreground h-9" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">LinkedIn</Label>
            <Input value={form.linkedIn} onChange={f("linkedIn")} placeholder="https://linkedin.com/in/..." className="bg-input border-border text-foreground h-9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Stage</Label>
              <Select value={form.stage} onValueChange={(v) => setForm((p) => ({ ...p, stage: v as Stage }))}>
                <SelectTrigger className="bg-input border-border text-foreground h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Offer Interest</Label>
              <Select value={form.offerInterest} onValueChange={(v) => setForm((p) => ({ ...p, offerInterest: v as typeof form.offerInterest }))}>
                <SelectTrigger className="bg-input border-border text-foreground h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  {Object.entries(OFFER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Notes</Label>
            <Textarea value={form.notes} onChange={f("notes")} className="bg-input border-border text-foreground min-h-[80px]" />
          </div>
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            onClick={() => create.mutate(form)}
            disabled={create.isPending || !form.firstName || !form.lastName || !form.email}
          >
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Add Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CRM() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [view, setView] = useState<"pipeline" | "list">("pipeline");

  const utils = trpc.useUtils();
  const { data: leads, isLoading } = trpc.lead.list.useQuery({ includeArchived: false });

  const updateLead = trpc.lead.update.useMutation({
    onSuccess: () => { utils.lead.list.invalidate(); toast.success("Lead updated."); },
    onError: () => toast.error("Failed to update lead."),
  });

  const filtered = (leads ?? []).filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${l.firstName} ${l.lastName} ${l.email} ${l.company ?? ""}`.toLowerCase().includes(q);
    const matchStage = stageFilter === "all" || l.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const byStage = (stage: Stage) => filtered.filter((l) => l.stage === stage);

  const totalPipeline = (leads ?? [])
    .filter((l) => l.stage !== "closed_lost" && l.dealValue)
    .reduce((sum, l) => sum + Number(l.dealValue ?? 0), 0);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="sys-online">CRM.CORE</span>
            <span className="hud-label opacity-40 text-[10px]">// PIPELINE MONITORING</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Infrastructure Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-3">
            <span>{leads?.length ?? 0} active leads</span>
            <span className="opacity-20">|</span>
            <span className="text-primary font-bold tracking-tight">${(totalPipeline / 1000).toFixed(0)}k Projected</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddLeadDialog onAdded={() => utils.lead.list.invalidate()} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input border-border text-foreground h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`border-border h-9 ${view === "pipeline" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
            onClick={() => setView("pipeline")}
          >
            Pipeline
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`border-border h-9 ${view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
            onClick={() => setView("list")}
          >
            List
          </Button>
        </div>
      </div>

      {/* Pipeline view */}
      {view === "pipeline" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = byStage(stage.key);
            const stageValue = stageLeads.reduce((s, l) => s + Number(l.dealValue ?? 0), 0);
            return (
              <div key={stage.key} className="shrink-0 w-72">
                <div className={`flex items-center justify-between mb-4 px-4 py-2.5 rounded-xl ${stage.bg} border ${stage.border} shadow-sm`}>
                  <span className={`text-[10px] font-bold font-mono tracking-wider uppercase ${stage.color}`}>{stage.label}</span>
                  <div className="flex items-center gap-2.5">
                    {stageValue > 0 && (
                      <span className="text-[10px] font-mono opacity-50 font-semibold">${(stageValue / 1000).toFixed(0)}k</span>
                    )}
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border ${stage.border} ${stage.bg} ${stage.color}`}>{stageLeads.length}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {stageLeads.map((lead) => (
                    <Card key={lead.id} className="rounded-xl border border-border/40 bg-card/50 p-4 hover:border-primary/40 transition-all group shadow-sm hover:shadow-md">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <Link href={`/admin/leads/${lead.id}`}>
                            <p className="font-medium text-sm text-foreground truncate hover:text-primary transition-colors cursor-pointer">
                              {lead.firstName} {lead.lastName}
                            </p>
                          </Link>
                          {lead.company && (
                            <p className="text-xs text-muted-foreground truncate font-mono uppercase text-[10px] tracking-wider mt-0.5">{lead.company}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary transition-all">
                              <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-popover border-border text-foreground" align="end">
                            {STAGES.filter((s) => s.key !== lead.stage).map((s) => (
                              <DropdownMenuItem
                                key={s.key}
                                className="text-sm cursor-pointer hover:bg-secondary"
                                onClick={() => updateLead.mutate({ id: lead.id, stage: s.key })}
                              >
                                Move to {s.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tight">
                          {OFFER_LABELS[lead.offerInterest] ?? "—"}
                        </span>
                        {lead.dealValue && (
                          <span className="text-xs text-primary font-bold font-mono">
                            ${Number(lead.dealValue).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Name</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Stage</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Offer</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Value</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <Link href={`/admin/leads/${lead.id}`}>
                        <span className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors">
                          {lead.firstName} {lead.lastName}
                        </span>
                      </Link>
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lead.company ?? "—"}</td>
                  <td className="px-4 py-3"><StageChip stage={lead.stage as Stage} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{OFFER_LABELS[lead.offerInterest]}</td>
                  <td className="px-4 py-3 text-primary font-semibold text-xs hidden lg:table-cell">
                    {lead.dealValue ? `$${Number(lead.dealValue).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${lead.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
