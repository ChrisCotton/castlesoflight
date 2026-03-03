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
  first_touch: "text-[oklch(0.78_0.18_195)] border-[oklch(0.78_0.18_195_/_0.3)] bg-[oklch(0.78_0.18_195_/_0.08)]",
  follow_up: "text-[oklch(0.82_0.20_58)] border-[oklch(0.82_0.20_58_/_0.3)] bg-[oklch(0.82_0.20_58_/_0.08)]",
  proposal: "text-[oklch(0.72_0.20_290)] border-[oklch(0.72_0.20_290_/_0.3)] bg-[oklch(0.72_0.20_290_/_0.08)]",
  closed_won: "text-[oklch(0.72_0.18_155)] border-[oklch(0.72_0.18_155_/_0.3)] bg-[oklch(0.72_0.18_155_/_0.08)]",
  re_engagement: "text-[oklch(0.65_0.15_25)] border-[oklch(0.65_0.15_25_/_0.3)] bg-[oklch(0.65_0.15_25_/_0.08)]",
  custom: "text-[oklch(0.55_0.015_220)] border-[oklch(0.55_0.015_220_/_0.3)] bg-[oklch(0.55_0.015_220_/_0.08)]",
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
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[oklch(0.78_0.18_195_/_0.12)] text-[oklch(0.78_0.18_195)] border border-[oklch(0.78_0.18_195_/_0.25)]"
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
          className="h-7 text-xs font-mono bg-[oklch(0.06_0.008_250)] border-[oklch(0.78_0.18_195_/_0.2)] text-foreground"
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
      <div className="flex items-center justify-between p-4 border-b border-[oklch(0.78_0.18_195_/_0.12)]">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[oklch(0.78_0.18_195)]" />
          <span className="hud-label text-[oklch(0.78_0.18_195)]">LIVE PREVIEW</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            className="h-7 w-7 p-0 text-[oklch(0.55_0.015_220)] hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 p-0 text-[oklch(0.55_0.015_220)] hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Variable overrides */}
      <div className="p-4 border-b border-[oklch(0.78_0.18_195_/_0.08)] bg-[oklch(0.055_0.008_250)]">
        <p className="hud-label text-[9px] opacity-50 mb-2">TEST VALUES (edit to preview merge)</p>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(overrides).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[oklch(0.78_0.18_195_/_0.7)] w-28 shrink-0 truncate">{`{{${k}}}`}</span>
              <Input
                value={v}
                onChange={(e) =>
                  setOverrides((prev) => ({ ...prev, [k]: e.target.value }))
                }
                className="h-6 text-[10px] bg-[oklch(0.06_0.008_250)] border-[oklch(0.78_0.18_195_/_0.15)] text-foreground"
              />
            </div>
          ))}
        </div>
        {data?.missingVars && data.missingVars.length > 0 && (
          <p className="text-[10px] text-[oklch(0.82_0.20_58)] mt-2">
            ⚠ Missing: {data.missingVars.map((v) => `{{${v}}}`).join(", ")}
          </p>
        )}
      </div>

      {/* Rendered preview */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-[oklch(0.55_0.015_220)]">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            Rendering…
          </div>
        ) : data ? (
          <>
            <div className="mb-3 p-3 rounded-lg bg-[oklch(0.06_0.008_250)] border border-[oklch(0.78_0.18_195_/_0.12)]">
              <p className="hud-label text-[9px] opacity-40 mb-1">SUBJECT</p>
              <p className="text-sm text-foreground font-medium">{data.subject}</p>
            </div>
            <div className="rounded-lg border border-[oklch(0.78_0.18_195_/_0.12)] overflow-hidden">
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
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[oklch(0.82_0.20_58_/_0.08)] border border-[oklch(0.82_0.20_58_/_0.2)]">
          <Lock className="w-3.5 h-3.5 text-[oklch(0.82_0.20_58)]" />
          <span className="text-xs text-[oklch(0.82_0.20_58)]">Built-in template — edits create a copy</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="hud-label text-[9px] opacity-50 block mb-1">TEMPLATE NAME</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. LinkedIn First Touch"
            className="bg-[oklch(0.06_0.008_250)] border-[oklch(0.78_0.18_195_/_0.2)] text-foreground"
          />
        </div>
        <div>
          <label className="hud-label text-[9px] opacity-50 block mb-1">CATEGORY</label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}
          >
            <SelectTrigger className="bg-[oklch(0.06_0.008_250)] border-[oklch(0.78_0.18_195_/_0.2)] text-foreground">
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
          className="bg-[oklch(0.06_0.008_250)] border-[oklch(0.78_0.18_195_/_0.2)] text-foreground font-mono text-sm"
        />
      </div>

      <div>
        <label className="hud-label text-[9px] opacity-50 block mb-1">BODY HTML</label>
        <Textarea
          value={form.bodyHtml}
          onChange={(e) => setForm((f) => ({ ...f, bodyHtml: e.target.value }))}
          rows={12}
          placeholder="<p>Hi {{firstName}},</p>..."
          className="bg-[oklch(0.06_0.008_250)] border-[oklch(0.78_0.18_195_/_0.2)] text-foreground font-mono text-xs resize-none"
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
          className="bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] hover:bg-[oklch(0.88_0.18_60)] font-bold"
        >
          {isSaving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" />
          ) : (
            <Save className="w-3.5 h-3.5 mr-2" />
          )}
          {isBuiltIn ? "Save as New Template" : "Save Template"}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="text-[oklch(0.55_0.015_220)]">
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
              <FileText className="w-5 h-5 text-[oklch(0.78_0.18_195)]" />
              <h1 className="font-display font-bold text-xl text-foreground">Email Templates</h1>
            </div>
            <p className="text-sm text-[oklch(0.55_0.015_220)]">
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
                className="border-[oklch(0.78_0.18_195_/_0.3)] text-[oklch(0.78_0.18_195)] hover:bg-[oklch(0.78_0.18_195_/_0.08)]"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${seedMutation.isPending ? "animate-spin" : ""}`} />
                Seed Built-ins
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setMode("create")}
              className="bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] hover:bg-[oklch(0.88_0.18_60)] font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Template
            </Button>
          </div>
        </div>

        {/* Content */}
        {mode === "list" ? (
          <div className="flex-1 overflow-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-[oklch(0.55_0.015_220)]">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading templates…
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Mail className="w-10 h-10 text-[oklch(0.55_0.015_220_/_0.4)] mb-3" />
                <p className="text-[oklch(0.55_0.015_220)] text-sm">No templates yet.</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => seedMutation.mutate()}
                  className="mt-2 text-[oklch(0.78_0.18_195)]"
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
                  <div
                    key={t.id}
                    className={`hud-card rounded-xl p-4 transition-all ${isActive ? "border-[oklch(0.82_0.20_58_/_0.4)] bg-[oklch(0.82_0.20_58_/_0.04)]" : "hover:border-[oklch(0.78_0.18_195_/_0.2)]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${CATEGORY_COLORS[cat]}`}>
                            {CATEGORY_LABELS[cat]}
                          </span>
                          {t.isBuiltIn && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-[oklch(0.55_0.015_220)] border border-[oklch(0.55_0.015_220_/_0.2)]">
                              <Lock className="w-2.5 h-2.5" /> BUILT-IN
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-foreground text-sm truncate">{t.name}</p>
                        <p className="text-xs text-[oklch(0.55_0.015_220)] truncate mt-0.5 font-mono">{t.subject}</p>
                        {(t.variables as string[])?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(t.variables as string[]).map((v) => (
                              <span key={v} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[oklch(0.78_0.18_195_/_0.08)] text-[oklch(0.78_0.18_195_/_0.7)] border border-[oklch(0.78_0.18_195_/_0.15)]">
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
                          className="h-7 w-7 p-0 text-[oklch(0.55_0.015_220)] hover:text-[oklch(0.78_0.18_195)]"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setMode({ edit: t.id })}
                          className="h-7 w-7 p-0 text-[oklch(0.55_0.015_220)] hover:text-[oklch(0.82_0.20_58)]"
                          title={t.isBuiltIn ? "Edit (creates copy)" : "Edit"}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {!t.isBuiltIn && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(t.id)}
                            className="h-7 w-7 p-0 text-[oklch(0.55_0.015_220)] hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-[oklch(0.35_0.01_220)]" />
                      </div>
                    </div>
                  </div>
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
                className="text-[oklch(0.55_0.015_220)] hover:text-foreground"
              >
                ← Back
              </Button>
              <span className="hud-label text-[oklch(0.78_0.18_195)]">NEW TEMPLATE</span>
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
                className="text-[oklch(0.55_0.015_220)] hover:text-foreground"
              >
                ← Back
              </Button>
              <span className="hud-label text-[oklch(0.82_0.20_58)]">
                {editingTemplate.isBuiltIn ? "EDIT COPY" : "EDIT TEMPLATE"}
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
        <div className="w-[480px] shrink-0 hud-card rounded-xl overflow-hidden flex flex-col">
          <PreviewPanel
            templateId={previewTemplateId}
            onClose={() => setMode("list")}
          />
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[oklch(0.07_0.008_250)] border-[oklch(0.78_0.18_195_/_0.2)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Template?</AlertDialogTitle>
            <AlertDialogDescription className="text-[oklch(0.55_0.015_220)]">
              This action cannot be undone. The template will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[oklch(0.78_0.18_195_/_0.2)] text-[oklch(0.78_0.18_195)]">
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
