import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Mail, Zap, Terminal } from "lucide-react";

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
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
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
            className="fixed z-[100] bottom-6 right-6 w-full max-w-sm mx-auto"
            style={{ right: "clamp(1rem, 4vw, 2rem)", bottom: "clamp(1rem, 4vw, 1.5rem)" }}
          >
            <div
              className="relative rounded-2xl overflow-hidden border"
              style={{
                background: "oklch(0.06 0.008 240)",
                borderColor: "oklch(0.82 0.20 58 / 0.35)",
                boxShadow: "0 0 0 1px oklch(0.82 0.20 58 / 0.12), 0 24px 64px oklch(0 0 0 / 0.7), 0 0 40px oklch(0.82 0.20 58 / 0.08)",
              }}
            >
              {/* Amber top glow strip */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, oklch(0.82 0.20 58 / 0.8), transparent)" }}
              />

              {/* Ambient glow */}
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, oklch(0.82 0.20 58 / 0.12) 0%, transparent 70%)" }}
              />

              {/* Close button */}
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "oklch(0.45 0.015 220)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.70 0.015 220)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.45 0.015 220)")}
                aria-label="Close popup"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10 p-6">
                {submitted ? (
                  /* Success state */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: "oklch(0.68 0.20 160 / 0.12)", border: "1px solid oklch(0.68 0.20 160 / 0.35)" }}
                    >
                      <Zap className="w-7 h-7" style={{ color: "oklch(0.68 0.20 160)" }} />
                    </div>
                    <p
                      className="text-xs font-mono tracking-widest mb-2"
                      style={{ color: "oklch(0.68 0.20 160)" }}
                    >
                      // TRANSMISSION RECEIVED
                    </p>
                    <h3 className="text-lg font-bold text-white mb-2">You're in the system.</h3>
                    <p className="text-sm" style={{ color: "oklch(0.55 0.015 220)" }}>
                      Check your inbox — your welcome transmission is on its way.
                    </p>
                    <button
                      onClick={dismiss}
                      className="mt-5 text-xs font-mono transition-colors"
                      style={{ color: "oklch(0.40 0.015 220)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.60 0.015 220)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.40 0.015 220)")}
                    >
                      [CLOSE]
                    </button>
                  </motion.div>
                ) : (
                  /* Signup form */
                  <>
                    {/* Header */}
                    <div className="flex items-center gap-2.5 mb-4">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "oklch(0.82 0.20 58 / 0.15)", border: "1px solid oklch(0.82 0.20 58 / 0.30)" }}
                      >
                        <Terminal className="w-4.5 h-4.5" style={{ color: "oklch(0.82 0.20 58)" }} />
                      </div>
                      <div>
                        <p
                          className="text-[10px] font-mono tracking-widest"
                          style={{ color: "oklch(0.82 0.20 58)" }}
                        >
                          // FREE NEWSLETTER
                        </p>
                        <p className="text-xs font-bold text-white leading-tight">HARDCORE INFRASTRUCTURE</p>
                      </div>
                    </div>

                    <p className="text-sm mb-5 leading-relaxed" style={{ color: "oklch(0.55 0.015 220)" }}>
                      Weekly AI + DevOps tactics from 30 years in the trenches. No fluff.{" "}
                      <span style={{ color: "oklch(0.82 0.20 58)" }}>Free forever.</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-2.5">
                      <Input
                        type="text"
                        placeholder="First name (optional)"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-10 text-sm font-mono"
                        style={{
                          background: "oklch(0.09 0.008 240)",
                          borderColor: "oklch(0.82 0.20 58 / 0.20)",
                          color: "white",
                        }}
                      />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-10 text-sm font-mono"
                        style={{
                          background: "oklch(0.09 0.008 240)",
                          borderColor: "oklch(0.82 0.20 58 / 0.20)",
                          color: "white",
                        }}
                      />
                      <Button
                        type="submit"
                        disabled={subscribe.isPending}
                        className="w-full h-10 font-bold text-sm"
                        style={{
                          background: "oklch(0.82 0.20 58)",
                          color: "oklch(0.06 0.01 260)",
                        }}
                      >
                        {subscribe.isPending ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
                      className="mt-3 w-full text-center text-[11px] font-mono transition-colors"
                      style={{ color: "oklch(0.32 0.015 220)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.50 0.015 220)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.32 0.015 220)")}
                    >
                      No thanks, I'll figure it out myself
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
