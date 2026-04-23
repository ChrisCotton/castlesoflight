import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowRight,
  Terminal,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

function NavAuthButtons({ mobile, onAction }: { mobile?: boolean; onAction?: () => void }) {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return null;

  const buttons = (
    <>
      {isAuthenticated && user ? (
        <>
          {user.role === "admin" && (
            <Link href="/admin" onClick={onAction}>
              <Button size="sm" variant="outline" className={cn(
                "border-primary/40 text-primary hover:bg-primary/10 font-mono text-xs",
                mobile && "w-full justify-start"
              )}>
                ADMIN
              </Button>
            </Link>
          )}
          <Link href="/book" onClick={onAction}>
            <Button size="sm" className={cn(
              "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-sm-amber transition-all",
              mobile && "w-full"
            )}>
              Book a Call <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </>
      ) : (
        <>
          <a href={getLoginUrl()} onClick={onAction}>
            <Button size="sm" variant="outline" className={cn(
              "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 font-mono text-xs",
              mobile && "w-full justify-start"
            )}>
              LOGIN
            </Button>
          </a>
          <Link href="/book" onClick={onAction}>
            <Button size="sm" className={cn(
              "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-sm-amber transition-all",
              mobile && "w-full"
            )}>
              Book a Call <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </>
      )}
    </>
  );

  return mobile ? <div className="flex flex-col gap-3 pt-4 border-t border-border/50">{buttons}</div> : <div className="hidden md:flex items-center gap-3">{buttons}</div>;
}

const NAV_LINKS = [
  { label: "Case Studies", href: "/#case-studies" },
  { label: "Services", href: "/#services" },
  { label: "About", href: "/#about" },
  { label: "Book", href: "/book" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-background/20" : "bg-transparent"
    )}>
      <div className="container flex items-center justify-between h-16">
        {/* Left: Logo + Status */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_var(--primary-glow)] transition-transform group-hover:scale-110">
            <Terminal className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground tracking-tight">
            Castles<span className="text-primary">of</span>Light
          </span>
        </Link>

        {/* Center: Nav links (Desktop) */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {NAV_LINKS.map((link) => (
              <NavigationMenuItem key={link.label}>
                {link.href.startsWith("/#") ? (
                  <a href={link.href} className={navigationMenuTriggerStyle()}>
                    {link.label}
                  </a>
                ) : (
                  <Link href={link.href}>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      {link.label}
                    </NavigationMenuLink>
                  </Link>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right: Auth buttons + Status badge */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
            <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)] animate-pulse" />
            <span className="text-[10px] font-mono text-accent font-medium tracking-widest uppercase">SYS.ONLINE</span>
          </div>
          <NavAuthButtons />
          
          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground -mr-2">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background/98 backdrop-blur-xl border-l border-border w-[300px] sm:w-[350px]">
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_10px_var(--primary-glow)]">
                    <Terminal className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display font-bold text-lg tracking-tight leading-none">Nerve Center</span>
                    <span className="text-[9px] font-mono text-muted-foreground/40 mt-1 tracking-widest uppercase">CASTLES OF LIGHT</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <div key={link.label}>
                    {link.href.startsWith("/#") ? (
                      <a 
                        href={link.href}
                        className="block py-3 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href}>
                        <div className="block py-3 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors cursor-pointer">
                          {link.label}
                        </div>
                      </Link>
                    )}
                  </div>
                ))}
                <NavAuthButtons mobile />
              </div>
              <div className="absolute bottom-8 left-6 right-6">
                 <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)] animate-pulse" />
                      <span className="text-[10px] font-mono text-accent font-medium tracking-widest">SYS.ONLINE</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-widest">Q2 2026</span>
                 </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
