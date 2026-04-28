import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import NewsletterSignup from "@/components/NewsletterSignup";
import NewsletterPopup from "@/components/NewsletterPopup";
import AsciiBackground from "@/components/AsciiBackground";
import LeadMagnet from "@/components/LeadMagnet";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Terminal,
  Shield,
  Zap,
  TrendingDown,
  Clock,
  CheckCircle2,
  BookOpen,
  Calendar,
  Mail,
  Linkedin,
  Github,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  Cloud,
  Lock,
  Cpu,
  Activity,
  GitBranch,
} from "lucide-react";
import InteractiveCard from "@/components/InteractiveCard";

// ─── Prismatic Hero Background ────────────────────────────────────────────────
function PrismaticBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Deep void base */}
      <div className="absolute inset-0 bg-[oklch(0.04_0.005_260)]" />

      {/* Radial glow center-left — amber core */}
      <div
        className="absolute"
        style={{
          left: "-10%", top: "5%",
          width: "70%", height: "80%",
          background: "radial-gradient(ellipse at 30% 50%, oklch(0.82 0.20 58 / 0.12) 0%, transparent 65%)",
        }}
      />

      {/* Radial glow — cyan upper right */}
      <div
        className="absolute"
        style={{
          right: "-5%", top: "-10%",
          width: "60%", height: "70%",
          background: "radial-gradient(ellipse at 70% 30%, oklch(0.78 0.18 195 / 0.10) 0%, transparent 60%)",
        }}
      />

      {/* Prismatic streak 1 — thick amber/orange */}
      <div
        className="prismatic-streak animate-streak-1"
        style={{
          left: "-5%", top: "15%",
          width: "65%", height: "14px",
          background: "linear-gradient(90deg, transparent 0%, oklch(0.82 0.20 58 / 0.9) 20%, oklch(0.88 0.18 70 / 1) 45%, oklch(0.75 0.22 45 / 0.8) 70%, transparent 100%)",
          transform: "rotate(-12deg)",
          filter: "blur(0.5px)",
          boxShadow: "0 0 30px oklch(0.82 0.20 58 / 0.5), 0 0 80px oklch(0.82 0.20 58 / 0.2)",
        }}
      />

      {/* Prismatic streak 2 — thin cyan */}
      <div
        className="prismatic-streak animate-streak-2"
        style={{
          left: "5%", top: "28%",
          width: "55%", height: "4px",
          background: "linear-gradient(90deg, transparent 0%, oklch(0.78 0.18 195 / 0.8) 30%, oklch(0.85 0.15 185 / 1) 55%, oklch(0.65 0.22 210 / 0.6) 80%, transparent 100%)",
          transform: "rotate(-11deg)",
          filter: "blur(0.3px)",
          boxShadow: "0 0 20px oklch(0.78 0.18 195 / 0.6)",
        }}
      />

      {/* Prismatic streak 3 — violet */}
      <div
        className="prismatic-streak"
        style={{
          left: "10%", top: "38%",
          width: "40%", height: "3px",
          background: "linear-gradient(90deg, transparent 0%, oklch(0.65 0.22 280 / 0.7) 40%, oklch(0.72 0.20 270 / 0.9) 60%, transparent 100%)",
          transform: "rotate(-10deg)",
          animation: "streak-drift 13s ease-in-out infinite 2s",
          boxShadow: "0 0 15px oklch(0.65 0.22 280 / 0.4)",
        }}
      />

      {/* Prismatic streak 4 — blue */}
      <div
        className="prismatic-streak animate-streak-1"
        style={{
          left: "0%", top: "22%",
          width: "45%", height: "2px",
          background: "linear-gradient(90deg, transparent 0%, oklch(0.62 0.20 240 / 0.8) 35%, oklch(0.70 0.18 230 / 1) 60%, transparent 100%)",
          transform: "rotate(-13deg)",
          animationDelay: "3s",
          boxShadow: "0 0 12px oklch(0.62 0.20 240 / 0.5)",
        }}
      />

      {/* Prismatic streak 5 — magenta thin */}
      <div
        className="prismatic-streak animate-streak-2"
        style={{
          left: "15%", top: "45%",
          width: "30%", height: "2px",
          background: "linear-gradient(90deg, transparent 0%, oklch(0.65 0.24 340 / 0.6) 40%, oklch(0.72 0.22 330 / 0.8) 65%, transparent 100%)",
          transform: "rotate(-9deg)",
          animationDelay: "5s",
        }}
      />

      {/* Light burst / lens flare center */}
      <div
        className="absolute animate-glow-pulse"
        style={{
          left: "22%", top: "30%",
          width: "120px", height: "120px",
          background: "radial-gradient(circle, oklch(0.95 0.15 65 / 0.8) 0%, oklch(0.82 0.20 58 / 0.4) 30%, transparent 70%)",
          filter: "blur(2px)",
          transform: "rotate(-12deg)",
        }}
      />

      {/* Secondary lens flare — cyan */}
      <div
        className="absolute"
        style={{
          left: "35%", top: "25%",
          width: "60px", height: "60px",
          background: "radial-gradient(circle, oklch(0.95 0.10 190 / 0.6) 0%, oklch(0.78 0.18 195 / 0.3) 40%, transparent 70%)",
          filter: "blur(1px)",
          animation: "glow-pulse 5s ease-in-out infinite 1s",
        }}
      />

      {/* Fine dot grid overlay */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[oklch(0.04_0.005_260)] to-transparent" />
    </div>
  );
}

