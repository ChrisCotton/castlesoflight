import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Save, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type AvailSlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export default function Availability() {
  const utils = trpc.useUtils();
  const { data: avail, isLoading } = trpc.booking.getAvailability.useQuery();
  const { data: blocked, isLoading: blockedLoading } = trpc.booking.getBlockedDates.useQuery();

  const [slots, setSlots] = useState<AvailSlot[]>([]);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");

  useEffect(() => {
    if (avail) {
      // Ensure all 7 days are represented
      const map: Record<number, AvailSlot> = {};
      avail.forEach((a) => {
        map[a.dayOfWeek] = { dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime, isActive: a.isActive };
      });
      const full: AvailSlot[] = [];
      for (let d = 0; d < 7; d++) {
        full.push(map[d] ?? { dayOfWeek: d, startTime: "09:00", endTime: "17:00", isActive: false });
      }
      setSlots(full);
    }
  }, [avail]);

  const saveAvail = trpc.booking.setAvailability.useMutation({
    onSuccess: () => { toast.success("Availability saved."); utils.booking.getAvailability.invalidate(); },
    onError: () => toast.error("Failed to save availability."),
  });

  const addBlocked = trpc.booking.addBlockedDate.useMutation({
    onSuccess: () => { toast.success("Date blocked."); setNewBlockDate(""); setNewBlockReason(""); utils.booking.getBlockedDates.invalidate(); },
    onError: () => toast.error("Failed to block date."),
  });

  const removeBlocked = trpc.booking.removeBlockedDate.useMutation({
    onSuccess: () => { toast.success("Date unblocked."); utils.booking.getBlockedDates.invalidate(); },
    onError: () => toast.error("Failed to remove blocked date."),
  });

  const updateSlot = (day: number, field: keyof AvailSlot, value: string | boolean) => {
    setSlots((prev) => prev.map((s) => s.dayOfWeek === day ? { ...s, [field]: value } : s));
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-[10px] font-bold text-primary tracking-[0.3em] mb-1 uppercase opacity-60">// TEMPORAL CONFIGURATION</p>
          <h1 className="text-4xl font-bold text-foreground font-display tracking-tight">Availability</h1>
        </div>
      </div>

      {/* Weekly schedule */}
      <Card className="p-6 border-border/40 bg-card/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <Clock className="w-4 h-4 text-primary" />
             <h2 className="font-mono text-xs font-bold text-foreground/80 tracking-widest uppercase">Weekly Schedule</h2>
          </div>
          <p className="font-mono text-[10px] text-foreground/40 font-bold uppercase tracking-widest bg-secondary/30 px-3 py-1 rounded-full border border-border/40">Pacific Time (PT) Zone</p>
        </div>

        <div className="space-y-3">
          {slots.map((slot) => (
            <div key={slot.dayOfWeek} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
              slot.isActive 
                ? "border-primary/30 bg-primary/5 shadow-[0_0_15px_var(--primary-glow)]" 
                : "border-border/30 bg-secondary/10 opacity-50 grayscale"
            }`}>
              <div className="flex items-center gap-3 w-36 shrink-0">
                <button
                  onClick={() => updateSlot(slot.dayOfWeek, "isActive", !slot.isActive)}
                  className={`w-10 h-6 rounded-full transition-all relative ${slot.isActive ? "bg-primary shadow-[0_0_8px_var(--primary-glow)]" : "bg-secondary border border-border/40"}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-1.25 transition-all shadow-sm ${slot.isActive ? "left-5.5" : "left-1"}`} />
                </button>
                <span className={`text-[11px] font-mono font-bold tracking-widest uppercase transition-colors ${slot.isActive ? "text-primary" : "text-foreground/30"}`}>
                  {DAY_NAMES[slot.dayOfWeek]}
                </span>
              </div>

              {slot.isActive ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(slot.dayOfWeek, "startTime", e.target.value)}
                      className="bg-secondary/40 border-border/40 text-primary font-mono font-bold h-8 w-28 text-xs text-center"
                    />
                  </div>
                  <span className="text-foreground/40 font-mono text-[10px] font-bold uppercase tracking-widest px-2">to</span>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(slot.dayOfWeek, "endTime", e.target.value)}
                    className="bg-secondary/40 border-border/40 text-primary font-mono font-bold h-8 w-28 text-xs text-center"
                  />
                </div>
              ) : (
                <span className="text-[10px] font-mono font-bold text-foreground/20 uppercase tracking-[0.2em] italic">Deactivated</span>
              )}
            </div>
          ))}
        </div>

        <Button
          className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-[0.2em] text-[10px] px-8 h-12 shadow-[0_0_20px_var(--primary-glow)] transition-all"
          onClick={() => saveAvail.mutate(slots)}
          disabled={saveAvail.isPending}
        >
          {saveAvail.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Commit Availability Matrix
        </Button>
      </Card>

      <Card className="p-6 border-border/40 bg-card/40">
        <div className="flex items-center gap-3 mb-6">
           <Plus className="w-4 h-4 text-primary" />
           <h2 className="font-mono text-xs font-bold text-foreground/80 tracking-widest uppercase">Blocked Date Exceptions</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-secondary/20 p-4 rounded-xl border border-border/30">
          <Input
            type="date"
            value={newBlockDate}
            onChange={(e) => setNewBlockDate(e.target.value)}
            className="bg-background/40 border-border/40 text-foreground font-mono text-xs h-10 flex-1"
          />
          <Input
            placeholder="Exception Reason (Internal Note)"
            value={newBlockReason}
            onChange={(e) => setNewBlockReason(e.target.value)}
            className="bg-background/40 border-border/40 text-foreground font-mono text-xs h-10 flex-2"
          />
          <Button
            className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-mono font-bold text-[10px] uppercase tracking-widest px-6 h-10 transition-all shrink-0"
            onClick={() => {
              if (!newBlockDate) { toast.error("Please select a date."); return; }
              addBlocked.mutate({ date: newBlockDate, reason: newBlockReason || undefined });
            }}
            disabled={addBlocked.isPending}
          >
            <Plus className="w-3 h-3 mr-1.5" /> Inject Block
          </Button>
        </div>

        {blockedLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : blocked?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No dates blocked.</p>
        ) : (
          <div className="space-y-2">
            {blocked?.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-secondary/10 group hover:bg-secondary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_var(--destructive)]" />
                  <div>
                    <span className="text-xs font-mono font-bold text-foreground/80 tracking-widest uppercase">
                      {new Date(b.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                    </span>
                    {b.reason && <span className="text-[10px] font-mono text-primary ml-4 opacity-70">// {b.reason.toUpperCase()}</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-foreground/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  onClick={() => removeBlocked.mutate({ id: b.id })}
                  disabled={removeBlocked.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
