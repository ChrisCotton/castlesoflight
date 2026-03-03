import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DollarSign,
  Video,
} from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

// ─── Step 1: Select Call Type ─────────────────────────────────────────────────
function StepCallType({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (id: number) => void;
}) {
  const { data: callTypes, isLoading } = trpc.booking.getCallTypes.useQuery();

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">Select a Call Type</h2>
      <p className="text-muted-foreground mb-8">Choose the type of engagement that best fits your needs.</p>
      <div className="grid gap-4">
        {callTypes?.map((ct) => (
          <button
            key={ct.id}
            onClick={() => onSelect(ct.id)}
            className={`w-full text-left rounded-xl border p-6 transition-all ${
              selected === ct.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50 hover:bg-secondary/50"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ct.color ?? "#6366f1" }}
                  />
                  <span className="font-display font-semibold text-foreground">{ct.name}</span>
                  {Number(ct.price) === 0 && (
                    <Badge variant="outline" className="border-[oklch(0.65_0.18_160_/_0.5)] text-[oklch(0.65_0.18_160)] bg-[oklch(0.65_0.18_160_/_0.1)] text-xs">
                      Free
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{ct.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  {ct.durationMinutes} min
                </div>
                {Number(ct.price) > 0 && (
                  <div className="flex items-center gap-1 text-primary text-sm font-semibold">
                    <DollarSign className="w-3.5 h-3.5" />
                    {Number(ct.price).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Pick Date & Time ─────────────────────────────────────────────────
function StepDateTime({
  callTypeId,
  selectedDate,
  selectedTime,
  onSelect,
}: {
  callTypeId: number;
  selectedDate: string | null;
  selectedTime: string | null;
  onSelect: (date: string, time: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [pickedDate, setPickedDate] = useState<string | null>(selectedDate);

  const queryDate = pickedDate ?? "";
  const { data: slotData, isLoading: slotsLoading } = trpc.booking.getAvailableSlots.useQuery(
    { date: queryDate, callTypeId },
    { enabled: !!pickedDate }
  );

  const calDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [viewYear, viewMonth]);

  const isDateSelectable = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d >= todayStart;
  };

  const toDateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">Pick a Date & Time</h2>
      <p className="text-muted-foreground mb-8">All times shown in Pacific Time (PT).</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-display font-semibold text-foreground">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const dateStr = toDateStr(day);
              const selectable = isDateSelectable(day);
              const isSelected = pickedDate === dateStr;
              return (
                <button
                  key={day}
                  disabled={!selectable}
                  onClick={() => setPickedDate(dateStr)}
                  className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : selectable
                      ? "hover:bg-secondary text-foreground"
                      : "text-muted-foreground/30 cursor-not-allowed"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div>
          {!pickedDate ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <Calendar className="w-5 h-5 mr-2" />
              Select a date to see available times
            </div>
          ) : slotsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : slotData?.isBlocked ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="font-medium text-foreground mb-1">Not available</p>
              <p className="text-sm">This date is blocked. Please select another day.</p>
            </div>
          ) : !slotData?.slots.length ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="font-medium text-foreground mb-1">No slots available</p>
              <p className="text-sm">No availability on this day. Please try another.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-4 font-medium">
                {formatDate(pickedDate)}
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {slotData.slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => onSelect(pickedDate, slot)}
                    className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                      selectedTime === slot && selectedDate === pickedDate
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border bg-secondary text-secondary-foreground hover:border-primary/50"
                    }`}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Contact Info ─────────────────────────────────────────────────────
function StepContactInfo({
  form,
  onChange,
}: {
  form: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">Your Details</h2>
      <p className="text-muted-foreground mb-8">Just a few details so I can prepare for our call.</p>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-1 block">First Name *</Label>
            <Input value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)}
              className="bg-input border-border text-foreground" placeholder="Christopher" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-1 block">Last Name *</Label>
            <Input value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)}
              className="bg-input border-border text-foreground" placeholder="Cotton" />
          </div>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Email *</Label>
          <Input type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)}
            className="bg-input border-border text-foreground" placeholder="you@company.com" />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Phone</Label>
          <Input value={form.phone} onChange={(e) => onChange("phone", e.target.value)}
            className="bg-input border-border text-foreground" placeholder="+1 (415) 555-0100" />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Company</Label>
          <Input value={form.company} onChange={(e) => onChange("company", e.target.value)}
            className="bg-input border-border text-foreground" placeholder="Acme Corp" />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">What's your biggest infrastructure challenge?</Label>
          <Textarea value={form.message} onChange={(e) => onChange("message", e.target.value)}
            className="bg-input border-border text-foreground min-h-[100px]"
            placeholder="Describe your current pain points, goals, or what you'd like to accomplish..." />
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Confirmation ─────────────────────────────────────────────────────
function StepConfirmed({ callTypeName }: { callTypeName: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-3xl font-display font-bold text-foreground mb-3">You're Booked!</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        Your <strong className="text-foreground">{callTypeName}</strong> has been requested. I'll confirm the booking within a few hours and send you a calendar invite with the meeting link.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
        <Video className="w-4 h-4" />
        Meeting will be via Google Meet or Zoom — your preference.
      </div>
      <Link href="/">
        <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}

// ─── Main Book Page ───────────────────────────────────────────────────────────
export default function Book() {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : "");
  const preselectedType = params.get("type");

  const [step, setStep] = useState(1);
  const [callTypeId, setCallTypeId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedCallTypeName, setConfirmedCallTypeName] = useState("");
  const [contactForm, setContactForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", company: "", message: "",
  });

  const { data: callTypes } = trpc.booking.getCallTypes.useQuery();

  // Pre-select call type from URL param
  useMemo(() => {
    if (preselectedType && callTypes) {
      const ct = callTypes.find((c) => c.slug === preselectedType);
      if (ct) { setCallTypeId(ct.id); setStep(2); }
    }
  }, [preselectedType, callTypes]);

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: () => {
      const ct = callTypes?.find((c) => c.id === callTypeId);
      setConfirmedCallTypeName(ct?.name ?? "Call");
      setConfirmed(true);
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const handleSubmit = () => {
    if (!callTypeId || !selectedDate || !selectedTime) return;
    if (!contactForm.firstName || !contactForm.lastName || !contactForm.email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    createBooking.mutate({
      callTypeId,
      scheduledDate: selectedDate,
      scheduledTime: selectedTime,
      ...contactForm,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const selectedCallType = callTypes?.find((c) => c.id === callTypeId);
  const stepLabels = ["Call Type", "Date & Time", "Your Details", "Confirm"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2 ml-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">Book a Call</span>
          </div>
        </div>
      </nav>

      <div className="container py-12 max-w-3xl">
        {confirmed ? (
          <StepConfirmed callTypeName={confirmedCallTypeName} />
        ) : (
          <>
            {/* Progress */}
            <div className="flex items-center gap-2 mb-10">
              {stepLabels.map((label, i) => {
                const n = i + 1;
                const active = step === n;
                const done = step > n;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done ? "bg-primary text-primary-foreground" : active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"
                    }`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : n}
                    </div>
                    <span className={`text-sm hidden sm:block ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
                    {i < stepLabels.length - 1 && <div className={`h-px w-8 md:w-16 ${done ? "bg-primary" : "bg-border"}`} />}
                  </div>
                );
              })}
            </div>

            {/* Booking summary bar */}
            {(selectedCallType || selectedDate) && (
              <div className="rounded-xl border border-border bg-card p-4 mb-8 flex flex-wrap gap-4 text-sm">
                {selectedCallType && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedCallType.color ?? "#6366f1" }} />
                    <span className="text-foreground font-medium">{selectedCallType.name}</span>
                    <span>·</span>
                    <Clock className="w-3.5 h-3.5" />
                    {selectedCallType.durationMinutes} min
                  </div>
                )}
                {selectedDate && selectedTime && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(selectedDate)} at {formatTime(selectedTime)} PT
                  </div>
                )}
              </div>
            )}

            {/* Step content */}
            <div className="rounded-2xl border border-border bg-card p-8 md:p-10">
              {step === 1 && (
                <StepCallType selected={callTypeId} onSelect={(id) => { setCallTypeId(id); setStep(2); }} />
              )}
              {step === 2 && callTypeId && (
                <StepDateTime
                  callTypeId={callTypeId}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onSelect={(date, time) => { setSelectedDate(date); setSelectedTime(time); }}
                />
              )}
              {step === 3 && (
                <StepContactInfo form={contactForm} onChange={(k, v) => setContactForm((f) => ({ ...f, [k]: v }))} />
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>

                {step < 3 ? (
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={
                      (step === 1 && !callTypeId) ||
                      (step === 2 && (!selectedDate || !selectedTime))
                    }
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                    onClick={handleSubmit}
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Booking...</>
                    ) : (
                      <>Confirm Booking <CheckCircle2 className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
