import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Send, Eye, EyeOff, RefreshCw, ChevronDown } from "lucide-react";

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

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  leadName: string;
  leadEmail: string;
}

export default function SendEmailDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadEmail,
}: SendEmailDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(true);

  const { data: templates = [], isLoading: loadingTemplates } =
    trpc.emailTemplate.list.useQuery(undefined, { enabled: open });

  const { data: preview, isLoading: loadingPreview } =
    trpc.emailTemplate.preview.useQuery(
      { templateId: selectedTemplateId!, leadId, overrides },
      { enabled: !!selectedTemplateId }
    );

  const sendMutation = trpc.emailTemplate.sendOutreach.useMutation({
    onSuccess: (result) => {
      toast.success(`Email sent to ${result.to}`, {
        description: result.subject,
      });
      onOpenChange(false);
    },
    onError: (e) => toast.error(`Send failed: ${e.message}`),
  });

  // When a template is selected, pre-populate overrides from its variable list
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  useEffect(() => {
    if (!selectedTemplate) return;
    const vars = (selectedTemplate.variables as string[]) ?? [];
    setOverrides((prev) => {
      const next: Record<string, string> = {};
      vars.forEach((v) => {
        next[v] = prev[v] ?? "";
      });
      return next;
    });
  }, [selectedTemplateId]);

  // Group templates by category
  const grouped = templates.reduce<Record<string, typeof templates>>((acc, t) => {
    const cat = t.category as Category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[85vw] max-w-[85vw] !max-w-[85vw] bg-[oklch(0.07_0.008_250)] border-[oklch(0.78_0.18_195_/_0.2)] text-foreground p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-[oklch(0.78_0.18_195_/_0.12)]">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Mail className="w-4 h-4 text-[oklch(0.78_0.18_195)]" />
            Send Outreach Email
            <span className="text-[oklch(0.55_0.015_220)] font-normal text-sm ml-1">
              → {leadName} &lt;{leadEmail}&gt;
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex divide-x divide-[oklch(0.78_0.18_195_/_0.10)]" style={{ minHeight: 480 }}>
          {/* Left: template picker + variable overrides */}
          <div className="w-64 shrink-0 p-4 space-y-4 overflow-y-auto">
            <div>
              <p className="hud-label text-[9px] opacity-40 mb-2">SELECT TEMPLATE</p>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-[oklch(0.55_0.015_220)] text-xs">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Loading…
                </div>
              ) : (
                <div className="space-y-1">
                  {(Object.keys(grouped) as Category[]).map((cat) => (
                    <div key={cat}>
                      <p className="text-[9px] font-semibold text-[oklch(0.45_0.015_220)] uppercase tracking-wider px-2 py-1">
                        {CATEGORY_LABELS[cat]}
                      </p>
                      {grouped[cat].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTemplateId(t.id)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all ${
                            selectedTemplateId === t.id
                              ? "bg-[oklch(0.82_0.20_58_/_0.15)] text-[oklch(0.82_0.20_58)] border border-[oklch(0.82_0.20_58_/_0.3)]"
                              : "text-[oklch(0.65_0.015_220)] hover:bg-[oklch(0.78_0.18_195_/_0.06)] hover:text-foreground"
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Variable overrides */}
            {selectedTemplate && Object.keys(overrides).length > 0 && (
              <div>
                <p className="hud-label text-[9px] opacity-40 mb-2">MERGE VARIABLES</p>
                <div className="space-y-2">
                  {Object.entries(overrides).map(([k, v]) => (
                    <div key={k}>
                      <label className="text-[9px] font-mono text-[oklch(0.78_0.18_195_/_0.6)] block mb-0.5">
                        {`{{${k}}}`}
                      </label>
                      <Input
                        value={v}
                        onChange={(e) =>
                          setOverrides((prev) => ({ ...prev, [k]: e.target.value }))
                        }
                        placeholder={`Enter ${k}…`}
                        className="h-6 text-[10px] bg-[oklch(0.06_0.008_250)] border-[oklch(0.78_0.18_195_/_0.15)] text-foreground"
                      />
                    </div>
                  ))}
                </div>
                {preview?.missingVars && preview.missingVars.length > 0 && (
                  <p className="text-[10px] text-[oklch(0.82_0.20_58)] mt-2">
                    ⚠ Unfilled: {preview.missingVars.map((v) => `{{${v}}}`).join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right: preview */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Preview toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[oklch(0.78_0.18_195_/_0.08)] bg-[oklch(0.055_0.008_250)]">
              <div className="flex items-center gap-2">
                {preview && (
                  <span className="text-xs text-foreground font-medium truncate max-w-xs">
                    {preview.subject}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPreview((v) => !v)}
                className="h-6 px-2 text-[10px] text-[oklch(0.55_0.015_220)] hover:text-foreground"
              >
                {showPreview ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {!selectedTemplateId ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[oklch(0.45_0.015_220)]">
                  <ChevronDown className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Select a template to preview</p>
                </div>
              ) : loadingPreview ? (
                <div className="flex items-center justify-center h-full text-[oklch(0.55_0.015_220)]">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Rendering…
                </div>
              ) : preview && showPreview ? (
                <iframe
                  srcDoc={`<html><head><style>body{margin:0;padding:0;background:#050508;font-family:'Segoe UI',Arial,sans-serif;color:#E5E7EB;font-size:14px;line-height:1.7;}p{margin:0 0 1em 0;}ul,ol{margin:0 0 1em 0;padding-left:1.5em;}li{margin-bottom:0.25em;}strong{color:#F9FAFB;}</style></head><body style="padding:20px">${preview.bodyHtml}</body></html>`}
                  className="w-full h-full border-0 rounded-lg"
                  style={{ minHeight: 380 }}
                  title="Email preview"
                />
              ) : preview ? (
                <div className="text-xs text-[oklch(0.55_0.015_220)] font-mono whitespace-pre-wrap">
                  {preview.bodyHtml}
                </div>
              ) : null}
            </div>

            {/* Send button */}
            <div className="px-4 py-3 border-t border-[oklch(0.78_0.18_195_/_0.10)] flex items-center justify-between">
              <p className="text-xs text-[oklch(0.45_0.015_220)]">
                Sends via Resend · logs to lead timeline
              </p>
              <Button
                onClick={() =>
                  selectedTemplateId &&
                  sendMutation.mutate({ templateId: selectedTemplateId, leadId, overrides })
                }
                disabled={!selectedTemplateId || sendMutation.isPending}
                className="bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] hover:bg-[oklch(0.88_0.18_60)] font-bold"
              >
                {sendMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-2" />
                )}
                Send Email
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
