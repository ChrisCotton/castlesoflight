import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  CheckCircle2,
  Terminal,
  Loader2,
  DollarSign,
  Video,
  CreditCard,
  Lock,
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

function formatPrice(price: string | null | undefined) {
  const n = Number(price ?? 0);
  if (n === 0) return "Free";
  return `$${n.toLocaleString()}`;
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
      <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.82_0.20_58)]" />
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">Select a Call Type</h2>
      <p className="text-[oklch(0.50_0.015_220)] mb-8">Choose the engagement that best fits your needs.</p>
      <div className="grid gap-4">
        {callTypes?.map((ct) => {
          const isPaid = Number(ct.price) > 0;
          return (
            <button
              key={ct.id}
              onClick={() => onSelect(ct.id)}
              className={`w-full text-left rounded-xl border p-6 transition-all ${
                selected === ct.id
                  ? "border-[oklch(0.82_0.20_58_/_0.6)] bg-[oklch(0.82_0.20_58_/_0.08)]"
                  : "border-[oklch(0.78_0.18_195_/_0.15)] bg-[oklch(0.06_0.01_260)] hover:border-[oklch(0.82_0.20_58_/_0.3)] hover:bg-[oklch(0.82_0.20_58_/_0.04)]"
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
                    {!isPaid && (
                      <Badge className="bg-[oklch(0.65_0.18_160_/_0.15)] text-[oklch(0.65_0.18_160)] border-[oklch(0.65_0.18_160_/_0.3)] text-xs">
                        Free
                      </Badge>
                    )}
                    {isPaid && (
                      <Badge className="bg-[oklch(0.82_0.20_58_/_0.12)] text-[oklch(0.82_0.20_58)] border-[oklch(0.82_0.20_58_/_0.3)] text-xs">
                        <CreditCard className="w-3 h-3 mr-1" /> Paid
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[oklch(0.50_0.015_220)] leading-relaxed">{ct.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-[oklch(0.45_0.015_220)] text-sm mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    {ct.durationMinutes} min
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${isPaid ? "text-[oklch(0.82_0.20_58)]" : "text-[oklch(0.65_0.18_160)]"}`}>
                    {isPaid ? <DollarSign className="w-3.5 h-3.5" /> : null}
                    {formatPrice(ct.price)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
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
      <p className="text-[oklch(0.50_0.015_220)] mb-8">All times shown in Pacific Time (PT).</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[oklch(0.78_0.18_195_/_0.08)] text-[oklch(0.45_0.015_220)] hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-display font-semibold text-foreground">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[oklch(0.78_0.18_195_/_0.08)] text-[oklch(0.45_0.015_220)] hover:text-foreground transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs text-[oklch(0.45_0.015_220)] font-medium py-1">{d}</div>
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
                      ? "bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] font-bold"
                      : selectable
                      ? "hover:bg-[oklch(0.78_0.18_195_/_0.08)] text-foreground"
                      : "text-[oklch(0.30_0.01_220)] cursor-not-allowed"
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
            <div className="flex items-center justify-center h-full text-[oklch(0.45_0.015_220)] text-sm">
              <Calendar className="w-5 h-5 mr-2" />
              Select a date to see available times
            </div>
          ) : slotsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.82_0.20_58)]" />
            </div>
          ) : slotData?.isBlocked ? (
            <div className="text-center text-[oklch(0.45_0.015_220)] py-8">
              <p className="font-medium text-foreground mb-1">Not available</p>
              <p className="text-sm">This date is blocked. Please select another day.</p>
            </div>
          ) : !slotData?.slots.length ? (
            <div className="text-center text-[oklch(0.45_0.015_220)] py-8">
              <p className="font-medium text-foreground mb-1">No slots available</p>
              <p className="text-sm">No availability on this day. Please try another.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[oklch(0.45_0.015_220)] mb-4 font-medium">
                {formatDate(pickedDate)}
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {slotData.slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => onSelect(pickedDate, slot)}
                    className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                      selectedTime === slot && selectedDate === pickedDate
                        ? "border-[oklch(0.82_0.20_58_/_0.6)] bg-[oklch(0.82_0.20_58_/_0.12)] text-[oklch(0.82_0.20_58)]"
                        : "border-[oklch(0.78_0.18_195_/_0.15)] bg-[oklch(0.06_0.01_260)] text-foreground hover:border-[oklch(0.82_0.20_58_/_0.3)]"
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
      <p className="text-[oklch(0.50_0.015_220)] mb-8">Just a few details so I can prepare for our call.</p>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-foreground mb-1.5 block text-sm font-medium">First Name *</Label>
            <Input
              value={form.firstName}
              onChange={(e) => onChange("firstName", e.target.value)}
              className="bg-[oklch(0.06_0.01_260)] border-[oklch(0.78_0.18_195_/_0.2)] text-foreground"
              placeholder="Christopher"
            />
          </div>
          <div>
            <Label className="text-foreground mb-1.5 block text-sm font-medium">Last Name *</Label>
            <Input
              value={form.lastName}
              onChange={(e) => onChange("lastName", e.target.value)}
              className="bg-[oklch(0.06_0.01_260)] border-[oklch(0.78_0.18_195_/_0.2)] text-foreground"
              placeholder="Cotton"
            />
          </div>
        </div>
        <div>
          <Label className="text-foreground mb-1.5 block text-sm font-medium">Work Email *</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            className="bg-[oklch(0.06_0.01_260)] border-[oklch(0.78_0.18_195_/_0.2)] text-foreground"
            placeholder="you@company.com"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-foreground mb-1.5 block text-sm font-medium">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              className="bg-[oklch(0.06_0.01_260)] border-[oklch(0.78_0.18_195_/_0.2)] text-foreground"
              placeholder="+1 (415) 000-0000"
            />
          </div>
          <div>
            <Label className="text-foreground mb-1.5 block text-sm font-medium">Company</Label>
            <Input
              value={form.company}
              onChange={(e) => onChange("company", e.target.value)}
              className="bg-[oklch(0.06_0.01_260)] border-[oklch(0.78_0.18_195_/_0.2)] text-foreground"
              placeholder="Acme Corp"
            />
          </div>
        </div>
        <div>
          <Label className="text-foreground mb-1.5 block text-sm font-medium">What would you like to accomplish?</Label>
          <Textarea
            value={form.message}
            onChange={(e) => onChange("message", e.target.value)}
            className="bg-[oklch(0.06_0.01_260)] border-[oklch(0.78_0.18_195_/_0.2)] text-foreground min-h-[100px]"
            placeholder="Describe your current pain points, goals, or what you'd like to accomplish..."
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Review & Pay / Confirm ──────────────────────────────────────────
function StepReview({
  callType,
  selectedDate,
  selectedTime,
  form,
  onSubmit,
  isPending,
}: {
  callType: { name: string; durationMinutes: number; price: string | null; color: string | null } | undefined;
  selectedDate: string | null;
  selectedTime: string | null;
  form: Record<string, string>;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const isPaid = Number(callType?.price ?? 0) > 0;

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">Review & {isPaid ? "Pay" : "Confirm"}</h2>
      <p className="text-[oklch(0.50_0.015_220)] mb-8">
        {isPaid
          ? "Review your booking details, then proceed to secure payment."
          : "Review your booking details and confirm."}
      </p>

      <div className="space-y-4 mb-8">
        {/* Booking summary */}
        <div className="rounded-xl border border-[oklch(0.78_0.18_195_/_0.15)] bg-[oklch(0.06_0.01_260)] p-5">
          <div className="hud-label text-[10px] mb-3 opacity-50">BOOKING SUMMARY</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[oklch(0.50_0.015_220)] text-sm">Call Type</span>
              <span className="text-foreground font-medium text-sm">{callType?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[oklch(0.50_0.015_220)] text-sm">Duration</span>
              <span className="text-foreground font-medium text-sm">{callType?.durationMinutes} minutes</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[oklch(0.50_0.015_220)] text-sm">Date</span>
              <span className="text-foreground font-medium text-sm">{selectedDate ? formatDate(selectedDate) : "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[oklch(0.50_0.015_220)] text-sm">Time</span>
              <span className="text-foreground font-medium text-sm">{selectedTime ? formatTime(selectedTime) + " PT" : "—"}</span>
            </div>
            <div className="border-t border-[oklch(0.78_0.18_195_/_0.1)] pt-3 flex justify-between items-center">
              <span className="text-[oklch(0.50_0.015_220)] text-sm font-medium">Total</span>
              <span className={`font-bold text-lg ${isPaid ? "text-[oklch(0.82_0.20_58)]" : "text-[oklch(0.65_0.18_160)]"}`}>
                {formatPrice(callType?.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Contact summary */}
        <div className="rounded-xl border border-[oklch(0.78_0.18_195_/_0.15)] bg-[oklch(0.06_0.01_260)] p-5">
          <div className="hud-label text-[10px] mb-3 opacity-50">YOUR DETAILS</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[oklch(0.50_0.015_220)] text-sm">Name</span>
              <span className="text-foreground text-sm">{form.firstName} {form.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[oklch(0.50_0.015_220)] text-sm">Email</span>
              <span className="text-foreground text-sm">{form.email}</span>
            </div>
            {form.company && (
              <div className="flex justify-between">
                <span className="text-[oklch(0.50_0.015_220)] text-sm">Company</span>
                <span className="text-foreground text-sm">{form.company}</span>
              </div>
            )}
          </div>
        </div>

        {isPaid && (
          <div className="rounded-xl border border-[oklch(0.82_0.20_58_/_0.2)] bg-[oklch(0.82_0.20_58_/_0.04)] p-4 flex items-start gap-3">
            <Lock className="w-4 h-4 text-[oklch(0.82_0.20_58)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium mb-0.5">Secure Payment via Stripe</p>
              <p className="text-xs text-[oklch(0.50_0.015_220)]">
                You'll be redirected to Stripe's secure checkout. Your booking is held for 30 minutes while you complete payment. Use card <strong className="text-foreground">4242 4242 4242 4242</strong> for testing.
              </p>
            </div>
          </div>
        )}
      </div>

      <Button
        className="w-full bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] hover:bg-[oklch(0.88_0.18_60)] font-bold h-12 text-base"
        style={{ boxShadow: "0 0 24px oklch(0.82 0.20 58 / 0.3)" }}
        onClick={onSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {isPaid ? "Preparing checkout..." : "Confirming..."}</>
        ) : isPaid ? (
          <><CreditCard className="w-5 h-5 mr-2" /> Proceed to Secure Payment</>
        ) : (
          <><CheckCircle2 className="w-5 h-5 mr-2" /> Confirm Booking</>
        )}
      </Button>
    </div>
  );
}

// ─── Confirmed screen ─────────────────────────────────────────────────────────
function StepConfirmed({ callTypeName, wasPaid }: { callTypeName: string; wasPaid: boolean }) {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 rounded-full bg-[oklch(0.82_0.20_58_/_0.12)] border border-[oklch(0.82_0.20_58_/_0.3)] flex items-center justify-center mx-auto mb-6" style={{ boxShadow: "0 0 40px oklch(0.82 0.20 58 / 0.2)" }}>
        <CheckCircle2 className="w-10 h-10 text-[oklch(0.82_0.20_58)]" />
      </div>
      <div className="sys-online mx-auto w-fit mb-4">BOOKING CONFIRMED</div>
      <h2 className="text-3xl font-display font-bold text-foreground mb-3">You're Booked!</h2>
      <p className="text-[oklch(0.50_0.015_220)] max-w-md mx-auto mb-8">
        Your <strong className="text-foreground">{callTypeName}</strong> has been {wasPaid ? "paid and confirmed" : "requested"}. I'll send you a calendar invite with the meeting link within a few hours.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-[oklch(0.45_0.015_220)] mb-8">
        <Video className="w-4 h-4" />
        Meeting will be via Google Meet or Zoom — your preference.
      </div>
      <Link href="/">
        <Button variant="outline" className="border-[oklch(0.78_0.18_195_/_0.3)] text-[oklch(0.78_0.18_195)] hover:bg-[oklch(0.78_0.18_195_/_0.08)]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}

// ─── Main Book Page ───────────────────────────────────────────────────────────
export default function Book() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const preselectedType = params.get("type");

  const [step, setStep] = useState(1);
  const [callTypeId, setCallTypeId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedCallTypeName, setConfirmedCallTypeName] = useState("");
  const [wasPaid, setWasPaid] = useState(false);
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

  const createCheckoutSession = trpc.booking.createCheckoutSession.useMutation();

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: async (data) => {
      const ct = callTypes?.find((c) => c.id === callTypeId);
      const isPaid = Number(ct?.price ?? 0) > 0;
      setConfirmedCallTypeName(ct?.name ?? "Call");
      setWasPaid(isPaid);

      if (isPaid && data.token) {
        // Redirect to Stripe checkout
        toast.info("Redirecting to secure payment...");
        try {
          const result = await createCheckoutSession.mutateAsync({
            bookingId: data.bookingId!,
            origin: window.location.origin,
          });
          window.open(result.url, "_blank");
          // Show confirmed screen (payment pending)
          setConfirmed(true);
        } catch {
          toast.error("Failed to create payment session. Please try again.");
        }
      } else {
        setConfirmed(true);
      }
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
  const stepLabels = ["Call Type", "Date & Time", "Your Details", "Review"];
  const isPending = createBooking.isPending || createCheckoutSession.isPending;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <nav className="border-b border-[oklch(0.78_0.18_195_/_0.12)] bg-[oklch(0.04_0.005_260_/_0.9)] backdrop-blur-xl">
        <div className="container flex items-center h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 text-[oklch(0.45_0.015_220)] hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2 ml-2">
            <div className="w-7 h-7 rounded-lg bg-[oklch(0.82_0.20_58)] flex items-center justify-center" style={{ boxShadow: "0 0 12px oklch(0.82 0.20 58 / 0.4)" }}>
              <Terminal className="w-3.5 h-3.5 text-[oklch(0.06_0.01_260)]" />
            </div>
            <span className="font-display font-bold text-foreground">Book a Call</span>
          </div>
          <div className="ml-auto">
            <span className="sys-online text-[10px]">SYS.ONLINE</span>
          </div>
        </div>
      </nav>

      <div className="container py-12 max-w-3xl">
        {confirmed ? (
          <StepConfirmed callTypeName={confirmedCallTypeName} wasPaid={wasPaid} />
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
                      done
                        ? "bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)]"
                        : active
                        ? "bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)]"
                        : "bg-[oklch(0.08_0.01_260)] text-[oklch(0.45_0.015_220)] border border-[oklch(0.78_0.18_195_/_0.2)]"
                    }`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : n}
                    </div>
                    <span className={`text-sm hidden sm:block ${active ? "text-foreground font-medium" : "text-[oklch(0.45_0.015_220)]"}`}>{label}</span>
                    {i < stepLabels.length - 1 && <div className={`h-px w-8 md:w-12 ${done ? "bg-[oklch(0.82_0.20_58_/_0.5)]" : "bg-[oklch(0.78_0.18_195_/_0.15)]"}`} />}
                  </div>
                );
              })}
            </div>

            {/* Booking summary bar */}
            {(selectedCallType || selectedDate) && (
              <div className="rounded-xl border border-[oklch(0.78_0.18_195_/_0.12)] bg-[oklch(0.06_0.01_260)] p-4 mb-8 flex flex-wrap gap-4 text-sm">
                {selectedCallType && (
                  <div className="flex items-center gap-2 text-[oklch(0.45_0.015_220)]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedCallType.color ?? "#6366f1" }} />
                    <span className="text-foreground font-medium">{selectedCallType.name}</span>
                    <span>·</span>
                    <Clock className="w-3.5 h-3.5" />
                    {selectedCallType.durationMinutes} min
                    {Number(selectedCallType.price) > 0 && (
                      <><span>·</span><span className="text-[oklch(0.82_0.20_58)] font-semibold">{formatPrice(selectedCallType.price)}</span></>
                    )}
                  </div>
                )}
                {selectedDate && selectedTime && (
                  <div className="flex items-center gap-2 text-[oklch(0.45_0.015_220)]">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(selectedDate)} at {formatTime(selectedTime)} PT
                  </div>
                )}
              </div>
            )}

            {/* Step content */}
            <div className="hud-card rounded-2xl p-8 md:p-10">
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
              {step === 4 && (
                <StepReview
                  callType={selectedCallType}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  form={contactForm}
                  onSubmit={handleSubmit}
                  isPending={isPending}
                />
              )}

              {/* Navigation — hidden on step 4 (Review has its own CTA) */}
              {step < 4 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-[oklch(0.78_0.18_195_/_0.1)]">
                  <Button
                    variant="outline"
                    className="border-[oklch(0.78_0.18_195_/_0.2)] text-[oklch(0.45_0.015_220)] hover:bg-[oklch(0.78_0.18_195_/_0.06)] hover:text-foreground"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>

                  <Button
                    className="bg-[oklch(0.82_0.20_58)] text-[oklch(0.06_0.01_260)] hover:bg-[oklch(0.88_0.18_60)] font-semibold"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={
                      (step === 1 && !callTypeId) ||
                      (step === 2 && (!selectedDate || !selectedTime)) ||
                      (step === 3 && (!contactForm.firstName || !contactForm.lastName || !contactForm.email))
                    }
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
              {step === 4 && (
                <div className="mt-4">
                  <button
                    onClick={() => setStep(3)}
                    className="text-xs text-[oklch(0.45_0.015_220)] hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" /> Edit details
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
