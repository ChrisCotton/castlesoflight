import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function Unsubscribe() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
  }, []);

  const unsubMutation = trpc.newsletter.unsubscribe.useMutation({
    onSuccess: (data) => {
      setStatus(data.success ? "success" : "error");
    },
    onError: () => setStatus("error"),
  });

  const handleUnsubscribe = () => {
    if (!token) return;
    setStatus("loading");
    unsubMutation.mutate({ token });
  };

  return (
    <div className="flex items-center justify-center py-20 px-4">

      <div className="w-full max-w-md">
        {status === "success" ? (
          <div className="hud-card p-8 text-center rounded-2xl">
            <div className="text-4xl mb-4 text-accent">✓</div>
            <p className="text-[10px] font-mono text-accent/60 tracking-widest mb-3 uppercase">// TRANSMISSION ACKNOWLEDGED</p>
            <h1 className="text-2xl font-display font-bold text-foreground mb-3">You've been unsubscribed.</h1>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              You won't receive any more emails from Hardcore Infrastructure. No hard feelings — the door is always open if you want to re-subscribe.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_15px_var(--primary-glow)]"
            >
              RETURN TO NERVE CENTER
            </Button>
          </div>
        ) : status === "error" ? (
          <div className="hud-card p-8 text-center rounded-2xl">
            <div className="text-4xl mb-4 text-destructive">⚠</div>
            <p className="text-[10px] font-mono text-destructive/60 tracking-widest mb-3 uppercase">// ERROR</p>
            <h1 className="text-2xl font-display font-bold text-foreground mb-3">Link expired or invalid.</h1>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              This unsubscribe link may have already been used or has expired. If you're still receiving emails, contact{" "}
              <a href="mailto:christopher@castlesoflight.com" className="text-accent hover:underline">
                christopher@castlesoflight.com
              </a>
              .
            </p>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full border-border/50">
              GO HOME
            </Button>
          </div>
        ) : (
          <div className="hud-card p-8 text-center rounded-2xl">
            <p className="text-[10px] font-mono text-primary/60 tracking-widest mb-3 uppercase">// UNSUBSCRIBE REQUEST</p>
            <h1 className="text-2xl font-display font-bold text-foreground mb-3">Leaving so soon?</h1>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              You're about to unsubscribe from <strong className="text-foreground">Hardcore Infrastructure</strong> — the newsletter on AI-augmented DevOps, infrastructure cost reduction, and building at the speed of thought.
            </p>
            {!token ? (
              <p className="text-destructive text-xs font-mono uppercase tracking-widest">Invalid link // Token missing</p>
            ) : (
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleUnsubscribe}
                  disabled={status === "loading"}
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  {status === "loading" ? "Processing..." : "YES, UNSUBSCRIBE ME"}
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_15px_var(--primary-glow)]"
                >
                  KEEP ME SUBSCRIBED
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
