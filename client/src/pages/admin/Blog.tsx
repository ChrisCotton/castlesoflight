import { useState } from "react";
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
  RefreshCw,
  ChevronRight,
  Globe,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = "draft" | "published" | "private";

const STATUS_LABELS: Record<Status, string> = {
  draft: "Draft",
  published: "Published",
  private: "Private (Wink-Wink)",
};

const STATUS_COLORS: Record<Status, string> = {
  draft: "text-muted-foreground border-border/40 bg-secondary/20",
  published: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
  private: "text-primary border-primary/20 bg-primary/10",
};

// ─── Blank form state ─────────────────────────────────────────────────────────
const BLANK_FORM = {
  title: "",
  slug: "",
  description: "",
  content: "",
  status: "draft" as Status,
  targetLeadId: undefined as number | undefined,
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BlogAdmin() {
  const utils = trpc.useUtils();
  const { data: posts = [], isLoading } = trpc.blog.listAll.useQuery();
  const { data: leads = [] } = trpc.lead.list.useQuery({});

  const createMutation = trpc.blog.create.useMutation({
    onSuccess: () => {
      utils.blog.listAll.invalidate();
      setMode("list");
      toast.success("Post created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => {
      utils.blog.listAll.invalidate();
      setMode("list");
      toast.success("Post updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => {
      utils.blog.listAll.invalidate();
      toast.success("Post deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  type Mode = "list" | "create" | { edit: number };
  const [mode, setMode] = useState<Mode>("list");
  const [form, setForm] = useState(BLANK_FORM);

  const handleEdit = (post: any) => {
    setForm({
      title: post.title,
      slug: post.slug,
      description: post.description || "",
      content: post.content,
      status: post.status as Status,
      targetLeadId: post.targetLeadId || undefined,
    });
    setMode({ edit: post.id });
  };

  const handleCreate = () => {
    setForm(BLANK_FORM);
    setMode("create");
  };

  const handleSave = () => {
    if (typeof mode === "object" && "edit" in mode) {
      updateMutation.mutate({ id: mode.edit, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="font-display font-bold text-3xl text-foreground tracking-tight">Blog Engine</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {posts.length} post{posts.length !== 1 ? "s" : ""} · Precise rapport-building content
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "list" ? (
            <Button
              size="sm"
              onClick={handleCreate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-widest text-[10px] px-6 h-10 shadow-[0_0_20px_var(--primary-glow)] transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              NEW POST
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setMode("list")}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              CANCEL
            </Button>
          )}
        </div>
      </div>

      {mode === "list" ? (
        <div className="flex-1 overflow-auto space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading posts…
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center bg-secondary/10 rounded-xl border border-dashed border-border/40">
              <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">No posts yet. Time to build some rapport.</p>
              <Button size="sm" variant="ghost" onClick={handleCreate} className="mt-2 text-primary">
                Create your first post
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {posts.map((post) => (
                <Card key={post.id} className="p-4 bg-card/40 border-border/40 hover:border-primary/40 transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_COLORS[post.status as Status]}`}>
                          {STATUS_LABELS[post.status as Status]}
                        </span>
                        {post.targetLeadId && (
                          <span className="text-[10px] text-primary font-mono flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Targeted: {leads.find(l => l.id === post.targetLeadId)?.firstName || "Lead"}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {format(new Date(post.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{post.title}</h3>
                      <p className="text-sm text-muted-foreground truncate font-mono">/{post.slug}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => window.open(`/blog/${post.slug}`, "_blank")}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(post)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => {
                        if (confirm("Delete this post?")) deleteMutation.mutate({ id: post.id });
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
          {/* Editor Side */}
          <div className="flex flex-col gap-4 overflow-auto pr-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">TITLE</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })}
                  placeholder="The 3-Day Sprint Strategy"
                  className="bg-background/50 border-border/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">SLUG</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="3-day-sprint-strategy"
                  className="bg-background/50 border-border/40 font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">STATUS</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger className="bg-background/50 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published (Public)</SelectItem>
                    <SelectItem value="private">Private (Wink-Wink)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">TARGET LEAD</label>
                <Select
                  value={form.targetLeadId?.toString() || "none"}
                  onValueChange={(v) => setForm({ ...form, targetLeadId: v === "none" ? undefined : parseInt(v) })}
                >
                  <SelectTrigger className="bg-background/50 border-border/40">
                    <SelectValue placeholder="General Audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General Audience</SelectItem>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id.toString()}>
                        {lead.firstName} {lead.lastName} ({lead.company})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">TEASER / DESCRIPTION</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short teaser for social media and SEO..."
                className="bg-background/50 border-border/40 h-20 resize-none"
              />
            </div>

            <div className="flex-1 flex flex-col space-y-1 min-h-[300px]">
              <label className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">CONTENT (MARKDOWN)</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="# Introduction..."
                className="flex-1 bg-background/50 border-border/40 font-mono text-sm resize-none"
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || !form.title || !form.slug || !form.content}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 shadow-[0_0_20px_var(--primary-glow)] transition-all"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {typeof mode === "object" ? "UPDATE POST" : "CREATE POST"}
              </Button>
            </div>
          </div>

          {/* Preview Side */}
          <div className="flex flex-col overflow-hidden bg-background/30 rounded-xl border border-border/40">
            <div className="p-3 border-b border-border/40 bg-secondary/10 flex items-center justify-between font-mono text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              <span>LIVE PREVIEW</span>
              <span className="text-primary">{form.status === "private" ? "PRIVATE MODE" : "PUBLIC MODE"}</span>
            </div>
            <div className="flex-1 overflow-auto p-8 max-w-none">
              <h1 className="text-3xl font-display font-bold mb-2">{form.title || "Untitled Post"}</h1>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8 border-b border-border/40 pb-4">
                <span>By Christopher Cotton</span>
                <span>•</span>
                <span>{format(new Date(), "MMMM d, yyyy")}</span>
              </div>
              {form.content ? (
                <div className="prose prose-invert prose-primary max-w-none prose-headings:text-foreground prose-headings:font-display prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-ol:list-decimal prose-ol:ml-4 prose-li:marker:text-foreground prose-li:marker:font-mono prose-strong:text-primary prose-code:text-primary prose-code:bg-secondary/30 prose-code:px-1 prose-code:rounded prose-pre:bg-secondary/20 prose-pre:border prose-pre:border-border/40 prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:text-muted-foreground">
                  <ReactMarkdown>{form.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground italic font-mono text-sm">Start typing to see preview...</p>
              )}

              <div className="mt-12 p-6 rounded-xl border border-primary/20 bg-primary/5">
                <h4 className="text-primary font-bold mb-2">Build your infrastructure 10x faster</h4>
                <p className="text-sm text-muted-foreground mb-4">Christopher Cotton helps engineering teams ship elite cloud infrastructure in 3 days.</p>
                <Button size="sm" className="bg-primary text-primary-foreground">Book a Discovery Call</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
