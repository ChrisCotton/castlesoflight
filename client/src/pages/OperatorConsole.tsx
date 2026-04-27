import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { trpc } from "@/lib/trpc";
import AsciiBackground from "@/components/AsciiBackground";

export default function OperatorConsole() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const loginMutation = trpc.auth.loginWithPassword.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginMutation.mutateAsync({
        email,
        password,
      });

      if (result.success) {
        // Redirect to admin dashboard
        setLocation("/admin");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.04_0.005_260)] flex items-center justify-center p-4 relative overflow-hidden">
      <AsciiBackground />
      <div className="w-full max-w-md relative z-10">
        {/* Status Bar */}
        <div className="fixed top-0 left-0 right-0 z-[60] border-b border-[oklch(0.78_0.18_195_/_0.15)] bg-[oklch(0.04_0.005_260_/_0.9)] backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 h-8">
            <div className="flex items-center gap-4">
              <span className="sys-online">SYS.ONLINE</span>
              <span className="hud-label opacity-50">OPERATOR CONSOLE</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="mt-16 border border-[oklch(0.78_0.18_195_/_0.2)] rounded-lg bg-[oklch(0.08_0.01_260)] p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[oklch(0.82_0.20_58)] flex items-center justify-center">
              <Terminal className="w-4 h-4 text-[oklch(0.06_0.01_260)]" />
            </div>
            <h1 className="font-display font-bold text-lg text-foreground">
              Castles<span className="text-[oklch(0.82_0.20_58)]">of</span>Light
            </h1>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">OPERATOR LOGIN</h2>
          <p className="hud-label opacity-60 mb-6">Access the command center</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block hud-label opacity-70 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@castlesoflight.com"
                className="w-full px-3 py-2 bg-[oklch(0.04_0.005_260)] border border-[oklch(0.78_0.18_195_/_0.3)] rounded text-foreground placeholder-opacity-50 focus:outline-none focus:border-[oklch(0.78_0.18_195)]"
                required
              />
            </div>

            <div>
              <label className="block hud-label opacity-70 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-[oklch(0.04_0.005_260)] border border-[oklch(0.78_0.18_195_/_0.3)] rounded text-foreground placeholder-opacity-50 focus:outline-none focus:border-[oklch(0.78_0.18_195)]"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || loginMutation.isPending}
              className="w-full bg-[oklch(0.78_0.18_195)] text-[oklch(0.06_0.01_260)] hover:bg-[oklch(0.82_0.18_195)] font-semibold"
            >
              {loading || loginMutation.isPending ? "Authenticating..." : "INITIALIZE ACCESS"}
            </Button>
          </form>

          <p className="text-xs hud-label opacity-40 mt-6 text-center">
            This console is restricted to authorized operators only.
          </p>
        </div>
      </div>
    </div>
  );
}
