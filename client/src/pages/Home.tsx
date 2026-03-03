import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Zap,
  Shield,
  TrendingDown,
  Clock,
  CheckCircle2,
  Star,
  ChevronRight,
  Terminal,
  Cloud,
  Lock,
  BarChart3,
  Users,
  BookOpen,
  Calendar,
  Mail,
  Github,
  Linkedin,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Terminal className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">
            Castles<span className="text-primary">of</span>Light
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Case Studies", href: "#case-studies" },
            { label: "Services", href: "#services" },
            { label: "About", href: "#about" },
            { label: "Book", href: "/book" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/book">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              Book a Call
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-4">
          {[
            { label: "Case Studies", href: "#case-studies" },
            { label: "Services", href: "#services" },
            { label: "About", href: "#about" },
          ].map((item) => (
            <a key={item.label} href={item.href} className="text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          <Link href="/book" onClick={() => setOpen(false)}>
            <Button className="w-full bg-primary text-primary-foreground">Book a Call</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="container relative z-10">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 text-xs font-mono px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-primary mr-2 inline-block animate-pulse" />
              Available for new engagements
            </Badge>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6 text-foreground">
            I Build{" "}
            <span className="gradient-text">3-Month Infrastructure</span>
            {" "}in{" "}
            <span className="text-primary">48 Hours.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-4 leading-relaxed">
            30 years of elite infrastructure engineering — Spotify, Google ProServe, Raytheon — now turbocharged with agentic AI.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mb-10">
            I slash cloud costs by <span className="text-primary font-semibold">80%</span> and deployment lag by <span className="text-primary font-semibold">99%</span> for fintech and healthcare companies who can't afford to move slowly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/book">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base px-8 py-6 glow-amber">
                Book Your 48-Hour Sprint
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#case-studies">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary text-base px-8 py-6">
                See the Proof
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-border/50">
            {[
              { value: "30+", label: "Years Experience" },
              { value: "80%", label: "Avg Cost Reduction" },
              { value: "200M+", label: "Users Served (Spotify)" },
              { value: "48hrs", label: "Sprint Delivery" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-display font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Logo bar ─────────────────────────────────────────────────────────────────
function LogoBar() {
  const logos = ["Spotify", "Google", "Raytheon", "Federal Reserve", "New York Life", "Royal Caribbean", "ADP"];
  return (
    <section className="border-y border-border/50 bg-card/30 py-8">
      <div className="container">
        <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-6 font-mono">
          Battle-tested at elite organizations
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {logos.map((logo) => (
            <span key={logo} className="text-muted-foreground/60 font-display font-semibold text-sm md:text-base hover:text-muted-foreground transition-colors">
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
  const studies = [
    {
      client: "LearnLab AI",
      category: "EdTech / AI Platform",
      color: "text-[oklch(0.62_0.22_280)]",
      bgColor: "bg-[oklch(0.62_0.22_280_/_0.1)]",
      borderColor: "border-[oklch(0.62_0.22_280_/_0.3)]",
      headline: "Full-stack AI education platform — built and deployed in record time.",
      description:
        "Architected a complete AI-driven education platform from scratch using Cursor AI and agentic workflows. Deployed on GKE with full CI/CD, automated testing, and real-time AI grading.",
      stats: [
        { value: "95%", label: "Decrease in grading turnaround" },
        { value: "85%", label: "Boost in dev velocity" },
        { value: "80%", label: "Infrastructure cost reduction" },
        { value: "99%", label: "Decrease in deployment time" },
      ],
      stack: ["GKE", "Terraform", "GitHub Actions", "GPT-5", "Playwright", "Prometheus"],
    },
    {
      client: "Clapself (Fintech)",
      category: "Financial Services / AI",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
      headline: "AWS ECS → GKE migration for a financial AI platform with mandatory security compliance.",
      description:
        "Led the complete cloud migration for a fintech AI platform running Llama 3 and Gemini microservices. Implemented the full security stack required for financial services deployment.",
      stats: [
        { value: "80%", label: "Cloud cost reduction" },
        { value: "100%", label: "Security compliance achieved" },
        { value: "4,000+", label: "Microservices managed (NYL)" },
        { value: "0", label: "Security incidents post-migration" },
      ],
      stack: ["Kubernetes", "ArgoCD", "KICS", "Checkov", "Vault", "Prometheus", "Grafana"],
    },
    {
      client: "Raytheon Technologies",
      category: "Defense / Compliance",
      color: "text-[oklch(0.65_0.18_160)]",
      bgColor: "bg-[oklch(0.65_0.18_160_/_0.1)]",
      borderColor: "border-[oklch(0.65_0.18_160_/_0.3)]",
      headline: "Enterprise IaC library + security scanning for a defense contractor.",
      description:
        "Built a comprehensive library of reusable Terraform and Pulumi modules with integrated security scanning across AWS, GCP, and Azure. Established code review processes for a 12-person team.",
      stats: [
        { value: "12+", label: "Security scanning tools integrated" },
        { value: "3", label: "Cloud platforms (AWS/GCP/Azure)" },
        { value: "60%", label: "Latency reduction via AWS Global Accelerator" },
        { value: "100%", label: "IaC coverage for all deployments" },
      ],
      stack: ["Terraform", "Pulumi", "Trivy", "Falco", "Prisma Cloud", "SonarQube", "Nexus IQ"],
    },
  ];

  return (
    <section id="case-studies" className="py-24 scroll-mt-16">
      <div className="container">
        <div className="mb-16">
          <Badge variant="outline" className="border-border text-muted-foreground mb-4 font-mono text-xs">
            Velocity Case Studies
          </Badge>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            The Proof is in the{" "}
            <span className="gradient-text">Numbers</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            These aren't estimates or projections. These are real outcomes from real engagements, delivered at AI-augmented speed.
          </p>
        </div>

        <div className="grid gap-8">
          {studies.map((study, i) => (
            <div
              key={study.client}
              className={`rounded-2xl border ${study.borderColor} bg-card p-8 md:p-10`}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={`${study.bgColor} ${study.color} border-0 font-mono text-xs`}>
                      {study.category}
                    </Badge>
                    <span className="text-muted-foreground text-sm font-mono">Case Study {String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                    {study.client}
                  </h3>
                  <p className={`text-lg font-medium ${study.color} mb-4`}>{study.headline}</p>
                  <p className="text-muted-foreground leading-relaxed mb-6">{study.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {study.stack.map((tech) => (
                      <span key={tech} className="text-xs font-mono px-2 py-1 rounded bg-secondary text-secondary-foreground border border-border/50">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:w-72 shrink-0">
                  {study.stats.map((stat) => (
                    <div key={stat.label} className={`rounded-xl ${study.bgColor} border ${study.borderColor} p-4 text-center`}>
                      <div className={`text-3xl font-display font-bold ${study.color}`}>{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-1 leading-tight">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Services / Offers ────────────────────────────────────────────────────────
function Services() {
  return (
    <section id="services" className="py-24 scroll-mt-16 bg-card/20 border-y border-border/50">
      <div className="container">
        <div className="mb-16 text-center">
          <Badge variant="outline" className="border-border text-muted-foreground mb-4 font-mono text-xs">
            High-Ticket Engagements
          </Badge>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Two Ways to Work{" "}
            <span className="gradient-text">Together</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No hourly billing. No scope creep. Outcome-based engagements designed to deliver maximum value in minimum time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* The Sprint */}
          <div className="relative rounded-2xl border border-primary/40 bg-card overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50" />
            <div className="p-8 md:p-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30 font-mono">Most Popular</Badge>
              </div>

              <h3 className="text-2xl font-display font-bold text-foreground mb-2">The Sprint</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-display font-bold text-primary">$15,000</span>
                <span className="text-muted-foreground">/ engagement</span>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                A focused 48-hour intensive to solve your most critical infrastructure bottleneck. I come in, diagnose, architect, and deploy. You get 3 months of work done over a weekend.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  "Pre-sprint architecture review and scoping call",
                  "48-hour intensive hands-on implementation",
                  "Full IaC (Terraform/Ansible) delivered and documented",
                  "CI/CD pipeline with security scanning baked in",
                  "Monitoring dashboards (Prometheus + Grafana)",
                  "30-day post-sprint support via async messaging",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/book?type=sprint-kickoff">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6">
                  Book Sprint Kickoff Call
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* The Advisory */}
          <div className="relative rounded-2xl border border-accent/40 bg-card overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent/50" />
            <div className="p-8 md:p-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <Badge className="bg-accent/20 text-accent border-accent/30 font-mono">Ongoing</Badge>
              </div>

              <h3 className="text-2xl font-display font-bold text-foreground mb-2">The Advisory</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-display font-bold text-accent">$10,000</span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Fractional CTO services for startups and scale-ups that need senior-level oversight of their AI and cloud infrastructure without the $400k/year full-time hire.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  "Weekly 1:1 strategy sessions with your engineering team",
                  "Architecture review and technical decision support",
                  "AI agentic swarm design and oversight",
                  "Security and compliance posture management",
                  "Hiring and team structure advisory",
                  "Unlimited async Q&A via dedicated Slack channel",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/book?type=advisory-onboarding">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6">
                  Book Advisory Onboarding
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Exploratory call CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">Not sure which is right for you?</p>
          <Link href="/book?type=exploratory">
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
              Book a Free 30-Min Exploratory Call
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── About / Authority ────────────────────────────────────────────────────────
function About() {
  return (
    <section id="about" className="py-24 scroll-mt-16">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <Badge variant="outline" className="border-border text-muted-foreground mb-4 font-mono text-xs">
              The Engineer Behind the Work
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              30 Years of{" "}
              <span className="gradient-text">Scar Tissue</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              I'm Christopher Cotton — a Senior Cloud DevOps and Infrastructure Architect based in San Francisco. I've been building production systems since before "DevOps" was a word.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              I've managed infrastructure serving <strong className="text-foreground">200M+ users at Spotify</strong>, architected platforms for <strong className="text-foreground">4,000+ microservices at New York Life</strong>, delivered GCP solutions for Fortune 500 companies at <strong className="text-foreground">Google ProServe</strong>, and built security-hardened systems at <strong className="text-foreground">Raytheon</strong>.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Today, I combine that hard-won expertise with AI-augmented development — Cursor, Claude, GPT-5, agentic workflows — to deliver in 48 hours what used to take months. The result is enterprise-grade infrastructure at startup speed.
            </p>

            <div className="flex flex-wrap gap-3">
              {[
                { icon: Cloud, label: "14+ Years AWS" },
                { icon: Shield, label: "NIST / PCI-DSS / HIPAA" },
                { icon: Terminal, label: "10+ Years Terraform" },
                { icon: BarChart3, label: "AI-Augmented DevOps" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border/50 text-sm text-secondary-foreground">
                  <Icon className="w-4 h-4 text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {[
              { year: "2017–2018", org: "Spotify", role: "SRE — 200M+ users", color: "border-l-[oklch(0.65_0.18_160)]" },
              { year: "2018–2019", org: "Google ProServe", role: "DevOps Engineer — Fortune 500 clients", color: "border-l-primary" },
              { year: "2023–2024", org: "Raytheon Technologies", role: "DevOps Cloud Solutions Architect", color: "border-l-[oklch(0.7_0.2_200)]" },
              { year: "2024–2025", org: "Federal Reserve Bank SF", role: "Sr. Cloud DevOps Engineer", color: "border-l-[oklch(0.62_0.22_280)]" },
              { year: "2024–Present", org: "CastlesOfLight", role: "Founder & Principal Architect", color: "border-l-primary" },
            ].map((item) => (
              <div key={item.org} className={`pl-4 border-l-2 ${item.color} py-1`}>
                <div className="text-xs text-muted-foreground font-mono">{item.year}</div>
                <div className="font-display font-semibold text-foreground">{item.org}</div>
                <div className="text-sm text-muted-foreground">{item.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Book / Lead Magnet ───────────────────────────────────────────────────────
function BookSection() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const capture = trpc.capture.bookDownload.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Check your inbox! The free chapter is on its way.");
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  return (
    <section className="py-24 bg-card/30 border-y border-border/50">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
          {/* Book mockup */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
            <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-card to-secondary p-10 text-center glow-amber">
              <div className="text-6xl mb-4">📖</div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">Coming Soon</div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-2 leading-tight">
                HARDCORE<br />
                <span className="text-primary">INFRASTRUCTURE</span><br />
                & PLATFORM<br />
                ENGINEERING
              </h3>
              <p className="text-sm text-muted-foreground mt-4">
                By Christopher Cotton
              </p>
              <div className="mt-6 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
            </div>
          </div>

          {/* Copy + form */}
          <div>
            <Badge variant="outline" className="border-border text-muted-foreground mb-4 font-mono text-xs">
              Free Chapter Download
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              The Book That Took{" "}
              <span className="gradient-text">30 Years to Write</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Everything I know about building production infrastructure that doesn't break at 3am — distilled into a no-BS guide for senior engineers who are done with toy examples.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Get the free first chapter: <strong className="text-foreground">"The 5 Security Risks of Deploying LLMs in Fintech (And How to Fix Them)"</strong>
            </p>

            {submitted ? (
              <div className="rounded-xl border border-[oklch(0.65_0.18_160_/_0.5)] bg-[oklch(0.65_0.18_160_/_0.1)] p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-[oklch(0.65_0.18_160)] mx-auto mb-3" />
                <p className="font-display font-semibold text-foreground">You're on the list!</p>
                <p className="text-sm text-muted-foreground mt-1">Check your inbox for the free chapter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="book-firstname" className="text-sm text-muted-foreground mb-1 block">First Name</Label>
                  <Input
                    id="book-firstname"
                    placeholder="Christopher"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <Label htmlFor="book-email" className="text-sm text-muted-foreground mb-1 block">Email Address</Label>
                  <Input
                    id="book-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
                  onClick={() => {
                    if (!email) { toast.error("Please enter your email."); return; }
                    capture.mutate({ email, firstName: firstName || undefined });
                  }}
                  disabled={capture.isPending}
                >
                  {capture.isPending ? "Sending..." : "Get the Free Chapter"}
                  <BookOpen className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">No spam. Unsubscribe anytime.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Contact Form ─────────────────────────────────────────────────────────────
function ContactSection() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", company: "", message: "", offerInterest: "unknown" as const,
  });
  const [submitted, setSubmitted] = useState(false);
  const submit = trpc.lead.submitContact.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Message received! I'll be in touch within 24 hours.");
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  return (
    <section id="contact" className="py-24 scroll-mt-16">
      <div className="container max-w-2xl">
        <div className="text-center mb-12">
          <Badge variant="outline" className="border-border text-muted-foreground mb-4 font-mono text-xs">
            Get in Touch
          </Badge>
          <h2 className="text-4xl font-display font-bold text-foreground mb-4">
            Ready to{" "}
            <span className="gradient-text">Move Fast?</span>
          </h2>
          <p className="text-muted-foreground">
            Tell me about your infrastructure challenge. I respond to every serious inquiry within 24 hours.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">Message Received</h3>
            <p className="text-muted-foreground">I'll review your challenge and respond within 24 hours.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="c-first" className="text-sm text-muted-foreground mb-1 block">First Name *</Label>
                <Input id="c-first" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="bg-input border-border text-foreground" placeholder="Christopher" />
              </div>
              <div>
                <Label htmlFor="c-last" className="text-sm text-muted-foreground mb-1 block">Last Name *</Label>
                <Input id="c-last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="bg-input border-border text-foreground" placeholder="Cotton" />
              </div>
            </div>
            <div>
              <Label htmlFor="c-email" className="text-sm text-muted-foreground mb-1 block">Email *</Label>
              <Input id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-input border-border text-foreground" placeholder="you@company.com" />
            </div>
            <div>
              <Label htmlFor="c-company" className="text-sm text-muted-foreground mb-1 block">Company</Label>
              <Input id="c-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="bg-input border-border text-foreground" placeholder="Acme Corp" />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">I'm interested in...</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "sprint", label: "The Sprint ($15k)" },
                  { value: "advisory", label: "The Advisory ($10k/mo)" },
                  { value: "both", label: "Both" },
                  { value: "unknown", label: "Not sure yet" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, offerInterest: opt.value as typeof form.offerInterest })}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      form.offerInterest === opt.value
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border bg-secondary text-secondary-foreground hover:border-primary/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="c-message" className="text-sm text-muted-foreground mb-1 block">Tell me about your challenge</Label>
              <Textarea id="c-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="bg-input border-border text-foreground min-h-[120px]"
                placeholder="Describe your infrastructure challenge, current pain points, or what you're trying to achieve..." />
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
              onClick={() => {
                if (!form.firstName || !form.lastName || !form.email) {
                  toast.error("Please fill in the required fields.");
                  return;
                }
                submit.mutate({ ...form, source: "website_contact" });
              }}
              disabled={submit.isPending}
            >
              {submit.isPending ? "Sending..." : "Send Message"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-border/50 py-12 bg-card/20">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Terminal className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">CastlesofLight</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="mailto:mrchristopher.cotton@gmail.com" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Mail className="w-4 h-4" /> Email
            </a>
            <a href="https://linkedin.com/in/christophercotton" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
            <a href="https://github.com/christophercotton" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Github className="w-4 h-4" /> GitHub
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CastlesofLight LLC. San Francisco, CA.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <LogoBar />
      <CaseStudies />
      <Services />
      <About />
      <BookSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
