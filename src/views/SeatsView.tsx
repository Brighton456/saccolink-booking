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

/* ─── Realistic car seat shape — headrest + backrest + cushion ─── */
function RealSeat({
  label,
  state,
  onClick,
  compact,
}: {
  label: string;
  state: "available" | "selected" | "booked";
  onClick: () => void;
  compact?: boolean;
}) {
  const haptic = useHaptic();

  const handleTap = () => {
    if (state === "booked") { haptic("error"); return; }
    haptic("tap"); playClick(); onClick();
  };

  if (state === "booked") {
    return (
      <div
        className={`relative cursor-not-allowed ${compact ? "scale-90" : ""}`}
        title={`Seat ${label} — Booked`}
      >
        <div className="relative flex flex-col items-center rounded-t-xl rounded-b-lg border-2 border-red-300/60 bg-red-50/80 px-0.5 pt-1.5 pb-1 opacity-60">
          <div className="mb-0.5 h-1.5 w-[60%] rounded-t-md bg-red-300/50" />
          <div className="mb-0.5 h-3 w-[80%] rounded border border-red-300/40 bg-red-200/40" />
          <div className="flex h-5 w-full items-center justify-center rounded-b-md border-2 border-red-300/50 bg-red-200/50">
            <span className="text-[9px] font-extrabold text-red-400 line-through">{label}</span>
          </div>
        </div>
      </div>
    );
  }

  const isSel = state === "selected";
  return (
    <button
      onClick={handleTap}
      className={`relative group select-none transition-all duration-200 w-full ${compact ? "scale-90" : ""}`}
      title={`Seat ${label}`}
    >
      <div className={`relative flex flex-col items-center rounded-t-xl rounded-b-lg border-2 px-0.5 pt-1.5 pb-1 transition-all duration-200 ${
        isSel
          ? "border-[#B8A94E] bg-gradient-to-b from-[#B8A94E]/15 to-[#8B7D3C]/15 shadow-[0_4px_16px_rgba(139,125,60,0.3)] scale-[1.05]"
          : "border-[#8B7D3C]/25 bg-white group-hover:border-[#8B7D3C]/60 group-hover:shadow-md"
      }`}>
        <div className={`mb-0.5 h-1.5 w-[60%] rounded-t-md transition-colors ${isSel ? "bg-[#B8A94E]" : "bg-[#8B7D3C]/20"}`} />
        <div className={`mb-0.5 h-3 w-[80%] rounded border transition-all ${isSel ? "border-[#B8A94E] bg-[#B8A94E]/80" : "border-[#8B7D3C]/30 bg-[#8B7D3C]/8"}`} />
        <div className={`flex h-5 w-full items-center justify-center rounded-b-md border-2 transition-all ${
          isSel ? "border-[#B8A94E] bg-[#B8A94E] text-white" : "border-[#8B7D3C]/30 bg-[var(--scl-surface-alt)] text-[#0a7a42] group-hover:bg-[#8B7D3C]/8"
        }`}>
          <span className="text-[9px] font-extrabold">{label}</span>
        </div>
      </div>
    </button>
  );
}

