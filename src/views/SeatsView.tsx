import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { money } from "@/lib/utils";
import { useHaptic } from "@/lib/hooks";
import { playClick } from "@/lib/sounds";
import BottomSheet from "@/components/BottomSheet";
import * as I from "@/icons";

/* ─── Seat shape component ─── */
function SeatButton({
  num,
  state,
  onClick,
  showLabel,
}: {
  num: number;
  state: "available" | "selected" | "booked";
  onClick: () => void;
  showLabel?: boolean;
}) {
  const haptic = useHaptic();

  const styles = {
    available:
      "border-[var(--scl-border)] bg-[var(--scl-card)] text-[var(--scl-text)] cursor-pointer hover:border-[#16a34a] hover:text-[#16a34a] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#16a34a]/15",
    selected:
      "border-[#16a34a] bg-gradient-to-b from-[#22c55e] to-[#16a34a] text-white shadow-lg shadow-[#16a34a]/30 scale-105 ring-2 ring-[#16a34a]/20",
    booked:
      "border-[var(--scl-border)] bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)]/30 cursor-not-allowed opacity-30",
  };

  return (
    <button
      onClick={() => {
        if (state === "booked") {
          haptic("error");
          return;
        }
        haptic("tap");
        playClick();
        onClick();
      }}
      className={`group relative flex h-[3.25rem] w-[2.75rem] flex-col items-center justify-center rounded-t-xl rounded-b-lg border-2 text-xs font-bold select-none transition-all duration-200 ${styles[state]}`}
      title={state === "booked" ? `Seat ${num} — Booked` : `Seat ${num}`}
    >
      {/* Headrest indicator */}
      <div
        className={`absolute -top-[3px] left-1/2 h-1 w-4 -translate-x-1/2 rounded-full transition-colors ${
          state === "selected" ? "bg-white/40" : state === "booked" ? "bg-gray-300/30" : "bg-[var(--scl-border)]"
        }`}
      />
      <span className="relative z-10 mt-0.5">{num}</span>
      {showLabel && state !== "booked" && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[8px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-white dark:text-gray-900">
          {state === "selected" ? "Deselect" : "Select"}
        </span>
      )}
    </button>
  );
}

/* ─── Row Label ─── */
function RowLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex h-[3.25rem] items-center">
      <span className="w-5 text-center text-[9px] font-bold uppercase tracking-widest text-[var(--scl-text-secondary)]/40">
        {label}
      </span>
    </div>
  );
}

