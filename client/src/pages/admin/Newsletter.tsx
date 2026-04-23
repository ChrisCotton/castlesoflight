import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Users, Send, FileText, Plus, Trash2, Eye, Edit3,
  CheckCircle, Clock, AlertCircle, Mail
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Tab = "subscribers" | "compose" | "issues";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  unsubscribed: "bg-destructive/10 text-destructive border border-destructive/20",
  bounced: "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20",
};

const ISSUE_STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20",
  sent: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  scheduled: "bg-primary/10 text-primary border border-primary/20",
};

const SOURCE_LABELS: Record<string, string> = {
  landing_page: "Landing Page",
  book_download: "Book Download",
  booking: "Booking",
  contact_form: "Contact Form",
  manual: "Manual",
  other: "Other",
};

export default function Newsletter() {
  const [tab, setTab] = useState<Tab>("subscribers");
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Form state for compose
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [htmlBody, setHtmlBody] = useState("");

  const utils = trpc.useUtils();

  const { data: subscribers = [], isLoading: subsLoading } = trpc.newsletter.listSubscribers.useQuery({});
  const { data: issues = [], isLoading: issuesLoading } = trpc.newsletter.listIssues.useQuery();
  const { data: subCount = 0 } = trpc.newsletter.subscriberCount.useQuery();

  const createIssue = trpc.newsletter.createIssue.useMutation({
    onSuccess: () => {
      toast.success("Draft saved successfully");
      utils.newsletter.listIssues.invalidate();
      setSubject(""); setPreviewText(""); setHtmlBody("");
      setTab("issues");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateIssue = trpc.newsletter.updateIssue.useMutation({
    onSuccess: () => {
      toast.success("Issue updated");
      utils.newsletter.listIssues.invalidate();
      setEditingIssueId(null);
      setSubject(""); setPreviewText(""); setHtmlBody("");
    },
    onError: (e) => toast.error(e.message),
  });

  const sendIssue = trpc.newsletter.sendIssue.useMutation({
    onSuccess: (data) => {
      toast.success(`Broadcast sent! ${data.sent} delivered${data.failed ? `, ${data.failed} failed` : ""}`);
      utils.newsletter.listIssues.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteSubscriber = trpc.newsletter.deleteSubscriber.useMutation({
    onSuccess: () => {
      toast.success("Subscriber removed");
      utils.newsletter.listSubscribers.invalidate();
      utils.newsletter.subscriberCount.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSaveDraft = () => {
    if (!subject.trim() || !htmlBody.trim()) {
      toast.error("Subject and HTML body are required");
      return;
    }
    if (editingIssueId) {
      updateIssue.mutate({ id: editingIssueId, subject, previewText, htmlBody });
    } else {
      createIssue.mutate({ subject, previewText, htmlBody });
    }
  };

  const handleEditIssue = (issue: { id: number; subject: string; previewText?: string | null; htmlBody: string }) => {
    setEditingIssueId(issue.id);
    setSubject(issue.subject);
    setPreviewText(issue.previewText ?? "");
    setHtmlBody(issue.htmlBody);
    setTab("compose");
  };

  const handleSendIssue = (id: number, recipientCount: number) => {
    if (!confirm(`Send this issue to ${subCount} active subscribers? This cannot be undone.`)) return;
    sendIssue.mutate({ id });
  };

  const activeCount = subscribers.filter((s) => s.status === "active").length;
  const unsubCount = subscribers.filter((s) => s.status === "unsubscribed").length;
  const sentIssues = issues.filter((i) => i.status === "sent").length;
  const draftIssues = issues.filter((i) => i.status === "draft").length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold text-primary tracking-[0.3em] mb-1 uppercase opacity-60">// BROADCAST INTELLIGENCE</p>
            <h1 className="text-4xl font-bold text-foreground font-display tracking-tight">Newsletter Command</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-400/30 bg-emerald-400/5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_var(--emerald-400)]" />
            <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-widest">{subCount} ACTIVE SUBSCRIBERS</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Subscribers", value: activeCount, icon: Users, color: "text-emerald-400" },
            { label: "Unsubscribed", value: unsubCount, icon: AlertCircle, color: "text-red-400" },
            { label: "Issues Sent", value: sentIssues, icon: CheckCircle, color: "text-primary" },
            { label: "Drafts", value: draftIssues, icon: Clock, color: "text-yellow-400" },
          ].map((stat) => (
            <Card key={stat.label} className="p-5 shadow-lg border-border/40 bg-card/40">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color} opacity-80`} />
                <span className="text-[10px] font-mono font-bold text-foreground/40 tracking-widest uppercase">{stat.label.toUpperCase()}</span>
              </div>
              <p className={`text-4xl font-bold font-display tracking-tight ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/20 border border-border/40 w-fit">
          {(["subscribers", "compose", "issues"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-widest transition-all ${
                tab === t
                  ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_var(--primary-glow)]"
                  : "text-foreground/40 hover:text-foreground hover:bg-white/5"
              }`}
            >
              {t === "subscribers" && <Users className="inline w-3.5 h-3.5 mr-1.5" />}
              {t === "compose" && <Edit3 className="inline w-3.5 h-3.5 mr-1.5" />}
              {t === "issues" && <FileText className="inline w-3.5 h-3.5 mr-1.5" />}
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Subscribers Tab */}
        {tab === "subscribers" && (
          <Card className="overflow-hidden border-border/40 bg-card/40">
            <div className="p-4 border-b border-border/40 bg-secondary/20 flex items-center justify-between">
              <p className="font-mono text-[10px] font-bold text-primary tracking-[0.2em] uppercase opacity-70">// SUBSCRIBER REPOSITORY</p>
              <span className="text-xs text-muted-foreground">{subscribers.length} total</span>
            </div>
            {subsLoading ? (
              <div className="p-8 text-center text-muted-foreground font-mono text-sm">LOADING...</div>
            ) : subscribers.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-mono text-sm">NO SUBSCRIBERS YET</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Share your newsletter signup to start building your list</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-xs font-mono text-muted-foreground">EMAIL</th>
                      <th className="text-left p-3 text-xs font-mono text-muted-foreground">NAME</th>
                      <th className="text-left p-3 text-xs font-mono text-muted-foreground">SOURCE</th>
                      <th className="text-left p-3 text-xs font-mono text-muted-foreground">STATUS</th>
                      <th className="text-left p-3 text-xs font-mono text-muted-foreground">SUBSCRIBED</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="border-b border-border/40 hover:bg-white/5 transition-colors group">
                        <td className="p-4 font-mono text-xs text-primary">{sub.email}</td>
                        <td className="p-3 text-foreground">
                          {sub.firstName || sub.lastName
                            ? `${sub.firstName ?? ""} ${sub.lastName ?? ""}`.trim()
                            : <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="p-3">
                          <span className="text-xs text-muted-foreground">
                            {SOURCE_LABELS[sub.source] ?? sub.source}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-mono ${STATUS_STYLES[sub.status] ?? ""}`}>
                            {sub.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(sub.subscribedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${sub.email} from subscribers?`)) {
                                deleteSubscriber.mutate({ id: sub.id });
                              }
                            }}
                            className="text-red-400/60 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Compose Tab */}
        {tab === "compose" && (
          <div className="space-y-4">
            <Card className="p-6 space-y-4 border-border/40 bg-card/40">
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                  {editingIssueId ? `// UPDATING BROADCAST ISSUE #${editingIssueId}` : "// COMPOSE NEW BROADCAST"}
                </p>
                {editingIssueId && (
                  <button
                    onClick={() => { setEditingIssueId(null); setSubject(""); setPreviewText(""); setHtmlBody(""); }}
                    className="text-xs text-muted-foreground hover:text-foreground font-mono"
                  >
                    [CLEAR]
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground block mb-1.5">SUBJECT LINE *</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. How I cut cloud costs 80% in one weekend"
                  className="bg-background/50 border-border font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground block mb-1.5">PREVIEW TEXT</label>
                <Input
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Short preview shown in email clients..."
                  className="bg-background/50 border-border font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-muted-foreground">HTML BODY *</label>
                  {htmlBody && (
                    <button
                      onClick={() => setPreviewHtml(htmlBody)}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> PREVIEW
                    </button>
                  )}
                </div>
                <Textarea
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  placeholder="<p>Your HTML email content here...</p>&#10;&#10;Tip: Use {{UNSUBSCRIBE_URL}} as a placeholder for the unsubscribe link."
                  className="bg-background/50 border-border font-mono text-xs min-h-[280px]"
                />
                <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
                  Use <code className="text-amber-400">{"{{UNSUBSCRIBE_URL}}"}</code> in your HTML — it will be replaced with each subscriber's personal unsubscribe link.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSaveDraft}
                  disabled={createIssue.isPending || updateIssue.isPending}
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {createIssue.isPending || updateIssue.isPending ? "SAVING..." : "SAVE DRAFT"}
                </Button>
              </div>
            </Card>

            {/* HTML Preview Modal */}
            {previewHtml && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <p className="text-xs font-mono text-cyan-400">// EMAIL PREVIEW</p>
                    <button onClick={() => setPreviewHtml(null)} className="text-muted-foreground hover:text-foreground text-xs font-mono">[CLOSE]</button>
                  </div>
                  <div className="overflow-auto flex-1 p-4">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-[500px] rounded border border-border bg-white"
                      title="Email Preview"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Issues Tab */}
        {tab === "issues" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => { setEditingIssueId(null); setSubject(""); setPreviewText(""); setHtmlBody(""); setTab("compose"); }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-widest text-[10px] px-6 h-10 shadow-[0_0_20px_var(--primary-glow)] transition-all"
              >
                <Plus className="w-4 h-4 mr-2" /> COMPOSE NEW ISSUE
              </Button>
            </div>

            {issuesLoading ? (
              <Card className="p-8 text-center text-muted-foreground font-mono text-sm border-border/40 bg-card/40">LOADING...</Card>
            ) : issues.length === 0 ? (
              <Card className="p-12 text-center border-border/40 bg-card/40">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-mono text-sm">NO ISSUES YET</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Create your first newsletter issue</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <Card key={issue.id} className="p-5 border-border/40 bg-card/40">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-mono ${ISSUE_STATUS_STYLES[issue.status] ?? ""}`}>
                            {issue.status.toUpperCase()}
                          </span>
                          {issue.status === "sent" && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {issue.recipientCount} recipients · {issue.sentAt ? new Date(issue.sentAt).toLocaleDateString() : ""}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground truncate">{issue.subject}</h3>
                        {issue.previewText && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">{issue.previewText}</p>
                        )}
                        <p className="text-xs text-muted-foreground/60 font-mono mt-2">
                          Created {new Date(issue.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {issue.status === "draft" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditIssue(issue)}
                              className="text-xs border-border"
                            >
                              <Edit3 className="w-3 h-3 mr-1" /> EDIT
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSendIssue(issue.id, subCount)}
                              disabled={sendIssue.isPending || subCount === 0}
                              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              {sendIssue.isPending ? "SENDING..." : `SEND TO ${subCount}`}
                            </Button>
                          </>
                        )}
                        {issue.status === "sent" && (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                            <CheckCircle className="w-3.5 h-3.5" /> DELIVERED
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
