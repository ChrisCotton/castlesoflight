import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Save, Clock } from "lucide-react";

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
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Availability</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your weekly schedule and block specific dates.</p>
      </div>

      {/* Weekly schedule */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-semibold text-foreground">Weekly Schedule</h2>
          <p className="text-xs text-muted-foreground">All times in Pacific Time (PT)</p>
        </div>

        <div className="space-y-3">
          {slots.map((slot) => (
            <div key={slot.dayOfWeek} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              slot.isActive ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/30"
            }`}>
              <div className="flex items-center gap-3 w-36 shrink-0">
                <button
                  onClick={() => updateSlot(slot.dayOfWeek, "isActive", !slot.isActive)}
                  className={`w-10 h-6 rounded-full transition-all relative ${slot.isActive ? "bg-primary" : "bg-secondary border border-border"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${slot.isActive ? "left-5" : "left-1"}`} />
                </button>
                <span className={`text-sm font-medium ${slot.isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {DAY_NAMES[slot.dayOfWeek]}
                </span>
              </div>

              {slot.isActive ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(slot.dayOfWeek, "startTime", e.target.value)}
                      className="bg-input border-border text-foreground h-8 w-28 text-sm"
                    />
                  </div>
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(slot.dayOfWeek, "endTime", e.target.value)}
                    className="bg-input border-border text-foreground h-8 w-28 text-sm"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Unavailable</span>
              )}
            </div>
          ))}
        </div>

        <Button
          className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          onClick={() => saveAvail.mutate(slots)}
          disabled={saveAvail.isPending}
        >
          {saveAvail.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Schedule
        </Button>
      </div>

      {/* Blocked dates */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display font-semibold text-foreground mb-6">Blocked Dates</h2>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            type="date"
            value={newBlockDate}
            onChange={(e) => setNewBlockDate(e.target.value)}
            className="bg-input border-border text-foreground h-9 flex-1"
          />
          <Input
            placeholder="Reason (optional)"
            value={newBlockReason}
            onChange={(e) => setNewBlockReason(e.target.value)}
            className="bg-input border-border text-foreground h-9 flex-1"
          />
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shrink-0"
            onClick={() => {
              if (!newBlockDate) { toast.error("Please select a date."); return; }
              addBlocked.mutate({ date: newBlockDate, reason: newBlockReason || undefined });
            }}
            disabled={addBlocked.isPending}
          >
            <Plus className="w-4 h-4 mr-1" /> Block Date
          </Button>
        </div>

        {blockedLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : blocked?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No dates blocked.</p>
        ) : (
          <div className="space-y-2">
            {blocked?.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(b.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                  </span>
                  {b.reason && <span className="text-xs text-muted-foreground ml-3">— {b.reason}</span>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeBlocked.mutate({ id: b.id })}
                  disabled={removeBlocked.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
