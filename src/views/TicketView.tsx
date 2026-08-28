import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { money } from "@/lib/utils";
import { useHaptic, useCountdown } from "@/lib/hooks";
import { playSuccess } from "@/lib/sounds";
import * as I from "@/icons";

function TripRating({ onRate }: { onRate: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const [rated, setRated] = useState(0);
  const haptic = useHaptic();

  const handleRate = (n: number) => {
    setRated(n);
    haptic("success");
    playSuccess();
    onRate(n);
  };

  return (
    <div className="mt-6 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">Rate your trip</p>
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => !rated && setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(n)}
            className="haptic-tap transition-transform duration-200 hover:scale-125"
          >
            <svg
              className={`h-8 w-8 transition-colors duration-200 ${
                n <= (hovered || rated) ? "text-amber-400" : "text-gray-200 dark:text-gray-700"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      {rated > 0 && (
        <p className="mt-2 animate-fade-in text-sm font-medium text-amber-600 dark:text-amber-400">
          {rated === 5 ? "Excellent! ⭐" : rated === 4 ? "Great trip! 👍" : rated === 3 ? "Good ride" : rated === 2 ? "Could be better" : "Sorry to hear that"}
        </p>
      )}
    </div>
  );
}

function TicketCountdown({ departureTime }: { departureTime: string }) {
  /* Simple countdown — use today's date with the departure time */
  const target = new Date();
  const [h, m] = departureTime.match(/(\d+):(\d+)/)?.slice(1, 3) ?? ["18", "00"];
  const isPM = departureTime.toLowerCase().includes("pm");
  let hours24 = parseInt(h);
  if (isPM && hours24 !== 12) hours24 += 12;
  if (!isPM && hours24 === 12) hours24 = 0;
  target.setHours(hours24, parseInt(m), 0, 0);
  if (target.getTime() < Date.now()) target.setDate(target.getDate() + 1);

  const { hours, minutes, seconds, expired } = useCountdown(target.toISOString());
  if (expired) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-[#16a34a]/5 px-4 py-3">
      <I.Calendar className="h-4 w-4 text-[#16a34a]" />
      <span className="text-xs font-semibold text-[var(--scl-text-secondary)]">Departs in</span>
      <div className="flex gap-1">
        {[
          { v: hours, l: "H" },
          { v: minutes, l: "M" },
          { v: seconds, l: "S" },
        ].map(({ v, l }) => (
          <span key={l} className="rounded-lg bg-[#16a34a] px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
            {String(v).padStart(2, "0")}{l}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TicketView() {
  const navigate = useNavigate();
  const { booking, goHome, showToast } = useBooking();
  const haptic = useHaptic();
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  if (!booking) return null;

  const trip = booking.trip as Record<string, string> | undefined;
  const passenger = booking.passenger as Record<string, string> | undefined;
  const seats = booking.seats as number[] | undefined;

  const handleHome = useCallback(() => {
    haptic("tap");
    goHome();
    navigate("/");
  }, [haptic, goHome, navigate]);

  const handleShare = useCallback(async (method: string) => {
    haptic("tap");
    const text = `🚌 SaccoLink Boarding Pass\n🎫 Ref: ${booking.bookingRef}\n👤 ${passenger?.name}\n💺 Seat(s): ${seats?.join(", ")}\n💰 ${money(booking.amount as number)}\n\nBook at saccolink.co.ke`;

    if (method === "copy") {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard!", "success");
      } catch {
        showToast("Could not copy", "error");
      }
    } else if (method === "share" && navigator.share) {
      try {
        await navigator.share({ title: "SaccoLink Ticket", text });
      } catch { /* user cancelled */ }
    }
    setShareMenuOpen(false);
  }, [booking, passenger, seats, haptic, showToast]);

  const handleRate = useCallback((n: number) => {
    showToast(`Thanks for rating ${n}/5 stars!`, "success");
  }, [showToast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#f0fdf4] to-[var(--scl-surface-alt)] px-4 py-12 animate-fade-in dark:from-[#0a2e1a] dark:to-[var(--scl-surface-alt)]">
      <div className="w-full max-w-md">
        {/* Ticket card */}
        <div className="animate-scale-in overflow-hidden rounded-[2rem] border border-[var(--scl-border)] bg-[var(--scl-card)] shadow-2xl">
          {/* Ticket punch-holes */}
          <div className="absolute left-[-20px] top-[55%] h-10 w-10 rounded-full bg-[var(--scl-surface-alt)] shadow-inner" />
          <div className="absolute right-[-20px] top-[55%] h-10 w-10 rounded-full bg-[var(--scl-surface-alt)] shadow-inner" />

          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-8 text-center text-white">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#16a34a]/10 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-[#22c55e]/10 blur-xl" />
            <h2 className="relative z-10 text-3xl font-extrabold">
              Sacco<span className="text-[#22c55e]">Link</span>
            </h2>
            <p className="relative z-10 mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Boarding Pass</p>
          </div>

          {/* Body */}
          <div className="border-b-2 border-dashed border-[var(--scl-border)] p-6 pb-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">From</p>
                <p className="text-xl font-extrabold text-[var(--scl-text)]">{trip?.origin || "—"}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16a34a]/10 text-[#16a34a]">
                <I.ArrowRight className="h-5 w-5" />
              </div>
              <div className="text-right">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">To</p>
                <p className="text-xl font-extrabold text-[var(--scl-text)]">{trip?.destination || "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">Passenger</p>
                <p className="text-sm font-bold text-[var(--scl-text)]">{passenger?.name}</p>
              </div>
              <div className="text-right">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">Seat(s)</p>
                <p className="text-sm font-bold text-[var(--scl-text)]">{seats?.join(", ")}</p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">Date</p>
                <p className="text-sm font-bold text-[var(--scl-text)]">{trip?.date}</p>
              </div>
              <div className="text-right">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">Time</p>
                <p className="text-sm font-extrabold text-[#16a34a]">{trip?.departure}</p>
              </div>
            </div>
            {trip?.departure && <TicketCountdown departureTime={trip.departure} />}
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center bg-[var(--scl-surface-alt)] p-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-[var(--scl-border)]">
              <I.QrCode className="h-8 w-8 text-[var(--scl-text-secondary)]" />
            </div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--scl-text-secondary)]">Booking Ref</p>
            <p className="text-xl font-extrabold tracking-widest text-[var(--scl-text)]">{booking.bookingRef as string}</p>
            <div className="mt-4 flex items-center gap-2 rounded-full bg-[#16a34a]/10 px-4 py-2 text-xs font-bold text-[#16a34a]">
              <I.Check className="h-3.5 w-3.5" /> Paid {money(booking.amount as number)}
            </div>

            {/* Rating */}
            <TripRating onRate={handleRate} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 space-y-3">
          {/* Share */}
          <div className="relative">
            <button
              onClick={() => setShareMenuOpen(!shareMenuOpen)}
              className="haptic-tap w-full rounded-2xl border-2 border-[var(--scl-border)] bg-[var(--scl-card)] py-3.5 text-sm font-bold text-[var(--scl-text)] shadow-[var(--scl-shadow-sm)] transition hover:shadow-md"
            >
              Share Ticket
            </button>
            {shareMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-[var(--scl-border)] bg-[var(--scl-card)] p-2 shadow-xl animate-slide-up">
                {typeof navigator.share === "function" && (
                  <button onClick={() => handleShare("share")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--scl-text)] transition hover:bg-[var(--scl-surface-alt)]">
                    <I.Phone className="h-5 w-5 text-[#16a34a]" /> Share via...
                  </button>
                )}
                <button onClick={() => handleShare("copy")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--scl-text)] transition hover:bg-[var(--scl-surface-alt)]">
                  <I.Package className="h-5 w-5 text-[#16a34a]" /> Copy ticket details
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleHome}
            className="haptic-tap w-full rounded-2xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] py-4 text-base font-bold text-white shadow-lg shadow-[#16a34a]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
          >
            Book Another Trip
          </button>
        </div>
      </div>
    </div>
  );
}
