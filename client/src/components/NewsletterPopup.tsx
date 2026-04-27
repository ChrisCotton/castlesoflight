import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Mail, Zap, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import InteractiveCard from "@/components/InteractiveCard";

const SESSION_KEY = "col_newsletter_popup_dismissed";
const SCROLL_THRESHOLD = 0.6; // 60% of page

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      sessionStorage.setItem(SESSION_KEY, "1");
      if (data.isNew) {
        toast.success("You're in! Welcome to Hardcore Infrastructure.");
      } else {
        toast.success("You're already subscribed — welcome back!");
      }
    },
    onError: (e) => toast.error(e.message || "Subscription failed. Please try again."),
  });

  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  }, []);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let triggered = false;

    const handleScroll = () => {
      if (triggered) return;
      const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrolled >= SCROLL_THRESHOLD) {
        triggered = true;
        // Small delay so it doesn't feel jarring
        setTimeout(() => setVisible(true), 400);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, dismiss]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribe.mutate({
      email: email.trim(),
      firstName: firstName.trim() || undefined,
      source: "landing_page",
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm"
            onClick={dismiss}
            aria-hidden
          />

          {/* Modal */}
          <motion.div
            key="popup"
            role="dialog"
            aria-modal="true"
            aria-label="Newsletter signup"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed z-[100]"
            style={{ bottom: "1.5rem", right: "1.5rem", width: "380px", maxWidth: "calc(100vw - 2rem)" }}
          >
            <InteractiveCard
              containerClassName="rounded-2xl"
              className="relative rounded-2xl overflow-hidden border border-primary/20 bg-card shadow-2xl shadow-primary/5"
            >
              {/* Top glow strip */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              {/* Ambient glow */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none bg-primary/5 blur-3xl" />

              {/* Close button */}
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                aria-label="Close popup"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10 p-6 pt-8">
                {submitted ? (
                  /* Success state */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-primary/10 border border-primary/20 shadow-[0_0_20px_var(--primary-glow)]">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-[10px] font-mono tracking-widest mb-2 text-primary/60 uppercase">
                      // TRANSMISSION RECEIVED
                    </p>
                    <h3 className="text-xl font-display font-bold text-foreground mb-2">You're in the system.</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Check your inbox — your welcome transmission is on its way.
                    </p>
                    <button
                      onClick={dismiss}
                      className="mt-6 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                    >
                      [ DISMISS ]
                    </button>
                  </motion.div>
                ) : (
                  /* Signup form */
                  <>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20 shadow-[0_0_15px_var(--primary-glow)]">
                        <Terminal className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-[0.2em] mb-1 py-0 px-1.5 border-primary/30 text-primary bg-primary/5">
                          FREE NEWSLETTER
                        </Badge>
                        <p className="text-sm font-display font-bold text-foreground leading-tight tracking-tight">HARDCORE INFRASTRUCTURE</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                      Weekly AI + DevOps tactics from 30 years in the trenches. No fluff.{" "}
                      <span className="text-primary font-semibold">Free forever.</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="space-y-1">
                         <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest ml-1">IDENTITY</label>
                         <Input
                           type="text"
                           placeholder="First name (optional)"
                           value={firstName}
                           onChange={(e) => setFirstName(e.target.value)}
                           className="h-10 text-sm font-mono bg-background/50 border-border/40 focus:border-primary/50"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest ml-1">ADDRESS</label>
                         <Input
                           type="email"
                           placeholder="your@email.com"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           required
                           className="h-10 text-sm font-mono bg-background/50 border-border/40 focus:border-accent/50"
                         />
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={subscribe.isPending}
                        className="w-full h-11 font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_var(--primary-glow)] transition-all mt-2"
                      >
                        {subscribe.isPending ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            JOINING...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            JOIN FREE — NO SPAM
                          </span>
                        )}
                      </Button>
                    </form>

                    <button
                      onClick={dismiss}
                      className="mt-4 w-full text-center text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors uppercase tracking-widest"
                    >
                      No thanks, I'll figure it out myself
                    </button>
                  </>
                )}
              </div>
            </InteractiveCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
