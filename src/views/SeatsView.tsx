import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { money } from "@/lib/utils";
import { useHaptic } from "@/lib/hooks";
import { playClick } from "@/lib/sounds";
import BottomSheet from "@/components/BottomSheet";
import * as I from "@/icons";

export default function SeatsView() {
  const navigate = useNavigate();
  const { selectedTrip, tickets, confirmSeats } = useBooking();
  const haptic = useHaptic();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [showSummary, setShowSummary] = useState(false);

  if (!selectedTrip) return null;

  const capacity = selectedTrip.trip.vehicles?.capacity ?? 14;
  const booked = useMemo(
    () => new Set(tickets.filter((t) => t.trip_id === selectedTrip.trip.id).map((t) => t.seat_no)),
    [tickets, selectedTrip],
  );
  const soldCount = booked.size;

  const toggle = (n: number) => {
    if (booked.has(n)) { haptic("error"); return; }
    haptic("tap");
    playClick();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  };

  const front = Array.from({ length: Math.min(2, capacity) }, (_, i) => i + 1);
  const rows: number[][] = [];
  let idx = front.length;
  while (idx < capacity) {
    const rowLen = idx + 3 <= capacity ? 3 : capacity - idx;
    rows.push(Array.from({ length: rowLen }, (_, i) => idx + i + 1));
    idx += rowLen;
  }

  const seatClass = (n: number) => {
    const base = "seat flex h-14 w-12 flex-col items-center justify-center rounded-t-2xl rounded-b-lg border-2 text-sm font-bold select-none relative overflow-hidden ";
    if (selected.has(n)) return base + "border-[#16a34a] bg-[#16a34a] text-white shadow-lg shadow-[#16a34a]/30 scale-105";
    if (booked.has(n)) return base + "border-[var(--scl-border)] bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)]/40 cursor-not-allowed opacity-40";
    return base + "border-[var(--scl-border)] bg-[var(--scl-card)] text-[var(--scl-text)] cursor-pointer hover:border-[#16a34a] hover:text-[#16a34a] hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#16a34a]/10";
  };

  const total = selected.size * selectedTrip.price;

  const handleContinue = () => {
    haptic("tap");
    playClick();
    confirmSeats([...selected]);
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen animate-fade-in bg-[var(--scl-surface-alt)] pb-32 md:pb-0">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 border-b border-[var(--scl-border)] bg-[var(--scl-card)] py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/results")} className="haptic-tap flex h-9 w-9 items-center justify-center rounded-full bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:bg-[var(--scl-border)]">
              <I.ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--scl-text)]">Select Seats</h2>
              <p className="text-xs font-medium text-[var(--scl-text-secondary)]">
                {selectedTrip.plate} · {selectedTrip.departure}
              </p>
            </div>
          </div>
          {/* Availability badge */}
          <div className="flex items-center gap-2 rounded-xl bg-[var(--scl-surface-alt)] px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse-soft" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">
              {capacity - soldCount}/{capacity} free
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        {/* Seat Map */}
        <div className="flex flex-1 flex-col items-center rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-6 shadow-[var(--scl-shadow-sm)] md:p-10">
          {/* Zoom controls */}
          <div className="mb-4 flex w-full items-center justify-between">
            <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">
              <span>Front</span>
              <span className="mx-2">·</span>
              <span>Rear</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))} className="haptic-tap flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:bg-[var(--scl-border)]">
                <span className="text-sm font-bold">−</span>
              </button>
              <span className="flex h-7 min-w-[2.5rem] items-center justify-center rounded-lg bg-[var(--scl-surface-alt)] text-[10px] font-bold text-[var(--scl-text-secondary)]">
                {Math.round(zoom * 100)}%
              </span>
              <button onClick={() => setZoom((z) => Math.min(1.3, z + 0.1))} className="haptic-tap flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:bg-[var(--scl-border)]">
                <span className="text-sm font-bold">+</span>
              </button>
            </div>
          </div>

          {/* Seat map container */}
          <div className="overflow-hidden rounded-[40px_40px_10px_10px] border-4 border-[var(--scl-border)] bg-[var(--scl-card)] p-[25px_15px_15px_15px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] transition-transform duration-300" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            <div className="absolute left-[-4px] top-[100px] h-20 w-1 rounded bg-[#16a34a]" />
            <div className="mb-8 flex items-center justify-between px-2">
              <div className="flex gap-2">
                {front.map((n) => (
                  <button key={n} onClick={() => toggle(n)} className={seatClass(n)}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex h-14 w-12 items-center justify-center text-[var(--scl-text-secondary)]/30">
                <I.Steering className="h-6 w-6" />
              </div>
            </div>
            {rows.map((row, ri) => (
              <div key={ri} className="relative mb-4 flex justify-start gap-2 px-2 pl-12">
                {row.map((n) => (
                  <button key={n} onClick={() => toggle(n)} className={seatClass(n)}>
                    {n}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 rounded-2xl bg-[var(--scl-surface-alt)] px-5 py-3 text-xs font-bold text-[var(--scl-text-secondary)]">
            <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-md border-2 border-[var(--scl-border)] bg-[var(--scl-card)]" /> Available</div>
            <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-md border-2 border-[#16a34a] bg-[#16a34a]" /> Selected ({selected.size})</div>
            <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-md border-2 border-[var(--scl-border)] bg-[var(--scl-surface-alt)] opacity-40" /> Booked</div>
          </div>
        </div>

        {/* Desktop summary sidebar */}
        <div className="hidden md:block md:w-80">
          <div className="sticky top-24 rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-6 shadow-[var(--scl-shadow-sm)]">
            <h3 className="mb-4 text-lg font-extrabold text-[var(--scl-text)]">Trip Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[var(--scl-text-secondary)]">Vehicle</span><span className="rounded-lg bg-[var(--scl-surface-alt)] px-3 py-1 font-semibold text-[var(--scl-text)]">{selectedTrip.vehicleType}</span></div>
              <div className="flex justify-between"><span className="text-[var(--scl-text-secondary)]">Plate</span><span className="font-semibold text-[var(--scl-text)]">{selectedTrip.plate}</span></div>
              <div className="flex justify-between"><span className="text-[var(--scl-text-secondary)]">Time</span><span className="font-semibold text-[var(--scl-text)]">{selectedTrip.departure}</span></div>
              <div className="flex justify-between border-t border-[var(--scl-border)] pt-3">
                <span className="text-[var(--scl-text-secondary)]">Seats</span>
                <span className="font-bold text-[#16a34a]">{selected.size ? [...selected].join(", ") : "None"}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--scl-border)] pt-3">
                <span className="text-[var(--scl-text-secondary)]">Total</span>
                <span className="text-xl font-extrabold text-[var(--scl-text)]">{money(total)}</span>
              </div>
            </div>
            <button
              disabled={selected.size === 0}
              onClick={handleContinue}
              className={`mt-6 w-full rounded-2xl py-4 text-base font-bold shadow-lg transition-all ${
                selected.size > 0
                  ? "bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white shadow-[#16a34a]/25 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
                  : "cursor-not-allowed bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)]"
              }`}
            >
              Continue to Checkout <I.ArrowRight className="ml-1 inline h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile bottom bar */}
        <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-[var(--scl-border)] bg-[var(--scl-card)] p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:hidden">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowSummary(true)} className="text-xs font-bold text-[#16a34a]">
              {selected.size || 0} seat{(selected.size || 0) !== 1 ? "s" : ""} selected
            </button>
            <span className="text-xl font-extrabold text-[var(--scl-text)]">{money(total)}</span>
          </div>
          <button
            disabled={selected.size === 0}
            onClick={handleContinue}
            className={`mt-3 w-full rounded-2xl py-3.5 text-base font-bold shadow-md transition-all ${
              selected.size > 0
                ? "bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white shadow-[#16a34a]/25 active:scale-[0.98]"
                : "cursor-not-allowed bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)]"
            }`}
          >
            Continue <I.ArrowRight className="ml-1 inline h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile summary bottom sheet */}
      <BottomSheet open={showSummary} onClose={() => setShowSummary(false)} title="Trip Summary">
        <div className="space-y-4">
          <div className="flex justify-between text-sm"><span className="text-[var(--scl-text-secondary)]">Vehicle</span><span className="font-semibold text-[var(--scl-text)]">{selectedTrip.vehicleType}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[var(--scl-text-secondary)]">Plate</span><span className="font-semibold text-[var(--scl-text)]">{selectedTrip.plate}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[var(--scl-text-secondary)]">Time</span><span className="font-semibold text-[var(--scl-text)]">{selectedTrip.departure}</span></div>
          <div className="flex justify-between border-t border-[var(--scl-border)] pt-3 text-sm">
            <span className="text-[var(--scl-text-secondary)]">Seats</span>
            <span className="font-bold text-[#16a34a]">{selected.size ? [...selected].join(", ") : "None"}</span>
          </div>
          <div className="flex justify-between border-t border-[var(--scl-border)] pt-3">
            <span className="text-sm text-[var(--scl-text-secondary)]">Total</span>
            <span className="text-2xl font-extrabold text-[var(--scl-text)]">{money(total)}</span>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
