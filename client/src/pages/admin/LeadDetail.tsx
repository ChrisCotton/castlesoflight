import { useState } from "react";
import SendEmailDialog from "@/components/SendEmailDialog";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Linkedin,
  Globe,
  Calendar,
  MessageSquare,
  PhoneCall,
  Video,
  FileText,
  Tag,
  DollarSign,
  Edit3,
  Save,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

type Stage = "new_lead" | "contacted" | "qualified" | "proposal_sent" | "closed_won" | "closed_lost";
type InteractionType = "note" | "email" | "call" | "meeting" | "booking" | "stage_change" | "system";

const STAGES: { key: Stage; label: string; color: string; bg: string; border: string }[] = [
  { key: "new_lead", label: "New Lead", color: "text-[oklch(0.65_0.18_200)]", bg: "bg-[oklch(0.65_0.18_200_/_0.1)]", border: "border-[oklch(0.65_0.18_200_/_0.3)]" },
  { key: "contacted", label: "Contacted", color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
  { key: "qualified", label: "Qualified", color: "text-[oklch(0.62_0.22_280)]", bg: "bg-[oklch(0.62_0.22_280_/_0.1)]", border: "border-[oklch(0.62_0.22_280_/_0.3)]" },
  { key: "proposal_sent", label: "Proposal Sent", color: "text-[oklch(0.7_0.2_30)]", bg: "bg-[oklch(0.7_0.2_30_/_0.1)]", border: "border-[oklch(0.7_0.2_30_/_0.3)]" },
  { key: "closed_won", label: "Closed Won", color: "text-[oklch(0.65_0.18_160)]", bg: "bg-[oklch(0.65_0.18_160_/_0.1)]", border: "border-[oklch(0.65_0.18_160_/_0.3)]" },
  { key: "closed_lost", label: "Closed Lost", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
];

const INTERACTION_ICONS: Record<InteractionType, React.ReactNode> = {
  note: <MessageSquare className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  call: <PhoneCall className="w-4 h-4" />,
  meeting: <Video className="w-4 h-4" />,
  booking: <Calendar className="w-4 h-4" />,
  stage_change: <TrendingUp className="w-4 h-4" />,
  system: <AlertCircle className="w-4 h-4" />,
};

const INTERACTION_COLORS: Record<InteractionType, string> = {
  note: "bg-secondary border-border text-muted-foreground",
  email: "bg-primary/10 border-primary/30 text-primary",
  call: "bg-[oklch(0.65_0.18_160_/_0.1)] border-[oklch(0.65_0.18_160_/_0.3)] text-[oklch(0.65_0.18_160)]",
  meeting: "bg-[oklch(0.62_0.22_280_/_0.1)] border-[oklch(0.62_0.22_280_/_0.3)] text-[oklch(0.62_0.22_280)]",
  booking: "bg-[oklch(0.7_0.2_30_/_0.1)] border-[oklch(0.7_0.2_30_/_0.3)] text-[oklch(0.7_0.2_30)]",
  stage_change: "bg-primary/10 border-primary/30 text-primary",
  system: "bg-secondary border-border text-muted-foreground",
};

function StageChip({ stage }: { stage: Stage }) {
  const s = STAGES.find((x) => x.key === stage)!;
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.color} border ${s.border}`}>
      {s.label}
    </span>
  );
}

function AddInteractionForm({ leadId, onAdded }: { leadId: number; onAdded: () => void }) {
  const [type, setType] = useState<InteractionType>("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const add = trpc.lead.addInteraction.useMutation({
    onSuccess: () => {
      setTitle(""); setBody("");
      toast.success("Interaction added.");
      onAdded();
    },
    onError: () => toast.error("Failed to add interaction."),
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Log Interaction</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["note", "email", "call", "meeting"] as InteractionType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium capitalize transition-all ${
              type === t ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary text-secondary-foreground hover:border-primary/50"
            }`}
          >
            {INTERACTION_ICONS[t]}
            {t}
          </button>
        ))}
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder={type === "note" ? "Quick note..." : type === "email" ? "Email subject..." : type === "call" ? "Call summary..." : "Meeting notes..."}
          className="bg-input border-border text-foreground h-9" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Details (optional)</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)}
          className="bg-input border-border text-foreground min-h-[80px]"
          placeholder="Additional context, outcomes, next steps..." />
      </div>
      <Button
        size="sm"
        className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        onClick={() => add.mutate({ leadId, type, title, body: body || undefined })}
        disabled={add.isPending || !title}
      >
        {add.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
        Log {type}
      </Button>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const leadId = parseInt(id ?? "0");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.lead.get.useQuery({ id: leadId });

  const update = trpc.lead.update.useMutation({
    onSuccess: () => {
      utils.lead.get.invalidate({ id: leadId });
      setEditing(false);
      toast.success("Lead updated.");
    },
    onError: () => toast.error("Failed to update lead."),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-muted-foreground">Lead not found.</div>
  );

  const { lead, timeline } = data;

  const startEdit = () => {
    setEditForm({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone ?? "",
      company: lead.company ?? "",
      jobTitle: lead.jobTitle ?? "",
      linkedIn: lead.linkedIn ?? "",
      website: lead.website ?? "",
      stage: lead.stage,
      offerInterest: lead.offerInterest,
      dealValue: lead.dealValue ? String(lead.dealValue) : "",
      notes: lead.notes ?? "",
    });
    setEditing(true);
  };

  const saveEdit = () => {
    update.mutate({
      id: leadId,
      ...editForm,
      stage: editForm.stage as Stage,
      offerInterest: editForm.offerInterest as "sprint" | "advisory" | "both" | "unknown",
    });
  };

  const ef = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setEditForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/crm" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> CRM
        </Link>
        <span>/</span>
        <span className="text-foreground">{lead.firstName} {lead.lastName}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Contact card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-display font-bold text-lg">
                {lead.firstName[0]}{lead.lastName[0]}
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={editing ? () => setEditing(false) : startEdit}>
                {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </Button>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={editForm.firstName} onChange={ef("firstName")} className="bg-input border-border text-foreground h-8 text-sm" placeholder="First" />
                  <Input value={editForm.lastName} onChange={ef("lastName")} className="bg-input border-border text-foreground h-8 text-sm" placeholder="Last" />
                </div>
                <Input value={editForm.email} onChange={ef("email")} className="bg-input border-border text-foreground h-8 text-sm" placeholder="Email" />
                <Input value={editForm.phone} onChange={ef("phone")} className="bg-input border-border text-foreground h-8 text-sm" placeholder="Phone" />
                <Input value={editForm.company} onChange={ef("company")} className="bg-input border-border text-foreground h-8 text-sm" placeholder="Company" />
                <Input value={editForm.jobTitle} onChange={ef("jobTitle")} className="bg-input border-border text-foreground h-8 text-sm" placeholder="Job Title" />
                <Input value={editForm.linkedIn} onChange={ef("linkedIn")} className="bg-input border-border text-foreground h-8 text-sm" placeholder="LinkedIn URL" />
                <Input value={editForm.dealValue} onChange={ef("dealValue")} className="bg-input border-border text-foreground h-8 text-sm" placeholder="Deal Value ($)" />
                <Select value={editForm.stage} onValueChange={(v) => setEditForm((p) => ({ ...p, stage: v }))}>
                  <SelectTrigger className="bg-input border-border text-foreground h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={editForm.offerInterest} onValueChange={(v) => setEditForm((p) => ({ ...p, offerInterest: v }))}>
                  <SelectTrigger className="bg-input border-border text-foreground h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {[["sprint", "Sprint ($15k)"], ["advisory", "Advisory ($10k/mo)"], ["both", "Both"], ["unknown", "Unknown"]].map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea value={editForm.notes} onChange={ef("notes")} className="bg-input border-border text-foreground text-sm min-h-[80px]" placeholder="Notes..." />
                <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" onClick={saveEdit} disabled={update.isPending}>
                  {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                  Save Changes
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">
                  {lead.firstName} {lead.lastName}
                </h2>
                {lead.jobTitle && <p className="text-sm text-muted-foreground mb-1">{lead.jobTitle}</p>}
                {lead.company && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <Building2 className="w-3.5 h-3.5" />
                    {lead.company}
                  </div>
                )}
                <div className="mb-4"><StageChip stage={lead.stage as Stage} /></div>

                <div className="space-y-2.5 text-sm">
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </a>
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      {lead.phone}
                    </a>
                  )}
                  {lead.linkedIn && (
                    <a href={lead.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Linkedin className="w-3.5 h-3.5 shrink-0" />
                      LinkedIn Profile
                    </a>
                  )}
                  {lead.website && (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      Website
                    </a>
                  )}
                </div>

                {(lead.dealValue || lead.offerInterest !== "unknown") && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    {lead.dealValue && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Deal Value</span>
                        <span className="text-primary font-bold">${Number(lead.dealValue).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Interest</span>
                      <span className="text-foreground text-xs">
                        {{ sprint: "Sprint ($15k)", advisory: "Advisory ($10k/mo)", both: "Both", unknown: "Unknown" }[lead.offerInterest]}
                      </span>
                    </div>
                  </div>
                )}

                {lead.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{lead.notes}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Added {new Date(lead.createdAt).toLocaleDateString()}
                  </div>
                  {lead.lastContactedAt && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Last contact {new Date(lead.lastContactedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-[oklch(0.78_0.18_195_/_0.3)] text-[oklch(0.78_0.18_195)] hover:bg-[oklch(0.78_0.18_195_/_0.08)] text-sm"
                onClick={() => setEmailDialogOpen(true)}
              >
                <Mail className="w-3.5 h-3.5 mr-2" /> Send Email
              </Button>
              <SendEmailDialog
                open={emailDialogOpen}
                onOpenChange={setEmailDialogOpen}
                leadId={leadId}
                leadName={`${lead.firstName} ${lead.lastName}`}
                leadEmail={lead.email}
              />
              <Link href={`/book`} className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-start border-border text-foreground hover:bg-secondary text-sm">
                  <Calendar className="w-3.5 h-3.5 mr-2 text-primary" /> Schedule Call
                </Button>
              </Link>
              {lead.stage !== "closed_won" && lead.stage !== "closed_lost" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-[oklch(0.65_0.18_160_/_0.5)] text-[oklch(0.65_0.18_160)] hover:bg-[oklch(0.65_0.18_160_/_0.1)] text-sm"
                  onClick={() => update.mutate({ id: leadId, stage: "closed_won" })}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Mark Closed Won
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <AddInteractionForm leadId={leadId} onAdded={() => utils.lead.get.invalidate({ id: leadId })} />

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Interaction Timeline</h3>
            {timeline.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                No interactions yet. Log your first one above.
              </div>
            ) : (
              <div className="space-y-3">
                {timeline.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${INTERACTION_COLORS[item.type as InteractionType]}`}>
                      {INTERACTION_ICONS[item.type as InteractionType]}
                    </div>
                    <div className="flex-1 rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {item.body && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
