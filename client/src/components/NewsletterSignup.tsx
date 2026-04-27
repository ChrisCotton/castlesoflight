import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Zap } from "lucide-react";
import InteractiveCard from "@/components/InteractiveCard";

interface NewsletterSignupProps {
  source?: "landing_page" | "book_download" | "booking" | "contact_form" | "manual" | "other";
  variant?: "hero" | "inline" | "footer";
  title?: string;
  subtitle?: string;
}

export default function NewsletterSignup({
  source = "landing_page",
  variant = "inline",
  title = "HARDCORE INFRASTRUCTURE",
  subtitle = "Real-world AI + DevOps tactics. No fluff. Delivered to engineers who build at the speed of thought.",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      if (data.isNew) {
        toast.success("You're in! Check your inbox for a welcome transmission.");
      } else {
        toast.success("You're already subscribed — welcome back!");
      }
    },
    onError: (e) => toast.error(e.message || "Subscription failed. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribe.mutate({ email: email.trim(), firstName: firstName.trim() || undefined, source });
  };

  if (submitted) {
    return (
      <div className={`${variant === "hero" ? "py-12" : "py-8"} text-center`}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-4">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-mono text-accent tracking-widest uppercase">TRANSMISSION RECEIVED</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">You're in the system.</h3>
        <p className="text-muted-foreground text-sm">Check your inbox for a welcome message from the Nerve Center.</p>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <section className="py-16 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10">
          {/* Constrained card — not full-width */}
          <div className="max-w-2xl mx-auto">
            <InteractiveCard containerClassName="rounded-2xl" className="hud-card rounded-2xl p-8 md:p-10">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-primary/60 tracking-widest uppercase">FREE NEWSLETTER</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3 leading-tight">
                {title}
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">{subtitle}</p>

              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  placeholder="First name (optional)"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-background/40 border-border/40 font-mono sm:w-36 shrink-0"
                />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/40 border-border/40 font-mono flex-1"
                />
                <Button
                  type="submit"
                  disabled={subscribe.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shrink-0 shadow-[0_0_15px_var(--primary-glow)]"
                >
                  {subscribe.isPending ? "JOINING..." : "JOIN FREE →"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground/30 mt-3 font-mono uppercase tracking-widest">
                No spam. Unsubscribe anytime.
              </p>
            </InteractiveCard>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "footer") {
    return (
      <div className="space-y-3">
        <p className="text-xs font-mono text-accent/60 tracking-widest uppercase">// NEWSLETTER</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-background/50 border-border font-mono text-sm flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={subscribe.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shrink-0 shadow-[0_0_10px_var(--primary-glow)]"
          >
            {subscribe.isPending ? "..." : <Zap className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    );
  }

  // Default inline variant
  return (
    <InteractiveCard containerClassName="rounded-2xl" className="amber-card p-6 md:p-8 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-primary" />
        <p className="text-xs font-mono text-primary/60 tracking-widest uppercase">// FREE NEWSLETTER</p>
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{subtitle}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="bg-background/50 border-border font-mono w-32 shrink-0"
          />
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-background/50 border-border font-mono flex-1"
          />
        </div>
        <Button
          type="submit"
          disabled={subscribe.isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_15px_var(--primary-glow)]"
        >
          {subscribe.isPending ? "JOINING..." : "JOIN FREE — UNSUBSCRIBE ANYTIME"}
        </Button>
      </form>
    </InteractiveCard>
  );
}