export default function SeatsView() {
  const navigate = useNavigate();
  const { selectedTrip, tickets, confirmSeats } = useBooking();
  const haptic = useHaptic();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [showSummary, setShowSummary] = useState(false);
  const [showInfo, setShowInfo] = useState<number | null>(null);

  if (!selectedTrip) return null;

  const capacity = selectedTrip.trip.vehicles?.capacity ?? 14;
  const booked = useMemo(
    () => new Set(tickets.filter((t) => t.trip_id === selectedTrip.trip.id).map((t) => t.seat_no)),
    [tickets, selectedTrip],
  );
  const soldCount = booked.size;
  const freeCount = capacity - soldCount;

  const toggle = (n: number) => {
    if (booked.has(n)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  /* ─── Layout: 2 front + rows of 3 (like a real van) ─── */
  const frontSeats = [1, 2];
  const bodyStart = 3;
  const bodySeats: number[][] = [];
  let seatNum = bodyStart;
  while (seatNum <= capacity) {
    const rowLen = Math.min(3, capacity - seatNum + 1);
    bodySeats.push(Array.from({ length: rowLen }, (_, i) => seatNum + i));
    seatNum += rowLen;
  }

  /* Row labels: A, B, C, ... for body rows */
  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const total = selected.size * selectedTrip.price;

  const handleContinue = () => {
    haptic("tap");
    playClick();
    confirmSeats([...selected]);
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen animate-fade-in bg-[var(--scl-surface-alt)] pb-32 md:pb-0">
      {/* ─── Sticky Header ─── */}
      <div className="sticky top-0 z-40 border-b border-[var(--scl-border)] bg-[var(--scl-card)] py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/results")}
              className="haptic-tap flex h-9 w-9 items-center justify-center rounded-full bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:bg-[var(--scl-border)]"
            >
              <I.ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--scl-text)]">Select Seats</h2>
              <p className="text-xs font-medium text-[var(--scl-text-secondary)]">
                {selectedTrip.plate} · {selectedTrip.departure}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-[var(--scl-surface-alt)] px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse-soft" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">
                {freeCount}/{capacity} free
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        {/* ═══════ SEAT MAP ═══════ */}
        <div className="flex flex-1 flex-col items-center rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-6 shadow-[var(--scl-shadow-sm)] md:p-8">
          {/* Zoom + info controls */}
          <div className="mb-5 flex w-full items-center justify-between">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">
              <span className="flex items-center gap-1.5">
                <I.ArrowRight className="h-3 w-3 rotate-90" /> Front
              </span>
              <span className="h-3 w-px bg-[var(--scl-border)]" />
              <span className="flex items-center gap-1.5">
                Rear <I.ArrowRight className="h-3 w-3 -rotate-90" />
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.65, z - 0.1))}
                className="haptic-tap flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--scl-border)] bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:border-[#16a34a]/30 hover:bg-[#16a34a]/5"
              >
                <span className="text-sm font-bold">−</span>
              </button>
              <span className="flex h-8 min-w-[2.5rem] items-center justify-center rounded-xl bg-[var(--scl-surface-alt)] text-[10px] font-bold text-[var(--scl-text-secondary)]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
                className="haptic-tap flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--scl-border)] bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:border-[#16a34a]/30 hover:bg-[#16a34a]/5"
              >
                <span className="text-sm font-bold">+</span>
              </button>
            </div>
          </div>

          {/* ─── Van Body ─── */}
          <div
            className="relative w-full max-w-[340px] transition-transform duration-300"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          >
            {/* Van outline */}
            <div className="overflow-visible rounded-[50px_50px_16px_16px] border-[3px] border-[var(--scl-border)] bg-gradient-to-b from-[var(--scl-card)] to-[var(--scl-surface-alt)] p-5 pb-6 pt-8 shadow-[0_15px_35px_-8px_rgba(0,0,0,0.08)]">
              {/* Windshield stripe */}
              <div className="absolute left-3 right-3 top-0 h-6 rounded-b-3xl bg-gradient-to-b from-[#16a34a]/8 to-transparent" />

              {/* Driver area */}
              <div className="mb-5 flex items-center justify-between px-1">
                <div className="flex gap-2.5">
                  {frontSeats.filter((n) => n <= capacity).map((n) => (
                    <SeatButton
                      key={n}
                      num={n}
                      state={booked.has(n) ? "booked" : selected.has(n) ? "selected" : "available"}
                      onClick={() => toggle(n)}
                      showLabel
                    />
                  ))}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-[var(--scl-border)] text-[var(--scl-text-secondary)]/25">
                    <I.Steering className="h-5 w-5" />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]/30">Driver</span>
                </div>
              </div>

              {/* Divider line */}
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--scl-border)] to-transparent" />
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--scl-border)]/30">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--scl-border)]" />
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--scl-border)] to-transparent" />
              </div>

              {/* Body rows */}
              {bodySeats.map((row, ri) => (
                <div key={ri} className="relative mb-3 flex items-center gap-0 pl-0">
                  {/* Row label */}
                  <RowLabel label={rowLabels[ri] || ""} count={row.length} />

                  {/* Left seats */}
                  <div className="flex gap-2">
                    {row.slice(0, Math.min(2, row.length)).map((n) => (
                      <SeatButton
                        key={n}
                        num={n}
                        state={booked.has(n) ? "booked" : selected.has(n) ? "selected" : "available"}
                        onClick={() => toggle(n)}
                        showLabel
                      />
                    ))}
                  </div>

                  {/* Aisle */}
                  <div className="mx-2 flex h-[3.25rem] w-6 flex-col items-center justify-center">
                    <div className="h-full w-px border-l border-dashed border-[var(--scl-border)]/50" />
                  </div>

                  {/* Right seats (if row has 3) */}
                  <div className="flex gap-2">
                    {row.slice(2).map((n) => (
                      <SeatButton
                        key={n}
                        num={n}
                        state={booked.has(n) ? "booked" : selected.has(n) ? "selected" : "available"}
                        onClick={() => toggle(n)}
                        showLabel
                      />
                    ))}
                    {/* Empty filler if row has < 3 */}
                    {row.length < 3 &&
                      Array.from({ length: 3 - row.length }).map((_, i) => (
                        <div key={`filler-${i}`} className="h-[3.25rem] w-[2.75rem]" />
                      ))}
                  </div>
                </div>
              ))}

              {/* Door indicator */}
              <div className="mt-2 flex items-center justify-center gap-2">
                <div className="h-px flex-1 bg-[var(--scl-border)]/30" />
                <div className="flex items-center gap-1 rounded-full border border-[var(--scl-border)]/40 bg-[var(--scl-surface-alt)] px-2 py-0.5">
                  <div className="h-1 w-1 rounded-full bg-[var(--scl-border)]" />
                  <span className="text-[7px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]/30">Door</span>
                </div>
                <div className="h-px flex-1 bg-[var(--scl-border)]/30" />
              </div>
            </div>
          </div>

          {/* ─── Legend ─── */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 rounded-2xl bg-[var(--scl-surface-alt)] px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-5 w-5 rounded-t-lg rounded-b border-2 border-[var(--scl-border)] bg-[var(--scl-card)]" />
                <div className="absolute -top-[2px] left-1/2 h-[2px] w-2.5 -translate-x-1/2 rounded-full bg-[var(--scl-border)]" />
              </div>
              <span className="text-[10px] font-bold text-[var(--scl-text-secondary)]">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-5 w-5 rounded-t-lg rounded-b border-2 border-[#16a34a] bg-[#16a34a]" />
                <div className="absolute -top-[2px] left-1/2 h-[2px] w-2.5 -translate-x-1/2 rounded-full bg-white/40" />
              </div>
              <span className="text-[10px] font-bold text-[#16a34a]">Selected ({selected.size})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-5 w-5 rounded-t-lg rounded-b border-2 border-[var(--scl-border)] bg-[var(--scl-surface-alt)] opacity-30" />
                <div className="absolute -top-[2px] left-1/2 h-[2px] w-2.5 -translate-x-1/2 rounded-full bg-[var(--scl-border)]/30" />
              </div>
              <span className="text-[10px] font-bold text-[var(--scl-text-secondary)]">Booked</span>
            </div>
          </div>

          {/* ─── Selection info strip ─── */}
          {selected.size > 0 && (
            <div className="mt-4 flex w-full items-center justify-between rounded-2xl border border-[#16a34a]/20 bg-[#16a34a]/5 px-4 py-3 animate-slide-down">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#16a34a] text-white text-xs font-bold">
                  {selected.size}
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--scl-text)]">
                    {selected.size === 1 ? "Seat" : "Seats"} selected
                  </p>
                  <p className="text-[10px] font-semibold text-[#16a34a]">
                    {[...selected].sort((a, b) => a - b).map((s) => `#${s}`).join(", ")}
                  </p>
                </div>
              </div>
              <p className="text-lg font-extrabold text-[#16a34a]">{money(total)}</p>
            </div>
          )}
        </div>

        {/* ═══════ DESKTOP SIDEBAR ═══════ */}
        <div className="hidden md:block md:w-80">
          <div className="sticky top-24 space-y-4">
            {/* Trip info card */}
            <div className="rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-5 shadow-[var(--scl-shadow-sm)]">
              <h3 className="mb-4 text-base font-extrabold text-[var(--scl-text)]">Trip Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[var(--scl-text-secondary)]">
                    <I.Bus className="h-4 w-4" /> Vehicle
                  </span>
                  <span className="rounded-lg bg-[var(--scl-surface-alt)] px-3 py-1 text-xs font-bold text-[var(--scl-text)]">
                    {selectedTrip.vehicleType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[var(--scl-text-secondary)]">
                    <I.MapPin className="h-4 w-4" /> Plate
                  </span>
                  <span className="font-bold text-[var(--scl-text)]">{selectedTrip.plate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[var(--scl-text-secondary)]">
                    <I.Calendar className="h-4 w-4" /> Departure
                  </span>
                  <span className="font-bold text-[#16a34a]">{selectedTrip.departure}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[var(--scl-text-secondary)]">
                    <I.Ticket className="h-4 w-4" /> Price
                  </span>
                  <span className="font-bold text-[var(--scl-text)]">{money(selectedTrip.price)}/seat</span>
                </div>
              </div>
            </div>

            {/* Selected seats card */}
            <div className="rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-5 shadow-[var(--scl-shadow-sm)]">
              <h3 className="mb-3 text-base font-extrabold text-[var(--scl-text)]">Your Selection</h3>
              {selected.size === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--scl-text-secondary)]">
                  Tap seats on the map to select them
                </p>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[...selected].sort((a, b) => a - b).map((n) => (
                      <button
                        key={n}
                        onClick={() => toggle(n)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#16a34a] bg-[#16a34a]/10 text-sm font-bold text-[#16a34a] transition hover:bg-[#16a34a] hover:text-white"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 border-t border-[var(--scl-border)] pt-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--scl-text-secondary)]">
                        {selected.size} × {money(selectedTrip.price)}
                      </span>
                      <span className="font-bold text-[var(--scl-text)]">{money(total)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--scl-border)] pt-2">
                      <span className="font-bold text-[var(--scl-text)]">Total</span>
                      <span className="text-xl font-extrabold text-[#16a34a]">{money(total)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Continue button */}
            <button
              disabled={selected.size === 0}
              onClick={handleContinue}
              className={`w-full rounded-2xl py-4 text-base font-bold shadow-lg transition-all ${
                selected.size > 0
                  ? "bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white shadow-[#16a34a]/25 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
                  : "cursor-not-allowed bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)]"
              }`}
            >
              Continue to Checkout <I.ArrowRight className="ml-1 inline h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ═══════ MOBILE BOTTOM BAR ═══════ */}
        <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-[var(--scl-border)] bg-[var(--scl-card)] p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:hidden">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowSummary(true)} className="text-xs font-bold text-[#16a34a]">
              {selected.size || 0} seat{(selected.size || 0) !== 1 ? "s" : ""} · Tap for details
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

      {/* ═══════ MOBILE SUMMARY SHEET ═══════ */}
      <BottomSheet open={showSummary} onClose={() => setShowSummary(false)} title="Trip Summary">
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--scl-text-secondary)]">Vehicle</span>
            <span className="font-semibold text-[var(--scl-text)]">{selectedTrip.vehicleType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--scl-text-secondary)]">Plate</span>
            <span className="font-semibold text-[var(--scl-text)]">{selectedTrip.plate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--scl-text-secondary)]">Departure</span>
            <span className="font-bold text-[#16a34a]">{selectedTrip.departure}</span>
          </div>
          <div className="flex justify-between border-t border-[var(--scl-border)] pt-3 text-sm">
            <span className="text-[var(--scl-text-secondary)]">Seats</span>
            <span className="font-bold text-[#16a34a]">
              {selected.size ? [...selected].sort((a, b) => a - b).join(", ") : "None"}
            </span>
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
