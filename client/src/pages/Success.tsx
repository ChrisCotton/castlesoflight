import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, Home, Terminal, ShieldCheck } from "lucide-react";
import AsciiBackground from "@/components/AsciiBackground";

export default function Success() {
  return (
    <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* ASCII background for that premium terminal feel */}
      <AsciiBackground />
      
      <div className="container relative z-10">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8 relative inline-block">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto animate-pulse">
              <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 px-2 py-1 bg-primary text-primary-foreground text-[10px] font-mono font-bold rounded shadow-lg">
              PAYMENT_VERIFIED
            </div>
          </div>
          
          <h1 className="font-display font-bold text-4xl text-foreground mb-4 tracking-tight">
            MISSION_AUTHORIZED // <span className="text-primary">ENGAGEMENT START</span>
          </h1>
          
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            Payment confirmed. Your infrastructure acceleration is now priority zero. Check your inbox for the initial diagnostic brief and secure portal access.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 glow-sm-amber">
                <Home className="w-4 h-4 mr-2" />
                Return to Surface
              </Button>
            </Link>
          </div>
          
          <div className="mt-16 flex items-center justify-center gap-3">
             <div className="w-8 h-px bg-border/50" />
             <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/40 tracking-widest">
                <Terminal className="w-3 h-3" />
                NERVE_CENTER // PROTOCOL_INITIATED
             </div>
             <div className="w-8 h-px bg-border/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
