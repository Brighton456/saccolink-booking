import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { money } from "@/lib/utils";
import { useHaptic } from "@/lib/hooks";
import { playClick } from "@/lib/sounds";
import BottomSheet from "@/components/BottomSheet";
import * as I from "@/icons";

/* ─── Helpers for seat number mapping ─── */
function displayToInternal(display: number | string, isRealistic: boolean): number {
  if (display === "1X") return 2;
  const n = typeof display === "string" ? parseInt(display, 10) : display;
  if (isRealistic && n >= 2) return n + 1; // display 2 -> internal 3 to keep 1X=2 distinct
  return n;
}
function internalToDisplay(internal: number, isRealistic: boolean): string {
  if (internal === 2) return "1X";
  if (isRealistic && internal >= 3) return String(internal - 1);
  return String(internal);
}

/* ─── Seat shape - matches screenshot: grey box, green number, handle at bottom ─── */
function RealSeat({
  label,
  state,
  onClick,
  variant,
}: {
  label: string;
  state: "available" | "selected" | "booked";
  onClick: () => void;
  variant: "cabin" | "cabin-mid" | "bench" | "single" | "rear";
}) {
  const haptic = useHaptic();
  const size =
    variant === "cabin" ? "h-[40px] w-[50px]" :
    variant === "cabin-mid" ? "h-[40px] w-[44px]" :
    "h-[40px] flex-1";

  const styles = {
    available: "border-zinc-300 bg-[#e8eaed] text-[#0a7a42] hover:border-[#8B7D3C] hover:bg-emerald-50",
    selected: "border-amber-400 bg-amber-400 text-white shadow-md scale-[1.02]",
    booked: "border-zinc-300 bg-zinc-200 text-zinc-400 opacity-60 cursor-not-allowed",
  };

  return (
    <button
      onClick={() => {
        if (state === "booked") { haptic("error"); return; }
        haptic("tap"); playClick(); onClick();
      }}
      className={`relative flex flex-col items-center justify-center rounded-[3px] border-2 font-extrabold text-[11px] select-none transition-all ${size} ${styles[state]}`}
      title={state === "booked" ? `Seat ${label} — Booked` : `Seat ${label}`}
    >
      <div className={`absolute -top-[1px] h-[5px] w-[60%] rounded-b-[2px] ${state === "selected" ? "bg-amber-300" : state === "booked" ? "bg-zinc-300" : "bg-zinc-300"}`} />
      <span className={state === "selected" ? "text-white" : state === "booked" ? "text-zinc-500" : "text-[#0a7a42]"}>{label}</span>
      <div className={`absolute bottom-[4px] h-[6px] w-6 rounded-[2px] border ${state === "selected" ? "border-amber-200 bg-white/70" : "border-zinc-400 bg-white/70"}`} />
    </button>
  );
}

