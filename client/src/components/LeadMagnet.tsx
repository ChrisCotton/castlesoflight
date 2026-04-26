import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BookOpen, Shield, ArrowRight, Lock } from "lucide-react";

export default function LeadMagnet() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      if (data.isNew) {
        toast.success("Authorization granted. Check your inbox for the Blueprint.");
      } else {
        toast.success("Welcome back. We've re-sent the Blueprint to your terminal.");
      }
    },
    onError: (e) => toast.error(e.message || "Authorization failed. System error."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribe.mutate({ 
      email: email.trim(), 
      firstName: firstName.trim() || undefined, 
      source: "lead_magnet" 
    });
  };

  if (submitted) {
    return (
      <div className="hud-card rounded-2xl p-8 md:p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400 tracking-widest">ACCESS GRANTED</span>
        </div>
        <h3 className="text-3xl font-bold text-foreground mb-4 font-display">Blueprint Authorized.</h3>
        <p className="text-[oklch(0.55_0.015_220)] text-lg max-w-md mx-auto leading-relaxed">
          The transmission is complete. Check your inbox for **"The AI-Augmented Compliance Blueprint"**.
        </p>
        <div className="mt-8 pt-8 border-t border-[oklch(0.78_0.18_195_/_0.1)]">
          <p className="text-xs font-mono text-[oklch(0.45_0.015_220)]">
            TERMINAL STATUS: SECURE // DELIVERY: PENDING INBOX
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[oklch(0.82_0.20_58)] to-[oklch(0.78_0.18_195)] rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
      
      <div className="relative hud-card rounded-2xl p-8 md:p-12 overflow-hidden bg-[oklch(0.04_0.005_260_/_0.9)] backdrop-blur-xl border border-[oklch(0.78_0.18_195_/_0.15)]">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Shield className="w-32 h-32 text-[oklch(0.78_0.18_195)]" />
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded bg-[oklch(0.82_0.20_58_/_0.1)] border border-[oklch(0.82_0.20_58_/_0.2)]">
                <BookOpen className="w-5 h-5 text-[oklch(0.82_0.20_58)]" />
              </div>
              <span className="text-xs font-mono text-[oklch(0.82_0.20_58)] tracking-[0.2em] uppercase">Free Intelligence Report</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 font-display leading-tight">
              The AI-Augmented <span className="text-[oklch(0.78_0.18_195)]">Compliance Blueprint</span>
            </h2>
            
            <p className="text-[oklch(0.65_0.015_220)] text-lg mb-8 leading-relaxed">
              A CTO's guide to navigating regulatory hurdles with LLMs. Learn how to transform compliance from a bottleneck into a competitive advantage.
            </p>
            
            <ul className="space-y-4 mb-8">
              {[
                "Automated Gap Analysis Framework",
                "AI-Driven SOC2/HIPAA Remediation",
                "Continuous Compliance Guardrails",
                "Case Study: 60% Reduction in Audit Prep"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-[oklch(0.55_0.015_220)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.78_0.18_195)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="p-1 rounded-xl bg-gradient-to-b from-[oklch(0.78_0.18_195_/_0.2)] to-transparent">
              <div className="bg-[oklch(0.06_0.01_260)] rounded-lg p-6 md:p-8 border border-[oklch(0.78_0.18_195_/_0.1)]">
                <div className="flex items-center gap-2 mb-6 text-[oklch(0.78_0.18_195)]">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-widest">Request Authorization</span>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[oklch(0.45_0.015_220)] uppercase tracking-widest ml-1">Identity // First Name</label>
                    <Input
                      type="text"
                      placeholder="Christopher"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-[oklch(0.04_0.005_260)] border-[oklch(0.78_0.18_195_/_0.2)] font-mono focus:border-[oklch(0.78_0.18_195)] transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[oklch(0.45_0.015_220)] uppercase tracking-widest ml-1">Terminal // Email Address</label>
                    <Input
                      type="email"
                      placeholder="cto@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-[oklch(0.04_0.005_260)] border-[oklch(0.78_0.18_195_/_0.2)] font-mono focus:border-[oklch(0.78_0.18_195)] transition-colors"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={subscribe.isPending}
                    className="w-full bg-[oklch(0.78_0.18_195)] hover:bg-[oklch(0.85_0.15_190)] text-[oklch(0.04_0.005_260)] font-bold h-12 mt-4 glow-cyan transition-all"
                  >
                    {subscribe.isPending ? "AUTHORIZING..." : "DOWNLOAD BLUEPRINT"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
                
                <p className="text-[9px] font-mono text-[oklch(0.35_0.015_220)] mt-6 text-center uppercase tracking-tighter">
                  By requesting access, you agree to receive technical transmissions from Castles of Light.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