/* ─── Driver seat icon ─── */
function DriverIcon() {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border-2 border-[#1e3a5f] bg-[#1e3a5f] shadow-inner">
        <I.Steering className="h-5 w-5 text-white/50" />
      </div>
      <span className="text-[6px] font-bold uppercase tracking-widest text-zinc-400">Driver</span>
    </div>
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
  const seatFormat = ((vehicle as any)?.seat_format as string | null)?.replace(/\s/g, "");
  const is14 = seatFormat?.startsWith("2,3,3,3") || (!seatFormat && (capacity >= 13 && capacity <= 15));
  const is16 = seatFormat?.startsWith("2,4,3,3") || (!seatFormat && (capacity >= 16 && capacity <= 18));
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

  /* 14-seater: 1,1X,cabin → 2,3,4,5 → 6,7|8 → 9,10|11 → 12,13,14,15
     Double seats (6,7,9,10) are wider; singles (8,11) are narrower aisle seats.
     Image reference: door area between seat 5 and 8, pathway between 7-8 and 10-11 */
  const seats14 = {
    row2: ["5", "4", "3", "2"] as const,
    row3left: "8",
    row3right: ["7", "6"] as const,
    row4left: "11",
    row4right: ["10", "9"] as const,
    rear: ["15", "14", "13", "12"] as const,
  };
  /* 16-seater: 1,1X,cabin → 2,3,4,5,6 → 7,8|9 → 10,11|12 → 13,14,15,16,17 */
  const seats16 = {
    row2: ["6", "5", "4", "3", "2"] as const,
    row3left: "9",
    row3right: ["8", "7"] as const,
    row4left: "12",
    row4right: ["11", "10"] as const,
    rear: ["17", "16", "15", "14", "13"] as const,
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

          <div className="relative w-full max-w-[300px] transition-transform duration-300" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            {isRealistic && layout ? (
              <div className="relative rounded-b-[24px] border-2 border-zinc-300 bg-gradient-to-b from-white via-white to-zinc-50 shadow-xl overflow-hidden">
                {/* Roof rails */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-zinc-200 via-zinc-100 to-zinc-200" />
                <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-zinc-200 via-zinc-100 to-zinc-200" />

                {/* Windshield / bonnet */}
                <div className="relative mx-3 mt-3 mb-1">
                  <div className="relative h-[50px] rounded-t-[40px] border-2 border-b-0 border-zinc-300 bg-gradient-to-b from-zinc-50 to-white overflow-hidden">
                    <div className="absolute inset-x-4 top-2 bottom-4 rounded-t-[28px] bg-gradient-to-b from-sky-100/60 to-sky-50/30 border border-zinc-200/60" />
                    <div className="absolute bottom-0 inset-x-2 h-3 rounded-t-sm bg-zinc-200/60" />
                    <div className="absolute right-5 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 border-zinc-300 bg-white shadow-sm">
                      <I.Steering className="h-3 w-3 text-zinc-400" />
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-1 h-2 w-6 rounded-b-sm bg-zinc-300/60" />
                  </div>
                </div>

                {/* Side mirrors */}
                {/* Left mirror — arm + housing */}
                <div className="absolute -left-[14px] top-[62px] flex items-center">
                  <div className="h-[3px] w-2 bg-zinc-300" />
                  <div className="h-7 w-3.5 rounded-l-full border-2 border-zinc-300 bg-gradient-to-r from-zinc-100 to-white shadow-md" />
                  <div className="absolute left-[6px] top-[3px] h-5 w-1.5 rounded-l-sm bg-sky-200/60" />
                </div>
                {/* Right mirror — arm + housing */}
                <div className="absolute -right-[14px] top-[62px] flex items-center">
                  <div className="h-7 w-3.5 rounded-r-full border-2 border-zinc-300 bg-gradient-to-l from-zinc-100 to-white shadow-md" />
                  <div className="h-[3px] w-2 bg-zinc-300" />
                  <div className="absolute right-[6px] top-[3px] h-5 w-1.5 rounded-r-sm bg-sky-200/60" />
                </div>

                {/* Interior — dynamic grid based on seat count */}
                {(() => {
                  const benchCols = is14 ? 4 : 5;
                  const aisleCols = is14 ? "0.8fr_12px_1fr_1fr" : "0.8fr_12px_1fr_1fr_1fr";
                  return (
                    <div className="px-3 pb-4 pt-1 space-y-2">
                      {/* Cabin row: 1 | 1X | Driver */}
                      <div className="grid grid-cols-[1fr_1fr_42px] gap-1.5 items-end">
                        <RealSeat label="1" state={getState("1")} onClick={() => toggleDisplay("1")} />
                        <RealSeat label="1X" state={getState("1X")} onClick={() => toggleDisplay("1X")} />
                        <DriverIcon />
                      </div>

                      <div className="mx-2 h-px bg-zinc-200" />

                      {/* Row 2 — full bench */}
                      <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${benchCols}, minmax(0, 1fr))` }}>
                        {layout.row2.map((lbl: string) => (
                          <div key={lbl}><RealSeat label={lbl} state={getState(lbl)} onClick={() => toggleDisplay(lbl)} /></div>
                        ))}
                      </div>

                      {/* Door marker + aisle label */}
                      <div className="flex items-center gap-1 px-1">
                        <div className="h-6 w-1.5 rounded-r-sm bg-amber-400/60 border border-amber-300/60" />
                        <div className="flex-1 border-b border-dashed border-zinc-200" />
                        <span className="text-[5px] font-bold uppercase tracking-widest text-zinc-300">aisle</span>
                        <div className="flex-1 border-b border-dashed border-zinc-200" />
                      </div>

                      {/* Row 3 — [left] [aisle] [right...] */}
                      <div className="grid gap-1.5 items-center" style={{ gridTemplateColumns: aisleCols }}>
                        <div className="flex justify-center"><RealSeat label={layout.row3left} state={getState(layout.row3left)} onClick={() => toggleDisplay(layout.row3left)} compact /></div>
                        <div className="flex items-center justify-center h-full"><div className="h-10 w-px border-l border-dashed border-zinc-300/50" /></div>
                        {layout.row3right.map((lbl: string) => (
                          <div key={lbl}><RealSeat label={lbl} state={getState(lbl)} onClick={() => toggleDisplay(lbl)} /></div>
                        ))}
                      </div>

                      {/* Row 4 — [left] [aisle] [right...] */}
                      <div className="grid gap-1.5 items-center" style={{ gridTemplateColumns: aisleCols }}>
                        <div className="flex justify-center"><RealSeat label={layout.row4left} state={getState(layout.row4left)} onClick={() => toggleDisplay(layout.row4left)} compact /></div>
                        <div className="flex items-center justify-center h-full"><div className="h-10 w-px border-l border-dashed border-zinc-300/50" /></div>
                        {layout.row4right.map((lbl: string) => (
                          <div key={lbl}><RealSeat label={lbl} state={getState(lbl)} onClick={() => toggleDisplay(lbl)} /></div>
                        ))}
                      </div>

                      {/* Rear bench */}
                      <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${benchCols}, minmax(0, 1fr))` }}>
                        {layout.rear.map((lbl: string) => (
                          <div key={lbl}><RealSeat label={lbl} state={getState(lbl)} onClick={() => toggleDisplay(lbl)} /></div>
                        ))}
                      </div>

                      {/* Rear window */}
                      <div className="mx-8 mt-1 h-3 rounded-b-lg border-2 border-t-0 border-zinc-200 bg-sky-50/40" />
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Fallback generic 2+aisle layout for other capacities */
              <div className="overflow-visible rounded-b-[24px] border-2 border-zinc-300 bg-gradient-to-b from-white to-zinc-50 p-5 pb-6 pt-8 shadow-xl">
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
                          return <RealSeat key={n} label={lbl} state={bookedDisplay.has(lbl) ? "booked" : selectedDisplay.has(lbl) ? "selected" : "available"} onClick={() => toggleDisplay(lbl)} />
                        })}
                      </div>
                      <div className="mx-2 flex h-[52px] w-6 flex-col items-center justify-center"><div className="h-full w-px border-l border-dashed border-[var(--scl-border)]/50" /></div>
                      <div className="flex gap-2">
                        {row.seats.slice(2).map(n => {
                          const lbl = String(n);
                          return <RealSeat key={n} label={lbl} state={bookedDisplay.has(lbl) ? "booked" : selectedDisplay.has(lbl) ? "selected" : "available"} onClick={() => toggleDisplay(lbl)} />
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-3 text-[8px] font-bold text-[var(--scl-text-secondary)]">
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded border border-[#8B7D3C]/25 bg-white" />Available</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded border border-[#B8A94E] bg-[#B8A94E]" />Selected</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded border border-red-300/60 bg-red-100/80 opacity-60" />Booked</span>
          </div>

          {selectedDisplay.size > 0 && (
            <div className="mt-2 flex w-full items-center justify-between rounded-lg border border-[#8B7D3C]/20 bg-[#8B7D3C]/5 px-2.5 py-1.5 animate-slide-down">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-[#8B7D3C] text-white text-[8px] font-bold">{selectedDisplay.size}</div>
                <span className="text-[9px] font-semibold text-[#8B7D3C]">{[...selectedDisplay].sort((a,b)=> (a==="1X"? 1 : parseInt(a)) - (b==="1X"?1:parseInt(b))).join(", ")}</span>
              </div>
              <p className="text-sm font-extrabold text-[#8B7D3C]">{money(total)}</p>
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

        <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-[var(--scl-border)] bg-[var(--scl-card)] px-3 py-1.5 shadow-[0_-4px_8px_rgba(0,0,0,0.03)] md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B7D3C]">{selectedDisplay.size} seat{(selectedDisplay.size) !== 1 ? "s" : ""} · {money(total)}</span>
            <button disabled={selectedDisplay.size === 0} onClick={handleContinue} className={`rounded-lg px-4 py-1.5 text-xs font-bold shadow-sm transition-all ${selectedDisplay.size > 0 ? "bg-gradient-to-r from-[#B8A94E] to-[#8B7D3C] text-white active:scale-[0.98]" : "cursor-not-allowed bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)]"}`}>
              Continue →
            </button>
          </div>
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