// ─── HUD Status Bar ───────────────────────────────────────────────────────────
function HudStatusBar() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] border-b border-[oklch(0.78_0.18_195_/_0.15)] bg-[oklch(0.04_0.005_260_/_0.9)] backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 h-8">
        <div className="flex items-center gap-4">
          <span className="sys-online">SYS.ONLINE</span>
          <span className="hud-label opacity-50">CASTLES OF LIGHT // NERVE CENTER</span>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <span className="hud-label opacity-40">
            {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} PT
          </span>
          <span className="hud-label opacity-40">SFO-01</span>
        </div>
      </div>
    </div>
  );
}

// ─── Nav Auth Buttons ────────────────────────────────────────────────────────
function NavAuthButtons() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated && user) {
    return (
      <div className="hidden md:flex items-center gap-3">
        <Link href="/book">
          <Button size="sm" className="bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] hover:bg-[oklch(0.88_0.18_60)] font-semibold glow-sm-amber transition-all">
            Book a Call <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="hidden md:flex items-center gap-3">
      <a href={getLoginUrl()}>
        <Button size="sm" variant="outline" className="border-[oklch(0.78_0.18_195_/_0.3)] text-[oklch(0.78_0.18_195)] hover:bg-[oklch(0.78_0.18_195_/_0.08)] font-mono text-xs">
          LOGIN
        </Button>
      </a>
      <Link href="/book">
        <Button size="sm" className="bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] hover:bg-[oklch(0.88_0.18_60)] font-semibold glow-sm-amber transition-all">
          Book a Call <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`fixed top-8 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-[oklch(0.78_0.18_195_/_0.12)] bg-[oklch(0.04_0.005_260_/_0.95)] backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="container flex items-center justify-between h-16" style={{ minWidth: 0, width: '100%' }}>
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.82_0.20_58)] flex items-center justify-center glow-sm-amber">
            <Terminal className="w-4 h-4 text-[oklch(0.06_0.01_260)]" />
          </div>
          <span className="font-display font-bold text-lg text-foreground tracking-tight">
            Castles<span className="text-[oklch(0.82_0.20_58)]">of</span>Light
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {[
            { label: "Case Studies", href: "#case-studies" },
            { label: "Services", href: "#services" },
            { label: "About", href: "#about" },
            { label: "Book", href: "/book" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="hud-label opacity-60 hover:opacity-100 hover:text-[oklch(0.78_0.18_195)] transition-all"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="shrink-0"><NavAuthButtons /></div>

        <button className="md:hidden text-foreground p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-[oklch(0.04_0.005_260_/_0.98)] px-4 py-4 space-y-3">
          {[
            { label: "Case Studies", href: "#case-studies" },
            { label: "Services", href: "#services" },
            { label: "About", href: "#about" },
          ].map((item) => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="block hud-label py-2 opacity-70 hover:opacity-100">
              {item.label}
            </a>
          ))}
          <Link href="/book" onClick={() => setOpen(false)}>
            <Button size="sm" className="w-full bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] font-semibold mt-2">
              Book a Call
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      {/* ASCII canvas animation — sits behind the prismatic streaks */}
      <AsciiBackground />
      <PrismaticBackground />

      <div className="container relative z-10">
        <div className="max-w-4xl">
          {/* Status badge */}
          <div className="flex items-center gap-3 mb-8">
            <span className="sys-online">Available for new engagements</span>
            <span className="hud-label opacity-40">// Q2 2026</span>
          </div>

          {/* Main headline */}
          <h1 className="font-display font-bold leading-[0.95] mb-6">
            <span className="block text-[clamp(2.5rem,7vw,6.5rem)] text-foreground">Bulletproof</span>
            <span className="block text-[clamp(2.5rem,7vw,6.5rem)] gradient-text-amber">Infrastructure</span>
            <span className="block text-[clamp(2.5rem,7vw,6.5rem)] text-foreground">
              in <span className="text-emerald-hud">3 Days,</span>
            </span>
            <span className="block text-[clamp(2.5rem,7vw,6.5rem)] text-cyan-hud opacity-40">Not Three Months.</span>
          </h1>

          <p className="text-[oklch(0.65_0.015_220)] text-lg md:text-xl max-w-3xl mb-4 leading-relaxed">
            30 years of elite engineering (Spotify, Google, Raytheon) compressed into a 72-hour AI-augmented strike.
          </p>
          <p className="text-[oklch(0.55_0.015_220)] text-base max-w-2xl mb-10 leading-relaxed">
            Stop compromising between speed and stability. Stop waiting for DevOps cycles and start shipping.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/book?type=sprint">
              <Button size="lg" className="bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] hover:bg-[oklch(0.88_0.18_60)] font-bold text-base px-8 glow-amber transition-all">
                Book Your 3-Day Sprint
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#case-studies">
              <Button size="lg" variant="outline" className="border-[oklch(0.78_0.18_195_/_0.4)] text-[oklch(0.78_0.18_195)] hover:bg-[oklch(0.78_0.18_195_/_0.08)] hover:border-[oklch(0.78_0.18_195_/_0.7)] font-semibold text-base px-8 transition-all">
                See the Proof
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </a>
          </div>

          {/* HUD data readouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            {[
              { value: "30+", label: "YRS EXPERIENCE", color: "oklch(0.82 0.20 58)" },
              { value: "80%", label: "COST REDUCTION", color: "oklch(0.78 0.18 195)" },
              { value: "99%", label: "DEPLOY SPEEDUP", color: "oklch(0.65 0.22 280)" },
              { value: "3D", label: "SPRINT DELIVERY", color: "oklch(0.68 0.20 160)" },
            ].map((stat) => (
              <InteractiveCard key={stat.label} containerClassName="rounded-lg h-full" className="hud-card p-4 rounded-lg bg-opacity-40 backdrop-blur-md" flashlightSize={150} showBeam={true}>
                <div className="font-display font-bold text-2xl mb-1 animate-hud-flicker" style={{ color: stat.color, textShadow: `0 0 20px ${stat.color}` }}>
                  {stat.value}
                </div>
                <div className="hud-label opacity-50">{stat.label}</div>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </div>

      {/* Right-side floating HUD panel — desktop only */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 z-10">
        <InteractiveCard containerClassName="rounded-lg w-52 animate-float" className="hud-card rounded-lg p-4 bg-opacity-40 backdrop-blur-md" flashlightSize={150} showBeam={true}>
          <div className="hud-label mb-3 opacity-60">STACK STATUS</div>
          {[
            { label: "K8s Clusters", status: "NOMINAL", color: "oklch(0.68 0.20 160)" },
            { label: "CI/CD Pipeline", status: "ACTIVE", color: "oklch(0.68 0.20 160)" },
            { label: "IaC Coverage", status: "100%", color: "oklch(0.82 0.20 58)" },
            { label: "Sec Posture", status: "HARDENED", color: "oklch(0.78 0.18 195)" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-[oklch(0.78_0.18_195_/_0.08)] last:border-0">
              <span className="text-[10px] font-mono text-[oklch(0.50_0.015_220)]">{item.label}</span>
              <span className="text-[10px] font-mono font-semibold" style={{ color: item.color }}>{item.status}</span>
            </div>
          ))}
        </InteractiveCard>

        <InteractiveCard containerClassName="rounded-lg w-52" className="amber-card rounded-lg p-4 bg-opacity-40 backdrop-blur-md" flashlightSize={200} showBeam={true}>
          <div className="hud-label mb-2 opacity-60" style={{ color: "oklch(0.82 0.20 58)" }}>CURRENT OFFER</div>
          <div className="text-[oklch(0.82_0.20_58)] font-display font-bold text-lg">The Sprint</div>
          <div className="text-[oklch(0.55_0.015_220)] text-xs font-mono mt-1">$15,000 · 3-day delivery</div>
          <div className="mt-3">
            <Link href="/book?type=sprint">
              <Button size="sm" className="w-full bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] font-bold text-xs h-7">
                Book Now
              </Button>
            </Link>
          </div>
        </InteractiveCard>
      </div>
    </section>
  );
}

// ─── Logos Bar ────────────────────────────────────────────────────────────────
function LogosBar() {
  const logos = ["Spotify", "Google ProServe", "Raytheon", "Assort Health", "Clapself", "LearnLab AI"];
  return (
    <section className="border-y border-[oklch(0.78_0.18_195_/_0.10)] bg-[oklch(0.055_0.008_250_/_0.8)] py-5">
      <div className="container">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[oklch(0.78_0.18_195_/_0.3)] to-transparent" />
          <span className="hud-label opacity-40">BATTLE-TESTED AT</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[oklch(0.78_0.18_195_/_0.3)] to-transparent" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {logos.map((logo) => (
            <span key={logo} className="font-display font-semibold text-sm text-[oklch(0.40_0.015_220)] hover:text-[oklch(0.65_0.015_220)] transition-colors tracking-wide">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Case Studies ─────────────────────────────────────────────────────────────
function CaseStudies() {
  const cases = [
    {
      client: "LearnLab AI",
      tag: "EdTech Platform",
      tagColor: "oklch(0.78 0.18 195)",
      headline: "Full-stack AI education platform built in record time.",
      stats: [
        { value: "95%", label: "Grading turnaround reduction" },
        { value: "85%", label: "Dev velocity boost" },
        { value: "0", label: "Production incidents at launch" },
      ],
      stack: ["Next.js", "LangGraph", "PostgreSQL", "K8s", "Terraform"],
      color: "oklch(0.78 0.18 195)",
    },
    {
      client: "Clapself",
      tag: "HR Tech / SaaS",
      tagColor: "oklch(0.82 0.20 58)",
      headline: "AI-augmented DevOps pipeline slashing cloud spend.",
      stats: [
        { value: "80%", label: "Cloud cost reduction" },
        { value: "12×", label: "Deployment frequency" },
        { value: "99.9%", label: "Uptime SLA maintained" },
      ],
      stack: ["AWS", "Terraform", "GitHub Actions", "Datadog", "n8n"],
      color: "oklch(0.82 0.20 58)",
    },
    {
      client: "Raytheon",
      tag: "Defense / Compliance",
      tagColor: "oklch(0.65 0.22 280)",
      headline: "CMMC-compliant infrastructure for classified workloads.",
      stats: [
        { value: "100%", label: "Compliance audit pass rate" },
        { value: "3×", label: "Faster security review cycles" },
        { value: "Zero", label: "Critical vulnerabilities shipped" },
      ],
      stack: ["GovCloud", "Vault", "Ansible", "STIG", "Zero Trust"],
      color: "oklch(0.65 0.22 280)",
    },
  ];

  return (
    <section id="case-studies" className="py-24 relative">
      <div className="absolute inset-0 line-grid-bg opacity-20" />
      <div className="container relative z-10">
        <div className="mb-14">
          <div className="hud-label mb-3 opacity-60">// VELOCITY CASE STUDIES</div>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
            Real Results. <span className="gradient-text">Documented.</span>
          </h2>
          <p className="text-[oklch(0.55_0.015_220)] text-lg max-w-xl">
            Not theoretical. Not estimated. These are the actual numbers from real engagements.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cases.map((c) => (
            <InteractiveCard key={c.client} containerClassName="rounded-xl" className="hud-card rounded-xl p-6 group transition-all duration-300 bg-opacity-40 backdrop-blur-md" flashlightSize={300} showBeam={true}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <span className="hud-label text-[10px] mb-2 block" style={{ color: c.color }}>{c.tag}</span>
                  <h3 className="font-display font-bold text-xl text-foreground">{c.client}</h3>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${c.color}20`, border: `1px solid ${c.color}40` }}>
                  <Activity className="w-4 h-4" style={{ color: c.color }} />
                </div>
              </div>

              <p className="text-[oklch(0.55_0.015_220)] text-sm mb-6 leading-relaxed">{c.headline}</p>

              <div className="space-y-3 mb-6">
                {c.stats.map((s) => (
                  <div key={s.label} className="flex items-center justify-between border-b border-[oklch(0.78_0.18_195_/_0.06)] pb-2 last:border-0">
                    <span className="text-xs text-[oklch(0.45_0.015_220)]">{s.label}</span>
                    <span className="font-display font-bold text-base" style={{ color: c.color }}>{s.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {c.stack.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded border border-[oklch(0.78_0.18_195_/_0.15)] text-[oklch(0.50_0.015_220)] bg-[oklch(0.78_0.18_195_/_0.04)]">
                    {t}
                  </span>
                ))}
              </div>
            </InteractiveCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Services ─────────────────────────────────────────────────────────────────
function Services() {
  return (
    <section id="services" className="py-24 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10"
        style={{ background: "radial-gradient(ellipse, oklch(0.82 0.20 58) 0%, transparent 70%)" }} />

      <div className="container relative z-10">
        <div className="mb-14">
          <div className="hud-label mb-3 opacity-60">// HIGH-TICKET ENGAGEMENTS</div>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
            Two Ways to <span className="gradient-text-amber">Engage.</span>
          </h2>
          <p className="text-[oklch(0.55_0.015_220)] text-lg max-w-xl">
            No hourly billing. No scope creep. Fixed outcomes, fixed price.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
          <InteractiveCard containerClassName="rounded-2xl" className="amber-card rounded-2xl p-8 relative overflow-hidden group bg-opacity-40 backdrop-blur-md" showBeam={true}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, oklch(0.82 0.20 58) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

            <div className="hud-label mb-2" style={{ color: "oklch(0.82 0.20 58)" }}>TIER 01 // THE SPRINT</div>
            <div className="font-display font-bold text-5xl text-[oklch(0.82_0.20_58)] mb-1">$15,000</div>
            <div className="text-[oklch(0.55_0.015_220)] text-sm font-mono mb-6">One-time · 3-day delivery</div>

            <p className="text-[oklch(0.65_0.015_220)] mb-8 leading-relaxed">
              A weekend intensive to diagnose and fix your most critical infrastructure bottleneck.
              I arrive with 30 years of scar tissue and leave with your system transformed.
            </p>

            <div className="space-y-4 mb-8">
              {[
                "Full infrastructure audit & threat model",
                "IaC refactor with Terraform/Pulumi",
                "CI/CD pipeline rebuild from scratch",
                "Cost optimization implementation",
                "30-day async support included",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 py-1">
                  <CheckCircle2 className="w-4 h-4 text-[oklch(0.82_0.20_58)] shrink-0 mt-0.5" />
                  <span className="text-sm text-[oklch(0.65_0.015_220)] leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            <Link href="/book?type=sprint">
              <Button className="w-full bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] hover:bg-[oklch(0.88_0.18_60)] font-bold text-base h-12 glow-amber transition-all">
                Book Your Sprint <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </InteractiveCard>

          <InteractiveCard containerClassName="rounded-2xl" className="hud-card rounded-2xl p-8 relative overflow-hidden group bg-opacity-40 backdrop-blur-md" showBeam={true}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, oklch(0.78 0.18 195) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

            <div className="hud-label mb-2 text-cyan-hud">TIER 02 // THE ADVISORY</div>
            <div className="font-display font-bold text-5xl text-[oklch(0.78_0.18_195)] mb-1">$10,000</div>
            <div className="text-[oklch(0.55_0.015_220)] text-sm font-mono mb-6">Per month · Fractional CTO</div>

            <p className="text-[oklch(0.65_0.015_220)] mb-8 leading-relaxed">
              Your on-call infrastructure force multiplier. I bridge the gap between your C-suite's
              vision and your engineering team's execution — with the authority of someone who's done it at scale.
            </p>

            <div className="space-y-4 mb-8">
              {[
                "Weekly architecture review calls",
                "On-call Slack access (business hours)",
                "AI-augmented DevOps implementation",
                "Vendor negotiation & cost governance",
                "Team mentoring & code review",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 py-1">
                  <CheckCircle2 className="w-4 h-4 text-[oklch(0.78_0.18_195)] shrink-0 mt-0.5" />
                  <span className="text-sm text-[oklch(0.65_0.015_220)] leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            <Link href="/book?type=advisory">
              <Button className="w-full bg-[oklch(0.78_0.18_195)] text-[oklch(0.04_0.005_260)] hover:bg-[oklch(0.85_0.15_190)] font-bold text-base h-12 glow-cyan transition-all">
                Start the Advisory <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </InteractiveCard>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const quotes = [
    {
      quote: "Christopher doesn't just fix infrastructure — he rearchitects how your entire team thinks about deployment. We went from 3-week release cycles to daily deploys in under two months.",
      name: "Sarah Chen",
      title: "VP Engineering",
      company: "Series B Fintech",
      color: "oklch(0.82 0.20 58)",
    },
    {
      quote: "I've worked with a lot of DevOps consultants. Christopher is the first one who could sit in a board meeting, explain the technical risk in business terms, and then go implement the fix himself by Friday.",
      name: "Marcus Williams",
      title: "CTO",
      company: "Healthcare SaaS",
      color: "oklch(0.78 0.18 195)",
    },
    {
      quote: "We were burning $45k/month on AWS. After Christopher's 3-day sprint, we're at $9k. Same performance. Better observability. He literally paid for himself 3x over in the first month.",
      name: "David Park",
      title: "Co-Founder",
      company: "AI Startup",
      color: "oklch(0.65 0.22 280)",
    },
    {
      quote: "If you think good infrastructure is expensive, you should look at the cost of bad infrastructure. Christopher is the most cost-effective hire we've ever made.",
      name: "Jennifer Torres",
      title: "CEO",
      company: "Digital Health Platform",
      color: "oklch(0.68 0.20 160)",
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 line-grid-bg opacity-15" />
      <div className="container relative z-10">
        <div className="mb-14">
          <div className="hud-label mb-3 opacity-60">// CLIENT TRANSMISSIONS</div>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
            What They <span className="text-cyan-hud">Actually Say.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {quotes.map((q, i) => (
            <InteractiveCard key={i} containerClassName="rounded-xl" className="hud-card rounded-xl p-7 relative group transition-all duration-300 bg-opacity-40 backdrop-blur-md" flashlightSize={300} showBeam={true}>
              {/* Big quote mark */}
              <div className="absolute top-4 right-5 font-display text-7xl leading-none opacity-10 select-none" style={{ color: q.color }}>
                "
              </div>

              <div className="mb-1">
                <span className="hud-label opacity-40">TRANSMISSION {String(i + 1).padStart(2, "0")}</span>
              </div>

              <blockquote className="text-[oklch(0.72_0.015_220)] text-base leading-relaxed mb-6 relative z-10">
                "{q.quote}"
              </blockquote>

              <div className="flex items-center gap-3 border-t border-[oklch(0.78_0.18_195_/_0.08)] pt-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0"
                  style={{ background: `${q.color}20`, border: `1px solid ${q.color}40`, color: q.color, lineHeight: 1 }}>
                  <span style={{ display: "block", lineHeight: 1 }}>{q.name[0]}</span>
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">{q.name}</div>
                  <div className="text-xs text-[oklch(0.45_0.015_220)]">{q.title} · {q.company}</div>
                </div>
              </div>
            </InteractiveCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function About() {
  const timeline = [
    { year: "1995", event: "Started career in infrastructure engineering" },
    { year: "2008", event: "Led platform engineering at Raytheon (classified systems)" },
    { year: "2015", event: "Google Professional Services — multi-cloud migrations" },
    { year: "2019", event: "Staff Infrastructure Engineer at Spotify" },
    { year: "2023", event: "Founded Castles of Light — AI-augmented consulting" },
    { year: "2025", event: "Launched LearnLab AI & Clapself platforms" },
  ];

  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-5"
        style={{ background: "radial-gradient(ellipse at right, oklch(0.78 0.18 195) 0%, transparent 70%)" }} />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="hud-label mb-3 opacity-60">// OPERATOR PROFILE</div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-6">
              30 Years of <span className="gradient-text">Scar Tissue.</span>
            </h2>
            <p className="text-[oklch(0.60_0.015_220)] text-lg leading-relaxed mb-6">
              I'm Christopher Cotton — a Staff-level Infrastructure & DevOps engineer who has shipped
              production systems for defense contractors, streaming giants, and AI startups. I've seen
              every way infrastructure can fail, and I've fixed most of them.
            </p>
            <p className="text-[oklch(0.55_0.015_220)] leading-relaxed mb-8">
              What makes me different isn't just the depth — it's the translation layer. I can sit in
              a board meeting, explain technical risk in business terms, and then implement the fix
              myself by end of week. That's rare. That's why clients pay for it.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {["Terraform", "Kubernetes", "AWS/GCP/Azure", "LangGraph", "n8n", "Vault", "Datadog", "GitHub Actions", "Python", "Go", "CMMC", "HIPAA"].map((skill) => (
                <span key={skill} className="text-xs font-mono px-2.5 py-1 rounded border border-[oklch(0.78_0.18_195_/_0.20)] text-[oklch(0.55_0.015_220)] bg-[oklch(0.78_0.18_195_/_0.05)]">
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex gap-4">
              <a href="https://linkedin.com/in/christophercotton" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="border-[oklch(0.78_0.18_195_/_0.3)] text-[oklch(0.78_0.18_195)] hover:bg-[oklch(0.78_0.18_195_/_0.08)]">
                  <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                </Button>
              </a>
              <a href="https://github.com/christophercotton" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="border-border text-[oklch(0.55_0.015_220)] hover:text-foreground hover:border-[oklch(0.55_0.015_220_/_0.5)]">
                  <Github className="w-4 h-4 mr-2" /> GitHub
                </Button>
              </a>
            </div>
          </div>

          {/* Timeline */}
          <InteractiveCard containerClassName="rounded-2xl" className="hud-card rounded-2xl p-6">
            <div className="hud-label mb-5 opacity-60">CAREER TIMELINE</div>
            <div className="space-y-0">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: i === timeline.length - 1 ? "oklch(0.82 0.20 58)" : "oklch(0.78 0.18 195)", boxShadow: `0 0 8px ${i === timeline.length - 1 ? "oklch(0.82 0.20 58 / 0.6)" : "oklch(0.78 0.18 195 / 0.4)"}` }} />
                    {i < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-gradient-to-b from-[oklch(0.78_0.18_195_/_0.3)] to-transparent mt-1" style={{ minHeight: "32px" }} />
                    )}
                  </div>
                  <div className="pb-6 last:pb-0">
                    <span className="hud-label text-[10px] opacity-60">{item.year}</span>
                    <p className="text-sm text-[oklch(0.65_0.015_220)] mt-0.5 leading-relaxed">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </InteractiveCard>
        </div>
      </div>
    </section>
  );
}

// ─── Book Lead Magnet ─────────────────────────────────────────────────────────
function BookSection() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const capture = trpc.capture.bookDownload.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[oklch(0.82_0.20_58_/_0.03)] to-transparent" />
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto">
          <InteractiveCard containerClassName="rounded-2xl" className="amber-card rounded-2xl p-10 md:p-14 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle, oklch(0.82 0.20 58) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

            <div className="relative z-10">
              <div className="hud-label mb-4" style={{ color: "oklch(0.82 0.20 58)" }}>// COMING SOON — FREE CHAPTER</div>
              <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
                HARDCORE INFRASTRUCTURE<br />
                <span className="gradient-text-amber">& PLATFORM ENGINEERING</span>
              </h2>
              <p className="text-[oklch(0.60_0.015_220)] text-lg mb-8 max-w-xl leading-relaxed">
                The unfiltered playbook for building infrastructure that doesn't break at 3am.
                30 years of lessons from Spotify, Google, Raytheon — distilled into actionable patterns.
              </p>

              {submitted ? (
                <div className="flex items-center gap-3 p-5 rounded-xl border border-[oklch(0.68_0.20_160_/_0.4)] bg-[oklch(0.68_0.20_160_/_0.08)]">
                  <CheckCircle2 className="w-6 h-6 text-[oklch(0.68_0.20_160)]" />
                  <div>
                    <p className="font-semibold text-foreground">You're on the list.</p>
                    <p className="text-sm text-[oklch(0.55_0.015_220)]">The free chapter lands in your inbox when the book drops.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
                  <Input
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-[oklch(0.07_0.008_240)] border-[oklch(0.82_0.20_58_/_0.25)] text-foreground placeholder:text-[oklch(0.40_0.015_220)] h-12 focus:border-[oklch(0.82_0.20_58_/_0.6)] sm:w-36 shrink-0"
                  />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[oklch(0.07_0.008_240)] border-[oklch(0.82_0.20_58_/_0.25)] text-foreground placeholder:text-[oklch(0.40_0.015_220)] h-12 focus:border-[oklch(0.82_0.20_58_/_0.6)] flex-1"
                  />
                  <Button
                    className="bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] hover:bg-[oklch(0.88_0.18_60)] font-bold h-12 px-6 shrink-0 glow-sm-amber"
                    onClick={() => {
                      if (!email) { toast.error("Please enter your email."); return; }
                      capture.mutate({ email, firstName: firstName || undefined });
                    }}
                    disabled={capture.isPending}
                  >
                    {capture.isPending ? "..." : "Get Free Chapter"}
                  </Button>
                </div>
              )}
            </div>
          </InteractiveCard>
        </div>
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
function Contact() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", company: "", message: "", offerInterest: "unknown" as const });
  const [submitted, setSubmitted] = useState(false);

  const submit = trpc.lead.submitContact.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 line-grid-bg opacity-15" />
      <div className="container relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 text-center">
            <div className="hud-label mb-3 opacity-60">// INITIATE CONTACT</div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              Let's Talk <span className="text-cyan-hud">Infrastructure.</span>
            </h2>
            <p className="text-[oklch(0.55_0.015_220)]">
              Not a cold form. This goes directly into my CRM and I read every message personally.
            </p>
          </div>

          {submitted ? (
            <InteractiveCard containerClassName="rounded-2xl" className="hud-card rounded-2xl p-10 text-center">
              <CheckCircle2 className="w-12 h-12 text-[oklch(0.68_0.20_160)] mx-auto mb-4" />
              <h3 className="font-display font-bold text-2xl text-foreground mb-2">Message received.</h3>
              <p className="text-[oklch(0.55_0.015_220)]">I'll respond within 24 hours. Check your inbox.</p>
            </InteractiveCard>
          ) : (
            <InteractiveCard containerClassName="rounded-2xl" className="hud-card rounded-2xl p-8 space-y-5" showBeam={true} flashlightSize={400}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="hud-label mb-2 block opacity-60">FIRST NAME</label>
                  <input value={form.firstName} onChange={f("firstName")} placeholder="Christopher"
                    className="w-full h-11 px-4 rounded-lg bg-[oklch(0.07_0.008_240)] border border-[oklch(0.78_0.18_195_/_0.20)] text-foreground placeholder:text-[oklch(0.35_0.015_220)] text-sm font-mono focus:outline-none focus:border-[oklch(0.78_0.18_195_/_0.5)] transition-colors" />
                </div>
                <div>
                  <label className="hud-label mb-2 block opacity-60">LAST NAME</label>
                  <input value={form.lastName} onChange={f("lastName")} placeholder="Cotton"
                    className="w-full h-11 px-4 rounded-lg bg-[oklch(0.07_0.008_240)] border border-[oklch(0.78_0.18_195_/_0.20)] text-foreground placeholder:text-[oklch(0.35_0.015_220)] text-sm font-mono focus:outline-none focus:border-[oklch(0.78_0.18_195_/_0.5)] transition-colors" />
                </div>
              </div>
              <div>
                <label className="hud-label mb-2 block opacity-60">EMAIL</label>
                <input type="email" value={form.email} onChange={f("email")} placeholder="you@company.com"
                  className="w-full h-11 px-4 rounded-lg bg-[oklch(0.07_0.008_240)] border border-[oklch(0.78_0.18_195_/_0.20)] text-foreground placeholder:text-[oklch(0.35_0.015_220)] text-sm font-mono focus:outline-none focus:border-[oklch(0.78_0.18_195_/_0.5)] transition-colors" />
              </div>
              <div>
                <label className="hud-label mb-2 block opacity-60">COMPANY</label>
                <input value={form.company} onChange={f("company")} placeholder="Acme Corp"
                  className="w-full h-11 px-4 rounded-lg bg-[oklch(0.07_0.008_240)] border border-[oklch(0.78_0.18_195_/_0.20)] text-foreground placeholder:text-[oklch(0.35_0.015_220)] text-sm font-mono focus:outline-none focus:border-[oklch(0.78_0.18_195_/_0.5)] transition-colors" />
              </div>
              <div>
                <label className="hud-label mb-2 block opacity-60">I'M INTERESTED IN</label>
                <select value={form.offerInterest} onChange={f("offerInterest")}
                  className="w-full h-11 px-4 rounded-lg bg-[oklch(0.07_0.008_240)] border border-[oklch(0.78_0.18_195_/_0.20)] text-foreground text-sm font-mono focus:outline-none focus:border-[oklch(0.78_0.18_195_/_0.5)] transition-colors">
                  <option value="unknown">Not sure yet</option>
                  <option value="sprint">The Sprint ($15k)</option>
                  <option value="advisory">The Advisory ($10k/mo)</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="hud-label mb-2 block opacity-60">MESSAGE</label>
                <textarea value={form.message} onChange={f("message")} rows={4}
                  placeholder="Tell me about your infrastructure challenge..."
                  className="w-full px-4 py-3 rounded-lg bg-[oklch(0.07_0.008_240)] border border-[oklch(0.78_0.18_195_/_0.20)] text-foreground placeholder:text-[oklch(0.35_0.015_220)] text-sm font-mono focus:outline-none focus:border-[oklch(0.78_0.18_195_/_0.5)] transition-colors resize-none" />
              </div>
              <Button
                className="w-full bg-[oklch(0.78_0.18_195)] text-[oklch(0.04_0.005_260)] hover:bg-[oklch(0.85_0.15_190)] font-bold h-12 text-base glow-cyan transition-all"
                onClick={() => {
                  if (!form.firstName || !form.email) { toast.error("First name and email are required."); return; }
                  submit.mutate(form);
                }}
                disabled={submit.isPending}
              >
                {submit.isPending ? "Transmitting..." : "Send Message"} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </InteractiveCard>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-[oklch(0.78_0.18_195_/_0.10)] pt-14 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[oklch(0.82_0.20_58)] flex items-center justify-center">
                <Terminal className="w-3.5 h-3.5 text-[oklch(0.06_0.01_260)]" />
              </div>
              <span className="font-display font-bold text-foreground">
                Castles<span className="text-[oklch(0.82_0.20_58)]">of</span>Light
              </span>
            </div>
            <p className="text-xs text-[oklch(0.40_0.015_220)] leading-relaxed mb-4">
              AI-augmented infrastructure consulting. 30 years of scar tissue, deployed at the speed of thought.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-[oklch(0.40_0.015_220)]">
              <a href="mailto:chriscotton@castlesoflight.com" className="hover:text-[oklch(0.78_0.18_195)] transition-colors flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
              <a href="https://linkedin.com/in/christophercotton" target="_blank" rel="noopener noreferrer" className="hover:text-[oklch(0.78_0.18_195)] transition-colors flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
              <a href="https://github.com/christophercotton" target="_blank" rel="noopener noreferrer" className="hover:text-[oklch(0.78_0.18_195)] transition-colors flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-xs font-mono text-[oklch(0.78_0.18_195)] tracking-widest mb-4">// QUICK LINKS</p>
            <ul className="space-y-2">
              {[
                { href: "#services", label: "Services" },
                { href: "#case-studies", label: "Case Studies" },
                { href: "#about", label: "About" },
                { href: "/book", label: "Book a Call" },
                { href: "#contact", label: "Contact" },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-xs text-[oklch(0.40_0.015_220)] hover:text-[oklch(0.78_0.18_195)] transition-colors font-mono">
                    → {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <NewsletterSignup variant="footer" source="landing_page" subtitle="Weekly AI + DevOps tactics from the trenches. No fluff." />
          </div>
        </div>

        <div className="border-t border-[oklch(0.78_0.18_195_/_0.08)] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-[oklch(0.25_0.015_220)]">
            © 2026 Castles of Light LLC · San Francisco, CA
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-[oklch(0.25_0.015_220)]">
            <span className="text-[oklch(0.78_0.18_195_/_0.4)]">● SYS.ONLINE</span>
            <span>CASTLES OF LIGHT v2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-[oklch(0.04_0.005_260)]">
      <NewsletterPopup />
      <HudStatusBar />
      <Nav />
      <Hero />
      <LogosBar />
      <CaseStudies />
      <Services />
      <Testimonials />
      <LeadMagnet />
      <About />
      <BookSection />
      <NewsletterSignup variant="hero" title="HARDCORE INFRASTRUCTURE" subtitle="Weekly dispatches on AI-augmented DevOps, cloud cost reduction, and building at the speed of thought. Written by a 30-year infrastructure veteran." source="landing_page" />
      <Contact />
      <Footer />
    </div>
  );
}
