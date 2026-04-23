import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Save,
  X,
  Lock,
  Mail,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────
type Category =
  | "first_touch"
  | "follow_up"
  | "proposal"
  | "closed_won"
  | "re_engagement"
  | "custom";

const CATEGORY_LABELS: Record<Category, string> = {
  first_touch: "First Touch",
  follow_up: "Follow-Up",
  proposal: "Proposal",
  closed_won: "Closed Won",
  re_engagement: "Re-Engagement",
  custom: "Custom",
};

const CATEGORY_COLORS: Record<Category, string> = {
  first_touch: "text-primary border-primary/20 bg-primary/10",
  follow_up: "text-yellow-400 border-yellow-400/20 bg-yellow-400/10",
  proposal: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
  closed_won: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
  re_engagement: "text-destructive border-destructive/20 bg-destructive/10",
  custom: "text-muted-foreground border-border/40 bg-secondary/20",
};

// ─── Blank form state ─────────────────────────────────────────────────────────
const BLANK_FORM = {
  name: "",
  category: "custom" as Category,
  subject: "",
  bodyHtml: "",
  variables: [] as string[],
};

// ─── Variable chip input ──────────────────────────────────────────────────────
function VariableChips({
  variables,
  onChange,
}: {
  variables: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim().replace(/[^a-zA-Z0-9_]/g, "");
    if (v && !variables.includes(v)) onChange([...variables, v]);
    setInput("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {variables.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20"
          >
            {`{{${v}}}`}
            <button
              type="button"
              onClick={() => onChange(variables.filter((x) => x !== v))}
              className="hover:text-destructive ml-0.5"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="variableName (press Enter)"
          className="h-7 text-xs font-mono bg-background/50 border-border text-foreground"
        />
        <Button type="button" size="sm" variant="outline" onClick={add} className="h-7 text-xs">
          Add
        </Button>
      </div>
    </div>
  );
}

// ─── Preview panel ────────────────────────────────────────────────────────────
function PreviewPanel({
  templateId,
  onClose,
}: {
  templateId: number;
  onClose: () => void;
}) {
  const [overrides, setOverrides] = useState<Record<string, string>>({
    firstName: "Sarah",
    company: "FinTech Corp",
    jobTitle: "VP Engineering",
    painPoint: "slow deployment cycles",
    proposalValue: "$12,000",
    sprintScope: "CI/CD pipeline rebuild + Kubernetes migration",
    startDate: "March 10, 2026",
    deliverable: "Full CI/CD pipeline with zero-downtime deploys",
    previousContext: "We spoke about your infrastructure scaling challenges.",
  });

  const { data, isLoading, refetch } = trpc.emailTemplate.preview.useQuery(
    { templateId, overrides },
    { enabled: !!templateId }
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <span className="font-mono text-[10px] font-bold text-primary tracking-[0.2em] uppercase">LIVE PREVIEW</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Variable overrides */}
      <div className="p-4 border-b border-border/40 bg-secondary/10">
        <p className="text-[9px] opacity-50 mb-2 font-mono uppercase tracking-widest">// TEST VALUES (edit to preview merge)</p>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(overrides).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-primary/70 w-28 shrink-0 truncate">{`{{${k}}}`}</span>
              <Input
                value={v}
                onChange={(e) =>
                  setOverrides((prev) => ({ ...prev, [k]: e.target.value }))
                }
                className="h-6 text-[10px] bg-background/50 border-border text-foreground"
              />
            </div>
          ))}
        </div>
        {data?.missingVars && data.missingVars.length > 0 && (
          <p className="text-[10px] text-red-400 mt-2">
            ⚠ Missing: {data.missingVars.map((v) => `{{${v}}}`).join(", ")}
          </p>
        )}
      </div>

      {/* Rendered preview */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            Rendering…
          </div>
        ) : data ? (
          <>
            <div className="mb-3 p-3 rounded-lg bg-secondary/20 border border-border">
              <p className="font-mono text-[9px] font-bold text-foreground/40 uppercase tracking-widest mb-1">SUBJECT</p>
              <p className="text-sm text-foreground font-medium">{data.subject}</p>
            </div>
            <div className="rounded-lg border border-border overflow-hidden shadow-2xl">
              <iframe
                srcDoc={`<html><head><style>body{margin:0;padding:0;background:#050508;font-family:'Segoe UI',Arial,sans-serif;color:#E5E7EB;font-size:15px;line-height:1.7;}p{margin:0 0 1em 0;}ul,ol{margin:0 0 1em 0;padding-left:1.5em;}li{margin-bottom:0.25em;}strong{color:#F9FAFB;}</style></head><body style="padding:24px">${data.bodyHtml}</body></html>`}
                className="w-full h-96 border-0"
                title="Email preview"
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Template form ────────────────────────────────────────────────────────────
function TemplateForm({
  initial,
  isBuiltIn,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: typeof BLANK_FORM & { id?: number };
  isBuiltIn?: boolean;
  onSave: (data: typeof BLANK_FORM) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState(initial);

  return (
    <div className="space-y-4">
      {isBuiltIn && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
          <Lock className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs text-yellow-400">Built-in template — edits create a copy</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="hud-label text-[9px] opacity-50 block mb-1">TEMPLATE NAME</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. LinkedIn First Touch"
            className="bg-card/40 border-border/40 text-foreground"
          />
        </div>
        <div>
          <label className="hud-label text-[9px] opacity-50 block mb-1">CATEGORY</label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}
          >
            <SelectTrigger className="bg-card/40 border-border/40 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="hud-label text-[9px] opacity-50 block mb-1">SUBJECT LINE</label>
        <Input
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="Use {{variable}} for merge fields"
          className="bg-card/40 border-border/40 text-foreground font-mono text-sm"
        />
      </div>

      <div>
        <label className="hud-label text-[9px] opacity-50 block mb-1">BODY HTML</label>
        <Textarea
          value={form.bodyHtml}
          onChange={(e) => setForm((f) => ({ ...f, bodyHtml: e.target.value }))}
          rows={12}
          placeholder="<p>Hi {{firstName}},</p>..."
          className="bg-card/40 border-border/40 text-foreground font-mono text-xs resize-none"
        />
      </div>

      <div>
        <label className="hud-label text-[9px] opacity-50 block mb-1">MERGE VARIABLES</label>
        <VariableChips
          variables={form.variables}
          onChange={(v) => setForm((f) => ({ ...f, variables: v }))}
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          onClick={() => onSave(form)}
          disabled={isSaving || !form.name || !form.subject || !form.bodyHtml}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
        >
          {isSaving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" />
          ) : (
            <Save className="w-3.5 h-3.5 mr-2" />
          )}
          {isBuiltIn ? "Save as New Template" : "Save Template"}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
          <X className="w-3.5 h-3.5 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EmailTemplates() {
  const utils = trpc.useUtils();
  const { data: templates = [], isLoading } = trpc.emailTemplate.list.useQuery();
  const seedMutation = trpc.emailTemplate.seedBuiltIns.useMutation({
    onSuccess: () => {
      utils.emailTemplate.list.invalidate();
      toast.success("Built-in templates seeded");
    },
  });
  const createMutation = trpc.emailTemplate.create.useMutation({
    onSuccess: () => {
      utils.emailTemplate.list.invalidate();
      setMode("list");
      toast.success("Template created");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.emailTemplate.update.useMutation({
    onSuccess: () => {
      utils.emailTemplate.list.invalidate();
      setMode("list");
      toast.success("Template updated");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.emailTemplate.delete.useMutation({
    onSuccess: () => {
      utils.emailTemplate.list.invalidate();
      setDeleteId(null);
      toast.success("Template deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  type Mode = "list" | "create" | { edit: number } | { preview: number };
  const [mode, setMode] = useState<Mode>("list");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Auto-seed built-ins on first load if empty
  useEffect(() => {
    if (!isLoading && templates.length === 0) {
      seedMutation.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const editingTemplate =
    typeof mode === "object" && "edit" in mode
      ? templates.find((t) => t.id === mode.edit)
      : null;

  const previewTemplateId =
    typeof mode === "object" && "preview" in mode ? mode.preview : null;

  function handleSave(data: typeof BLANK_FORM) {
    if (editingTemplate?.isBuiltIn) {
      // Built-in: create a copy
      createMutation.mutate({ ...data, category: data.category as Category });
    } else if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Left panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-primary" />
              <h1 className="font-display font-bold text-3xl text-foreground tracking-tight">Email Templates</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {templates.length} template{templates.length !== 1 ? "s" : ""} · Personalized outreach with merge variables
            </p>
          </div>
          <div className="flex items-center gap-2">
            {templates.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="border-border/40 text-muted-foreground hover:bg-secondary/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${seedMutation.isPending ? "animate-spin" : ""}`} />
                Seed Built-ins
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setMode("create")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-widest text-[10px] px-6 h-10 shadow-[0_0_20px_var(--primary-glow)] transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              NEW TEMPLATE
            </Button>
          </div>
        </div>

        {/* Content */}
        {mode === "list" ? (
          <div className="flex-1 overflow-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading templates…
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Mail className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">No templates yet.</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => seedMutation.mutate()}
                  className="mt-2 text-primary"
                >
                  Seed built-in templates
                </Button>
              </div>
            ) : (
              templates.map((t) => {
                const cat = t.category as Category;
                const isActive =
                  (typeof mode === "object" && "preview" in mode && (mode as { preview: number }).preview === t.id) ||
                  (typeof mode === "object" && "edit" in mode && (mode as { edit: number }).edit === t.id);
                return (
                  <Card
                    key={t.id}
                    className={`rounded-xl p-4 transition-all bg-card/40 ${isActive ? "border-primary/40 bg-primary/5" : "hover:border-primary/40"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${CATEGORY_COLORS[cat]}`}>
                            {CATEGORY_LABELS[cat]}
                          </span>
                          {t.isBuiltIn && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-muted-foreground border border-border/40">
                              <Lock className="w-2.5 h-2.5" /> BUILT-IN
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-foreground text-sm truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">{t.subject}</p>
                        {(t.variables as string[])?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(t.variables as string[]).map((v) => (
                              <span key={v} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                {`{{${v}}}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setMode({ preview: t.id })}
                          className="h-7 w-7 p-0 text-foreground/40 hover:text-primary transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setMode({ edit: t.id })}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                          title={t.isBuiltIn ? "Edit (creates copy)" : "Edit"}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {!t.isBuiltIn && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(t.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        ) : mode === "create" ? (
          <div className="flex-1 overflow-auto">
            <div className="flex items-center gap-2 mb-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMode("list")}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </Button>
              <span className="hud-label text-primary font-mono">// NEW TEMPLATE</span>
            </div>
            <TemplateForm
              initial={BLANK_FORM}
              onSave={handleSave}
              onCancel={() => setMode("list")}
              isSaving={isSaving}
            />
          </div>
        ) : editingTemplate ? (
          <div className="flex-1 overflow-auto">
            <div className="flex items-center gap-2 mb-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMode("list")}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </Button>
              <span className="hud-label text-primary font-mono">
                // {editingTemplate.isBuiltIn ? "EDIT COPY" : "EDIT TEMPLATE"}
              </span>
            </div>
            <TemplateForm
              initial={{
                name: editingTemplate.isBuiltIn ? `${editingTemplate.name} (Copy)` : editingTemplate.name,
                category: editingTemplate.category as Category,
                subject: editingTemplate.subject,
                bodyHtml: editingTemplate.bodyHtml,
                variables: (editingTemplate.variables as string[]) ?? [],
                id: editingTemplate.id,
              }}
              isBuiltIn={editingTemplate.isBuiltIn}
              onSave={handleSave}
              onCancel={() => setMode("list")}
              isSaving={isSaving}
            />
          </div>
        ) : null}
      </div>

      {/* Right panel: live preview */}
      {previewTemplateId && (
        <Card className="w-[480px] shrink-0 bg-card/40 border-border/40 rounded-xl overflow-hidden flex flex-col shadow-2xl">
          <PreviewPanel
            templateId={previewTemplateId}
            onClose={() => setMode("list")}
          />
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Template?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The template will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/40 text-muted-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