export default function SeatsView() {
  const navigate = useNavigate();
  const { selectedTrip, tickets, confirmSeats } = useBooking();
  const haptic = useHaptic();
  const [selected, setSelected] = useState<Set<number>>(new Set()); // stores DISPLAY numbers (1, "1X"-> special)
  const [selectedDisplay, setSelectedDisplay] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [showSummary, setShowSummary] = useState(false);

  if (!selectedTrip) return null;

  const capacity = selectedTrip.trip.vehicles?.capacity ?? 14;
  const vehicle = selectedTrip.trip.vehicles;
  const seatFormat = (vehicle as any)?.seat_format as string | null;
  const is14 = seatFormat === "2,3,3,3,3" || (!seatFormat && capacity === 14);
  const is16 = seatFormat === "2,4,3,3,4" || (!seatFormat && capacity === 16);
  const isRealistic = is14 || is16;

  // Booked sets - tickets store internal seat_no. Convert to display for comparison when realistic
  const bookedInternal = useMemo(
    () => new Set(tickets.filter((t) => t.trip_id === selectedTrip.trip.id).map((t) => t.seat_no)),
    [tickets, selectedTrip],
  );
  const bookedDisplay = useMemo(() => {
    const s = new Set<string>();
    if (!isRealistic) {
      bookedInternal.forEach((n) => s.add(String(n)));
      return s;
    }
    bookedInternal.forEach((n) => {
      if (n === 2) s.add("1X");
      else if (n >= 3) s.add(String(n - 1));
      else s.add(String(n));
    });
    return s;
  }, [bookedInternal, isRealistic]);

  const soldCount = bookedInternal.size;
  const freeCount = capacity - soldCount;

  const toggleDisplay = (label: string) => {
    // label is display string like "1", "1X", "2"
    if (bookedDisplay.has(label)) return;
    setSelectedDisplay((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
    // also keep legacy numeric set for compatibility (store display numeric where 1X=99)
    const numericKey = label === "1X" ? 99 : parseInt(label, 10);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(numericKey)) next.delete(numericKey);
      else next.add(numericKey);
      return next;
    });
  };

  const total = selectedDisplay.size * selectedTrip.price;

  const handleContinue = () => {
    haptic("tap");
    playClick();
    // Convert display labels to internal seat numbers for backend
    const internalSeats: number[] = [...selectedDisplay].map((label) => {
      if (label === "1X") return 2;
      const n = parseInt(label, 10);
      if (isRealistic && n >= 2) return n + 1;
      return n;
    }).sort((a, b) => a - b);
    confirmSeats(internalSeats);
    navigate("/checkout");
  };

  const seats14 = {
    row2: ["4", "3", "2"] as const,
    row3left: "7",
    row3right: ["6", "5"] as const,
    row4left: "10",
    row4right: ["9", "8"] as const,
    rear: ["13", "12", "11"] as const,
  };
  const seats16 = {
    row2: ["5", "4", "3", "2"] as const,
    row3left: "8",
    row3right: ["7", "6"] as const,
    row4left: "11",
    row4right: ["10", "9"] as const,
    rear: ["15", "14", "13", "12"] as const,
  };
  const layout: any = is14 ? seats14 : is16 ? seats16 : null;

  const getState = (label: string): "available" | "selected" | "booked" => {
    if (bookedDisplay.has(label)) return "booked";
    if (selectedDisplay.has(label)) return "selected";
    return "available";
  };

  return (
    <div className="min-h-screen animate-fade-in bg-[var(--scl-surface-alt)] pb-32 md:pb-0">
      <div className="sticky top-0 z-40 border-b border-[var(--scl-border)] bg-[var(--scl-card)] py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/results")} className="haptic-tap flex h-9 w-9 items-center justify-center rounded-full bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:bg-[var(--scl-border)]">
              <I.ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--scl-text)]">Select Seats</h2>
              <p className="text-xs font-medium text-[var(--scl-text-secondary)]">{selectedTrip.plate} · {selectedTrip.departure}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-[var(--scl-surface-alt)] px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B8A94E] animate-pulse-soft" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">{freeCount}/{capacity} free</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        <div className="flex flex-1 flex-col items-center rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-6 shadow-[var(--scl-shadow-sm)] md:p-8">
          <div className="mb-5 flex w-full items-center justify-between">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">
              <span className="flex items-center gap-1.5"><I.ArrowRight className="h-3 w-3 rotate-90" /> Front</span>
              <span className="h-3 w-px bg-[var(--scl-border)]" />
              <span className="flex items-center gap-1.5">Rear <I.ArrowRight className="h-3 w-3 -rotate-90" /></span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setZoom((z) => Math.max(0.65, z - 0.1))} className="haptic-tap flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--scl-border)] bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:border-[#8B7D3C]/30 hover:bg-[#8B7D3C]/5"><span className="text-sm font-bold">−</span></button>
              <span className="flex h-8 min-w-[2.5rem] items-center justify-center rounded-xl bg-[var(--scl-surface-alt)] text-[10px] font-bold text-[var(--scl-text-secondary)]">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))} className="haptic-tap flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--scl-border)] bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:border-[#8B7D3C]/30 hover:bg-[#8B7D3C]/5"><span className="text-sm font-bold">+</span></button>
            </div>
          </div>

          <div className="relative w-full max-w-[260px] transition-transform duration-300" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            {isRealistic && layout ? (
              <div className="relative rounded-t-[36px] rounded-b-[20px] border-[2px] border-zinc-300 bg-white px-3 pb-5 pt-2 shadow-xl">
                <div className="absolute -left-[8px] top-[68px] h-7 w-[10px] rounded-l-full border border-zinc-300 bg-white shadow-sm" />
                <div className="absolute -right-[8px] top-[68px] h-7 w-[10px] rounded-r-full border border-zinc-300 bg-white shadow-sm" />
                <div className="relative mb-2 flex h-[52px] items-end justify-center rounded-t-[28px] border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-2">
                  <div className="absolute inset-x-3 top-3 h-6 rounded-t-[18px] border border-zinc-200 bg-white/80" />
                  <div className="absolute right-[18px] top-[10px] flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-400">
                    <I.Steering className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-end justify-between gap-2 px-1">
                    <RealSeat label="1" state={getState("1")} onClick={() => toggleDisplay("1")} variant="cabin" />
                    <RealSeat label="1X" state={getState("1X")} onClick={() => toggleDisplay("1X")} variant="cabin-mid" />
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex h-[52px] w-[64px] items-center justify-center rounded-lg border border-zinc-400 bg-[#1e3a5f] shadow-inner">
                        <I.Steering className="h-5 w-5 text-white/30" />
                      </div>
                      <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-400">Driver</span>
                    </div>
                  </div>
                  <div className="flex gap-[6px]">
                    {layout.row2.map((lbl: string) => (
                      <RealSeat key={lbl} label={lbl} state={getState(lbl)} onClick={() => toggleDisplay(lbl)} variant="bench" />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <div className="w-[30%]"><RealSeat label={layout.row3left} state={getState(layout.row3left)} onClick={() => toggleDisplay(layout.row3left)} variant="single" /></div>
                    <div className="flex flex-1 gap-[6px] justify-end">
                      {layout.row3right.map((lbl: string) => (
                        <RealSeat key={lbl} label={lbl} state={getState(lbl)} onClick={() => toggleDisplay(lbl)} variant="single" />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-[30%]"><RealSeat label={layout.row4left} state={getState(layout.row4left)} onClick={() => toggleDisplay(layout.row4left)} variant="single" /></div>
                    <div className="flex flex-1 gap-[6px] justify-end">
                      {layout.row4right.map((lbl: string) => (
                        <RealSeat key={lbl} label={lbl} state={getState(lbl)} onClick={() => toggleDisplay(lbl)} variant="single" />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-[6px]">
                    {layout.rear.map((lbl: string) => (
                      <RealSeat key={lbl} label={lbl} state={getState(lbl)} onClick={() => toggleDisplay(lbl)} variant="rear" />
                    ))}
                  </div>
                </div>
                <div className="absolute -left-[6px] top-[172px] h-14 w-[6px] rounded-r-md border border-amber-300 bg-amber-100" />
              </div>
            ) : (
              /* Fallback generic 2+aisle layout for other capacities */
              <div className="overflow-visible rounded-[50px_50px_16px_16px] border-[3px] border-[var(--scl-border)] bg-gradient-to-b from-[var(--scl-card)] to-[var(--scl-surface-alt)] p-5 pb-6 pt-8 shadow-[0_15px_35px_-8px_rgba(0,0,0,0.08)]">
                <div className="absolute left-3 right-3 top-0 h-6 rounded-b-3xl bg-gradient-to-b from-[#8B7D3C]/8 to-transparent" />
                {(() => {
                  // generic fallback rendering
                  const formatParts = seatFormat ? seatFormat.split(",").map(s => parseInt(s.trim(), 10)).filter(v => !isNaN(v) && v > 0) : [];
                  const rows: { seats: number[] }[] = [];
                  let c = 1;
                  if (formatParts.length > 0 && Math.abs(formatParts.reduce((a,b)=>a+b,0)-capacity)<=2) {
                    formatParts.forEach((rs, idx) => {
                      if (idx===0) { rows.push({ seats: Array.from({length: rs}, ()=> c++) }); }
                      else { rows.push({ seats: Array.from({length: rs}, ()=> c++) }); }
                    });
                  } else {
                    rows.push({ seats: [1,2] });
                    let sn=3; while(sn<=capacity){ const len=Math.min(3, capacity-sn+1); rows.push({ seats: Array.from({length: len}, ()=> sn++)}); }
                  }
                  return rows.map((row, ri) => (
                    <div key={ri} className="relative mb-3 flex items-center gap-0">
                      <div className="flex gap-2">
                        {row.seats.slice(0,2).map(n => {
                          const lbl = n===2 ? "1X" : String(n);
                          return <RealSeat key={n} label={lbl} state={bookedDisplay.has(lbl) ? "booked" : selectedDisplay.has(lbl) ? "selected" : "available"} onClick={() => toggleDisplay(lbl)} variant="single" />
                        })}
                      </div>
                      <div className="mx-2 flex h-[52px] w-6 flex-col items-center justify-center"><div className="h-full w-px border-l border-dashed border-[var(--scl-border)]/50" /></div>
                      <div className="flex gap-2">
                        {row.seats.slice(2).map(n => {
                          const lbl = String(n);
                          return <RealSeat key={n} label={lbl} state={bookedDisplay.has(lbl) ? "booked" : selectedDisplay.has(lbl) ? "selected" : "available"} onClick={() => toggleDisplay(lbl)} variant="single" />
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 rounded-2xl bg-[var(--scl-surface-alt)] px-5 py-3">
            <div className="flex items-center gap-2"><div className="h-5 w-5 rounded border-2 border-zinc-300 bg-[#e8eaed]" /><span className="text-[10px] font-bold text-[var(--scl-text-secondary)]">Available</span></div>
            <div className="flex items-center gap-2"><div className="h-5 w-5 rounded border-2 border-amber-400 bg-amber-400" /><span className="text-[10px] font-bold text-amber-600">Selected ({selectedDisplay.size})</span></div>
            <div className="flex items-center gap-2"><div className="h-5 w-5 rounded border-2 border-zinc-300 bg-zinc-200 opacity-60" /><span className="text-[10px] font-bold text-[var(--scl-text-secondary)]">Booked</span></div>
          </div>

          {selectedDisplay.size > 0 && (
            <div className="mt-4 flex w-full items-center justify-between rounded-2xl border border-[#8B7D3C]/20 bg-[#8B7D3C]/5 px-4 py-3 animate-slide-down">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8B7D3C] text-white text-xs font-bold">{selectedDisplay.size}</div>
                <div>
                  <p className="text-xs font-bold text-[var(--scl-text)]">{selectedDisplay.size === 1 ? "Seat" : "Seats"} selected</p>
                  <p className="text-[10px] font-semibold text-[#8B7D3C]">{[...selectedDisplay].sort((a,b)=> (a==="1X"? 1 : parseInt(a)) - (b==="1X"?1:parseInt(b))).join(", ")}</p>
                </div>
              </div>
              <p className="text-lg font-extrabold text-[#8B7D3C]">{money(total)}</p>
            </div>
          )}
        </div>

        <div className="hidden md:block md:w-80">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-5 shadow-[var(--scl-shadow-sm)]">
              <h3 className="mb-4 text-base font-extrabold text-[var(--scl-text)]">Trip Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[var(--scl-text-secondary)]"><I.Bus className="h-4 w-4" /> Vehicle</span><span className="rounded-lg bg-[var(--scl-surface-alt)] px-3 py-1 text-xs font-bold text-[var(--scl-text)]">{selectedTrip.vehicleType}</span></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[var(--scl-text-secondary)]"><I.MapPin className="h-4 w-4" /> Plate</span><span className="font-bold text-[var(--scl-text)]">{selectedTrip.plate}</span></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[var(--scl-text-secondary)]"><I.Calendar className="h-4 w-4" /> Departure</span><span className="font-bold text-[#8B7D3C]">{selectedTrip.departure}</span></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[var(--scl-text-secondary)]"><I.Ticket className="h-4 w-4" /> Price</span><span className="font-bold text-[var(--scl-text)]">{money(selectedTrip.price)}/seat</span></div>
              </div>
            </div>
            <div className="rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-5 shadow-[var(--scl-shadow-sm)]">
              <h3 className="mb-3 text-base font-extrabold text-[var(--scl-text)]">Your Selection</h3>
              {selectedDisplay.size === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--scl-text-secondary)]">Tap seats on the map to select them</p>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[...selectedDisplay].sort((a,b)=> (a==="1X"? 99 : parseInt(a,10)) - (b==="1X"?99:parseInt(b,10))).map((lbl) => (
                      <button key={lbl} onClick={() => toggleDisplay(lbl)} className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#8B7D3C] bg-[#8B7D3C]/10 text-sm font-bold text-[#8B7D3C] transition hover:bg-[#8B7D3C] hover:text-white">{lbl}</button>
                    ))}
                  </div>
                  <div className="space-y-2 border-t border-[var(--scl-border)] pt-3 text-sm">
                    <div className="flex justify-between"><span className="text-[var(--scl-text-secondary)]">{selectedDisplay.size} × {money(selectedTrip.price)}</span><span className="font-bold text-[var(--scl-text)]">{money(total)}</span></div>
                    <div className="flex justify-between border-t border-[var(--scl-border)] pt-2"><span className="font-bold text-[var(--scl-text)]">Total</span><span className="text-xl font-extrabold text-[#8B7D3C]">{money(total)}</span></div>
                  </div>
                </>
              )}
            </div>
            <button disabled={selectedDisplay.size === 0} onClick={handleContinue} className={`w-full rounded-2xl py-4 text-base font-bold shadow-lg transition-all ${selectedDisplay.size > 0 ? "bg-gradient-to-r from-[#B8A94E] to-[#8B7D3C] text-white shadow-[#8B7D3C]/25 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]" : "cursor-not-allowed bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)]"}`}>
              Continue to Checkout <I.ArrowRight className="ml-1 inline h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-[var(--scl-border)] bg-[var(--scl-card)] p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:hidden">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowSummary(true)} className="text-xs font-bold text-[#8B7D3C]">{selectedDisplay.size || 0} seat{(selectedDisplay.size || 0) !== 1 ? "s" : ""} · Tap for details</button>
            <span className="text-xl font-extrabold text-[var(--scl-text)]">{money(total)}</span>
          </div>
          <button disabled={selectedDisplay.size === 0} onClick={handleContinue} className={`mt-3 w-full rounded-2xl py-3.5 text-base font-bold shadow-md transition-all ${selectedDisplay.size > 0 ? "bg-gradient-to-r from-[#B8A94E] to-[#8B7D3C] text-white shadow-[#8B7D3C]/25 active:scale-[0.98]" : "cursor-not-allowed bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)]"}`}>
            Continue <I.ArrowRight className="ml-1 inline h-4 w-4" />
          </button>
        </div>
      </div>

      <BottomSheet open={showSummary} onClose={() => setShowSummary(false)} title="Trip Summary">
        <div className="space-y-4">
          <div className="flex justify-between text-sm"><span className="text-[var(--scl-text-secondary)]">Vehicle</span><span className="font-semibold text-[var(--scl-text)]">{selectedTrip.vehicleType}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[var(--scl-text-secondary)]">Plate</span><span className="font-semibold text-[var(--scl-text)]">{selectedTrip.plate}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[var(--scl-text-secondary)]">Departure</span><span className="font-bold text-[#8B7D3C]">{selectedTrip.departure}</span></div>
          <div className="flex justify-between border-t border-[var(--scl-border)] pt-3 text-sm"><span className="text-[var(--scl-text-secondary)]">Seats</span><span className="font-bold text-[#8B7D3C]">{selectedDisplay.size ? [...selectedDisplay].sort((a,b)=> (a==="1X"?99:parseInt(a))-(b==="1X"?99:parseInt(b))).join(", ") : "None"}</span></div>
          <div className="flex justify-between border-t border-[var(--scl-border)] pt-3"><span className="text-sm text-[var(--scl-text-secondary)]">Total</span><span className="text-2xl font-extrabold text-[var(--scl-text)]">{money(total)}</span></div>
        </div>
      </BottomSheet>
    </div>
  );
}
