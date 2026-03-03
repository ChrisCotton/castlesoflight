import { useState } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Calendar,
  Clock,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  Phone,
  MessageSquare,
  CreditCard,
  DollarSign,
  AlertCircle,
  Gift,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
type PaymentStatus = "free" | "pending" | "paid" | "failed" | "refunded";

const PAYMENT_STYLES: Record<PaymentStatus, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  free: { icon: <Gift className="w-3 h-3" />, color: "text-[oklch(0.65_0.18_160)]", bg: "bg-[oklch(0.65_0.18_160_/_0.1)]", border: "border-[oklch(0.65_0.18_160_/_0.3)]", label: "Free" },
  pending: { icon: <CreditCard className="w-3 h-3" />, color: "text-[oklch(0.82_0.20_58)]", bg: "bg-[oklch(0.82_0.20_58_/_0.1)]", border: "border-[oklch(0.82_0.20_58_/_0.3)]", label: "Payment Pending" },
  paid: { icon: <DollarSign className="w-3 h-3" />, color: "text-[oklch(0.65_0.18_160)]", bg: "bg-[oklch(0.65_0.18_160_/_0.1)]", border: "border-[oklch(0.65_0.18_160_/_0.3)]", label: "Paid" },
  failed: { icon: <AlertCircle className="w-3 h-3" />, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: "Payment Failed" },
  refunded: { icon: <CreditCard className="w-3 h-3" />, color: "text-[oklch(0.62_0.22_280)]", bg: "bg-[oklch(0.62_0.22_280_/_0.1)]", border: "border-[oklch(0.62_0.22_280_/_0.3)]", label: "Refunded" },
};

function PaymentChip({ status, priceCents }: { status: PaymentStatus; priceCents?: number }) {
  const s = PAYMENT_STYLES[status];
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${s.bg} ${s.color} border ${s.border}`}>
      {s.icon} {s.label}{status === "paid" && priceCents ? ` · $${(priceCents / 100).toLocaleString()}` : ""}
    </span>
  );
}

const STATUS_STYLES: Record<BookingStatus, { color: string; bg: string; border: string; label: string }> = {
  pending: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", label: "Pending" },
  confirmed: { color: "text-[oklch(0.65_0.18_160)]", bg: "bg-[oklch(0.65_0.18_160_/_0.1)]", border: "border-[oklch(0.65_0.18_160_/_0.3)]", label: "Confirmed" },
  cancelled: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: "Cancelled" },
  completed: { color: "text-[oklch(0.62_0.22_280)]", bg: "bg-[oklch(0.62_0.22_280_/_0.1)]", border: "border-[oklch(0.62_0.22_280_/_0.3)]", label: "Completed" },
};

function StatusChip({ status }: { status: BookingStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.color} border ${s.border}`}>
      {s.label}
    </span>
  );
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function BookingCard({ booking, callTypes, onUpdate }: {
  booking: any;
  callTypes: any[];
  onUpdate: () => void;
}) {
  const [adminNotes, setAdminNotes] = useState(booking.adminNotes ?? "");
  const ct = callTypes.find((c) => c.id === booking.callTypeId);

  const update = trpc.booking.updateStatus.useMutation({
    onSuccess: () => { toast.success("Booking updated."); onUpdate(); },
    onError: () => toast.error("Failed to update booking."),
  });

  const status = booking.status as BookingStatus;

  return (
    <div className={`rounded-xl border ${STATUS_STYLES[status].border} bg-card p-5`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <StatusChip status={status} />
            <PaymentChip status={(booking.paymentStatus ?? "free") as PaymentStatus} priceCents={booking.priceCents} />
            {ct && (
              <span className="text-xs text-[oklch(0.45_0.015_220)] font-mono flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ct.color ?? "#6366f1" }} />
                {ct.name} · {ct.durationMinutes} min
              </span>
            )}
          </div>

          <h3 className="font-display font-semibold text-foreground mb-1">
            {booking.firstName} {booking.lastName}
          </h3>

          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <a href={`mailto:${booking.email}`} className="hover:text-primary transition-colors">{booking.email}</a>
            </div>
            {booking.company && (
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                {booking.company}
              </div>
            )}
            {booking.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                {booking.phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
              {new Date(booking.scheduledDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
              {formatTime(booking.scheduledTime)} PT
            </div>
          </div>

          {booking.message && (
            <div className="mt-3 p-3 rounded-lg bg-secondary border border-border text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 mb-1 text-xs font-medium text-foreground">
                <MessageSquare className="w-3 h-3" /> Message
              </div>
              {booking.message}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {status === "pending" && (
            <>
              <Button
                size="sm"
                className="bg-[oklch(0.65_0.18_160)] text-white hover:bg-[oklch(0.65_0.18_160_/_0.8)] font-semibold text-xs"
                onClick={() => update.mutate({ id: booking.id, status: "confirmed", adminNotes })}
                disabled={update.isPending}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 text-xs"
                onClick={() => update.mutate({ id: booking.id, status: "cancelled" })}
                disabled={update.isPending}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
            </>
          )}
          {status === "confirmed" && (
            <Button
              size="sm"
              className="bg-[oklch(0.62_0.22_280)] text-white hover:bg-[oklch(0.62_0.22_280_/_0.8)] font-semibold text-xs"
              onClick={() => update.mutate({ id: booking.id, status: "completed" })}
              disabled={update.isPending}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Completed
            </Button>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground text-xs">
                <MessageSquare className="w-3.5 h-3.5 mr-1" /> Notes
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle className="font-display">Admin Notes</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[120px]"
                  placeholder="Internal notes about this booking..."
                />
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() => update.mutate({ id: booking.id, status: booking.status, adminNotes })}
                  disabled={update.isPending}
                >
                  Save Notes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

export default function Bookings() {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const utils = trpc.useUtils();

  const { data: bookings, isLoading } = trpc.booking.list.useQuery({ status: statusFilter === "all" ? undefined : statusFilter });
  const { data: callTypes } = trpc.booking.getCallTypes.useQuery();

  const counts = {
    all: bookings?.length ?? 0,
    pending: bookings?.filter((b) => b.status === "pending").length ?? 0,
    confirmed: bookings?.filter((b) => b.status === "confirmed").length ?? 0,
    completed: bookings?.filter((b) => b.status === "completed").length ?? 0,
    cancelled: bookings?.filter((b) => b.status === "cancelled").length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage all incoming consultation requests.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground border border-border hover:border-primary/50"
            }`}
          >
            {s} {s === "all" ? `(${counts.all})` : `(${counts[s as keyof typeof counts]})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : bookings?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground mb-1">No bookings yet</p>
          <p className="text-sm">Bookings will appear here when clients schedule calls.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings?.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              callTypes={callTypes ?? []}
              onUpdate={() => utils.booking.list.invalidate()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
