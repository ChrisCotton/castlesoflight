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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* HUD status bar */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center gap-4 py-2">
          <span className="text-xs font-mono text-cyan-400 tracking-widest">● SYS.ONLINE</span>
          <span className="text-xs font-mono text-muted-foreground tracking-wider">CASTLES OF LIGHT // UNSUBSCRIBE</span>
        </div>
      </div>

      <div className="w-full max-w-md pt-16">
        {status === "success" ? (
          <div className="hud-card p-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <p className="text-xs font-mono text-cyan-400 tracking-widest mb-3">// TRANSMISSION ACKNOWLEDGED</p>
            <h1 className="text-2xl font-bold text-foreground mb-3">You've been unsubscribed.</h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              You won't receive any more emails from Hardcore Infrastructure. No hard feelings — the door is always open if you want to re-subscribe.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
            >
              RETURN TO NERVE CENTER
            </Button>
          </div>
        ) : status === "error" ? (
          <div className="hud-card p-8 text-center">
            <div className="text-4xl mb-4">⚠</div>
            <p className="text-xs font-mono text-red-400 tracking-widest mb-3">// ERROR</p>
            <h1 className="text-2xl font-bold text-foreground mb-3">Link expired or invalid.</h1>
            <p className="text-muted-foreground mb-6">
              This unsubscribe link may have already been used or has expired. If you're still receiving emails, contact{" "}
              <a href="mailto:christopher@castlesoflight.com" className="text-cyan-400 hover:underline">
                christopher@castlesoflight.com
              </a>
              .
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              GO HOME
            </Button>
          </div>
        ) : (
          <div className="hud-card p-8 text-center">
            <p className="text-xs font-mono text-amber-400 tracking-widest mb-3">// UNSUBSCRIBE REQUEST</p>
            <h1 className="text-2xl font-bold text-foreground mb-3">Leaving so soon?</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              You're about to unsubscribe from <strong className="text-foreground">Hardcore Infrastructure</strong> — the newsletter on AI-augmented DevOps, infrastructure cost reduction, and building at the speed of thought.
            </p>
            {!token ? (
              <p className="text-red-400 text-sm font-mono">Invalid unsubscribe link. Token missing.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleUnsubscribe}
                  disabled={status === "loading"}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  {status === "loading" ? "Processing..." : "YES, UNSUBSCRIBE ME"}
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
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
