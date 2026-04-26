import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import AsciiBackground from "@/components/AsciiBackground";
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
  ChevronRight,
  User,
  Settings,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/crm", label: "CRM Pipeline", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/availability", label: "Availability", icon: Clock },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/leads", label: "Lead Intel", icon: TrendingUp },
  { href: "/admin/email-templates", label: "Email Templates", icon: FileText },
  { href: "/admin/blog", label: "Blog Engine", icon: FileText },
];

function HudTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[10px] text-accent/60">
      {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
    </span>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 glow-sm-amber">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
        <span className="hud-label opacity-50">AUTHENTICATING...</span>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <AsciiBackground />
      <div className="hud-card rounded-2xl p-10 text-center max-w-sm w-full mx-4 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5 glow-sm-amber">
          <Terminal className="w-8 h-8 text-primary" />
        </div>
        <div className="sys-online mx-auto w-fit mb-4">NERVE CENTER</div>
        <h1 className="font-display font-bold text-2xl text-foreground mb-2">Admin Access</h1>
        <p className="text-muted-foreground text-sm mb-6">Sign in to access the command dashboard.</p>
        <a href={getLoginUrl()}>
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold glow-sm-amber">
            Sign In
          </Button>
        </a>
      </div>
    </div>
  );

  if (user?.role !== "admin") return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="hud-card rounded-2xl p-10 text-center max-w-sm w-full mx-4 relative z-10">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-sm mb-6">You don't have admin clearance for this area.</p>
        <Link href="/">
          <Button variant="outline" className="border-border text-muted-foreground">Return to Public Site</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar variant="inset" collapsible="icon" className="border-r border-border/50">
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_var(--primary-glow)] shrink-0">
                <Terminal className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="font-display font-bold text-sm text-foreground leading-none">Nerve Center</span>
                <span className="text-[9px] font-mono text-muted-foreground/40 mt-0.5 tracking-widest uppercase">CASTLES OF LIGHT</span>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-2 group-data-[collapsible=icon]:hidden">COMMAND CENTER</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => {
                    const active = item.exact ? location === item.href : location.startsWith(item.href);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={active}
                          tooltip={item.label}
                          className={active ? "bg-primary/10 text-primary hover:bg-primary/15" : ""}
                        >
                          <Link href={item.href} className="flex items-center gap-3">
                            <item.icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="font-medium">{item.label}</span>
                            {active && (
                               <div className="ml-auto w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_var(--primary-glow)] group-data-[collapsible=icon]:hidden" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="mx-4 my-2 opacity-50" />

            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-2 group-data-[collapsible=icon]:hidden">SYSTEM</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="View Site">
                      <Link href="/" className="flex items-center gap-3">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <span>Public Site</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border/50">
            <SidebarMenu>
              <SidebarMenuItem>
                 <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center">
                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                       <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                       <span className="text-xs font-semibold text-foreground truncate">{user?.name ?? "Admin"}</span>
                       <span className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter opacity-60">Master Operator</span>
                    </div>
                 </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => logout()} 
                  className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  tooltip="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <header className="flex h-12 items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                 <Activity className="w-3.5 h-3.5 text-accent/50" />
                 <span className="text-[10px] font-mono text-muted-foreground/40 tracking-widest hidden sm:inline">CLUSTER_ID: COL-SF-01</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <span className="sys-online text-[9px]">SYS.ONLINE</span>
                 <HudTime />
              </div>
              <Separator orientation="vertical" className="h-4" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                 <Settings className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto bg-background/50">
            <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
