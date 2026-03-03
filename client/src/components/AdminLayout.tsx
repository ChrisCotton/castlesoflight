import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Clock,
  Terminal,
  LogOut,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Activity,
  Mail,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/crm", label: "CRM Pipeline", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/availability", label: "Availability", icon: Clock },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/leads", label: "Lead Intel", icon: TrendingUp },
  { href: "/admin/email-templates", label: "Email Templates", icon: FileText },
];

function HudTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[10px] text-[oklch(0.78_0.18_195_/_0.6)]">
      {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
    </span>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-[oklch(0.04_0.005_260)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-[oklch(0.82_0.20_58_/_0.15)] border border-[oklch(0.82_0.20_58_/_0.3)] flex items-center justify-center mx-auto mb-4 glow-sm-amber">
          <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.82_0.20_58)]" />
        </div>
        <span className="hud-label opacity-50">AUTHENTICATING...</span>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[oklch(0.04_0.005_260)] flex items-center justify-center">
      <div className="hud-card rounded-2xl p-10 text-center max-w-sm w-full mx-4">
        <div className="w-16 h-16 rounded-2xl bg-[oklch(0.82_0.20_58_/_0.12)] border border-[oklch(0.82_0.20_58_/_0.3)] flex items-center justify-center mx-auto mb-5 glow-sm-amber">
          <Terminal className="w-8 h-8 text-[oklch(0.82_0.20_58)]" />
        </div>
        <div className="sys-online mx-auto w-fit mb-4">NERVE CENTER</div>
        <h1 className="font-display font-bold text-2xl text-foreground mb-2">Admin Access</h1>
        <p className="text-[oklch(0.50_0.015_220)] text-sm mb-6">Sign in to access the command dashboard.</p>
        <a href={getLoginUrl()}>
          <Button className="w-full bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] hover:bg-[oklch(0.88_0.18_60)] font-bold glow-sm-amber">
            Sign In
          </Button>
        </a>
      </div>
    </div>
  );

  if (user?.role !== "admin") return (
    <div className="min-h-screen bg-[oklch(0.04_0.005_260)] flex items-center justify-center">
      <div className="hud-card rounded-2xl p-10 text-center max-w-sm w-full mx-4">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl text-foreground mb-2">Access Denied</h1>
        <p className="text-[oklch(0.50_0.015_220)] text-sm mb-6">You don't have admin clearance for this area.</p>
        <Link href="/">
          <Button variant="outline" className="border-[oklch(0.78_0.18_195_/_0.3)] text-[oklch(0.78_0.18_195)]">Return to Public Site</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[oklch(0.04_0.005_260)] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[oklch(0.78_0.18_195_/_0.12)] bg-[oklch(0.055_0.008_250)] flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-[oklch(0.78_0.18_195_/_0.10)]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[oklch(0.82_0.20_58)] flex items-center justify-center glow-sm-amber">
              <Terminal className="w-3.5 h-3.5 text-[oklch(0.06_0.01_260)]" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-foreground leading-none">Nerve Center</div>
              <div className="hud-label text-[9px] opacity-40 mt-0.5">COMMAND DASHBOARD</div>
            </div>
          </Link>
        </div>

        {/* Status */}
        <div className="px-4 py-2.5 border-b border-[oklch(0.78_0.18_195_/_0.08)] flex items-center justify-between">
          <span className="sys-online text-[9px]">SYS.ONLINE</span>
          <HudTime />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? location === item.href : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-[oklch(0.82_0.20_58_/_0.15)] text-[oklch(0.82_0.20_58)] border border-[oklch(0.82_0.20_58_/_0.25)]"
                    : "text-[oklch(0.55_0.015_220)] hover:bg-[oklch(0.78_0.18_195_/_0.06)] hover:text-[oklch(0.78_0.18_195)]"
                }`}>
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[oklch(0.82_0.20_58)]" style={{ boxShadow: "0 0 6px oklch(0.82 0.20 58 / 0.8)" }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[oklch(0.78_0.18_195_/_0.10)] space-y-1">
          <Link href="/">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[oklch(0.45_0.015_220)] hover:bg-[oklch(0.78_0.18_195_/_0.06)] hover:text-[oklch(0.78_0.18_195)] cursor-pointer transition-all">
              <ExternalLink className="w-3.5 h-3.5" />
              View Public Site
            </div>
          </Link>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
            <div className="w-6 h-6 rounded-md bg-[oklch(0.82_0.20_58_/_0.15)] border border-[oklch(0.82_0.20_58_/_0.3)] flex items-center justify-center text-[oklch(0.82_0.20_58)] text-xs font-bold font-display">
              {user?.name?.[0] ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[oklch(0.65_0.015_220)] truncate font-medium">{user?.name ?? "Admin"}</div>
              <div className="hud-label text-[9px] opacity-40">ADMIN</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[oklch(0.45_0.015_220)] hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-10 border-b border-[oklch(0.78_0.18_195_/_0.10)] bg-[oklch(0.04_0.005_260_/_0.95)] backdrop-blur-xl px-6 h-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[oklch(0.78_0.18_195_/_0.5)]" />
            <span className="hud-label opacity-40">CASTLES OF LIGHT // NERVE CENTER</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hud-label opacity-30">OPERATOR: {user?.name?.toUpperCase() ?? "ADMIN"}</span>
          </div>
        </div>
        <div className="p-6 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
