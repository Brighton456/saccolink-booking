import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { today } from "@/lib/utils";
import { useHaptic, useCountdown } from "@/lib/hooks";
import { playClick } from "@/lib/sounds";
import { SkeletonHome } from "@/components/SkeletonLoader";
import * as I from "@/icons";

function AutoDrop({ items, value, onSelect, show }: { items: string[]; value: string; onSelect: (v: string) => void; show: boolean }) {
  if (!show) return null;
  const filtered = items.filter((i) => i.toLowerCase().includes(value.toLowerCase()));
  return (
    <div className="absolute left-0 z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-[var(--scl-border)] bg-[var(--scl-card)] shadow-xl">
      {filtered.length === 0 ? (
        <div className="px-4 py-4 text-sm text-[var(--scl-text-secondary)]">No matches found</div>
      ) : (
        filtered.map((i) => (
          <button
            key={i}
            onMouseDown={() => { onSelect(i); playClick(); }}
            className="flex w-full cursor-pointer items-center gap-3 border-b border-[var(--scl-border)] px-4 py-3.5 text-left text-sm font-medium text-[var(--scl-text)] transition hover:bg-[#8B7D3C]/5 last:border-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B7D3C]/10 text-[#8B7D3C]">
              <I.MapPin className="h-4 w-4" />
            </div>
            {i}
          </button>
        ))
      )}
    </div>
  );
}

function TripCountdown() {
  const target = new Date();
  target.setHours(18, 0, 0, 0);
  if (target.getTime() < Date.now()) target.setDate(target.getDate() + 1);
  const { hours, minutes, seconds, expired } = useCountdown(target.toISOString());
  if (expired) return null;

  return (
    <div className="mx-auto mb-8 flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl border border-[#8B7D3C]/20 bg-[#8B7D3C]/5 px-6 py-4">
      <I.Calendar className="h-5 w-5 text-[#8B7D3C]" />
      <span className="text-sm font-semibold text-[var(--scl-text-secondary)]">Next departure in</span>
      <div className="flex items-center gap-1">
        {[
          { val: hours, label: "h" },
          { val: minutes, label: "m" },
          { val: seconds, label: "s" },
        ].map(({ val, label }) => (
          <span key={label} className="rounded-lg bg-[#8B7D3C] px-2 py-1 text-xs font-bold text-white tabular-nums">
            {String(val).padStart(2, "0")}{label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HomeView() {
  const navigate = useNavigate();
  const { stations, allRoutes, loading, handleSearch, favoriteRoutes, showToast } = useBooking();
  const haptic = useHaptic();
  const [activeTab, setActiveTab] = useState<"shuttle" | "parcel">("shuttle");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(today());
  const [error, setError] = useState("");
  const [showOriginDrop, setShowOriginDrop] = useState(false);
  const [showDestDrop, setShowDestDrop] = useState(false);

  const names = useMemo(() => {
    const stationNames = stations.map((s) => s.name);
    const routeNames = allRoutes
      .filter((r) => r.origin && r.destination)
      .map((r) => `${r.origin} → ${r.destination}`);
    return [...new Set([...routeNames, ...stationNames])].sort();
  }, [stations, allRoutes]);
  const filteredOrigin = useMemo(() => names.filter((n) => n.toLowerCase().includes(origin.toLowerCase())), [names, origin]);
  const filteredDest = useMemo(() => names.filter((n) => n.toLowerCase().includes(destination.toLowerCase())), [names, destination]);

  const swap = useCallback(() => {
    haptic("tap");
    playClick();
    setOrigin(destination);
    setDestination(origin);
  }, [origin, destination, haptic]);

  const search = useCallback(() => {
    if (!origin || !destination || !date) {
      setError("Please fill in all fields");
      haptic("error");
      return;
    }
    haptic("tap");
    playClick();
    setError("");
    handleSearch({ origin, destination, date });
    navigate("/results");
  }, [origin, destination, date, haptic, handleSearch, navigate]);

  const useFavorite = useCallback((fav: { origin: string; destination: string }) => {
    haptic("tap");
    playClick();
    setOrigin(fav.origin);
    setDestination(fav.destination);
  }, [haptic]);

  if (loading) return <SkeletonHome />;

  return (
    <div className="flex min-h-screen flex-col animate-fade-in pb-bottom-nav">
      {/* Hero — Kangaroo Shuttle branded */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a0a] via-[#2d2a14] to-[#1a1a0a] px-4 pt-16 pb-40 md:pt-24 md:pb-48">
        {/* Decorative shapes */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#8B7D3C]/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#B8A94E]/10 blur-2xl" />
        <div className="absolute right-10 top-16 h-2 w-2 rounded-full bg-[#B8A94E] animate-pulse-soft" />
        <div className="absolute left-20 top-24 h-1.5 w-1.5 rounded-full bg-[#8B7D3C] animate-pulse-soft" style={{ animationDelay: "0.5s" }} />

        <div className="relative z-10 mx-auto max-w-7xl text-center">
          <img src="/kangaroo-logo.png" alt="Kangaroo Shuttle" className="mx-auto mb-4 h-20 w-auto md:h-28" />
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B8A94E] animate-pulse-soft" />
            Live Trip Tracking
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            Travel<br className="md:hidden" /> <span className="bg-gradient-to-r from-[#B8A94E] to-[#d4c85a] bg-clip-text text-transparent">Comfortably.</span>
          </h1>
          <p className="mx-auto max-w-lg text-base font-medium text-white/60 md:text-lg">
            Book your seat online. No queues, no hassle.
          </p>
        </div>
      </div>

      {/* Search Widget — Floating card */}
      <div className="relative z-20 mx-auto -mt-32 mb-8 w-full max-w-5xl px-4 md:-mt-28">
        <div className="overflow-hidden rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] shadow-xl">
          {/* Tabs */}
          <div className="flex border-b border-[var(--scl-border)]">
            {[
              { key: "shuttle" as const, label: "Book a Trip", icon: I.Bus },
              { key: "parcel" as const, label: "Send Parcel", icon: I.Package },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); haptic("tap"); }}
                className={`flex flex-1 items-center justify-center gap-2 py-4 text-center text-sm font-bold transition-all md:py-5 md:text-base ${
                  activeTab === key
                    ? "border-b-[3px] border-[#8B7D3C] bg-[var(--scl-card)] text-[#8B7D3C]"
                    : "text-[var(--scl-text-secondary)] hover:bg-[var(--scl-surface-alt)]"
                }`}
              >
                <Icon className="h-5 w-5" /> {label}
              </button>
            ))}
          </div>

          <div className="p-5 md:p-8">
            {activeTab === "shuttle" ? (
              <div className="space-y-4">
                {error && (
                  <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-600 animate-slide-down dark:border-red-900/30 dark:bg-red-950/50 dark:text-red-400">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                      <I.Shield className="h-4 w-4" />
                    </div>
                    {error}
                  </div>
                )}

                <div className="flex flex-col items-center gap-3 md:flex-row">
                  {/* From */}
                  <div className="relative w-full md:w-1/3">
                    <label className="mb-1.5 ml-1 block text-xs font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">From</label>
                    <div className="flex items-center rounded-2xl border-2 border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-4 py-3.5 transition-all hover:border-[#8B7D3C]/50 focus-within:border-[#8B7D3C] focus-within:bg-[var(--scl-card)] focus-within:shadow-md focus-within:shadow-[#8B7D3C]/5">
                      <span className="text-[#8B7D3C]"><I.MapPin className="h-5 w-5" /></span>
                      <input
                        type="text"
                        placeholder="Origin station..."
                        className="ml-3 w-full bg-transparent text-lg font-semibold text-[var(--scl-text)] outline-none placeholder-[var(--scl-text-secondary)]/50"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        onFocus={() => setShowOriginDrop(true)}
                        onBlur={() => setTimeout(() => setShowOriginDrop(false), 200)}
                      />
                    </div>
                    <AutoDrop items={filteredOrigin} value={origin} onSelect={(v) => {
                      if (v.includes(" → ")) {
                        const [o, d] = v.split(" → ");
                        setOrigin(o?.trim() ?? "");
                        setDestination(d?.trim() ?? "");
                      } else {
                        setOrigin(v);
                      }
                      setShowOriginDrop(false);
                    }} show={showOriginDrop} />
                  </div>

                  {/* Swap button */}
                  <button
                    onClick={swap}
                    className="haptic-tap flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#8B7D3C]/20 bg-[#8B7D3C]/5 text-[#8B7D3C] transition-all hover:bg-[#8B7D3C] hover:text-white hover:shadow-lg hover:shadow-[#8B7D3C]/20 md:mt-6"
                  >
                    <I.Swap className="h-5 w-5" />
                  </button>

                  {/* To */}
                  <div className="relative w-full md:w-1/3">
                    <label className="mb-1.5 ml-1 block text-xs font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">To</label>
                    <div className="flex items-center rounded-2xl border-2 border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-4 py-3.5 transition-all hover:border-[#8B7D3C]/50 focus-within:border-[#8B7D3C] focus-within:bg-[var(--scl-card)] focus-within:shadow-md focus-within:shadow-[#8B7D3C]/5">
                      <span className="text-[#8B7D3C]"><I.MapPin className="h-5 w-5" /></span>
                      <input
                        type="text"
                        placeholder="Destination..."
                        className="ml-3 w-full bg-transparent text-lg font-semibold text-[var(--scl-text)] outline-none placeholder-[var(--scl-text-secondary)]/50"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        onFocus={() => setShowDestDrop(true)}
                        onBlur={() => setTimeout(() => setShowDestDrop(false), 200)}
                      />
                    </div>
                    <AutoDrop items={filteredDest} value={destination} onSelect={(v) => {
                      if (v.includes(" → ")) {
                        const [o, d] = v.split(" → ");
                        setOrigin(o?.trim() ?? "");
                        setDestination(d?.trim() ?? "");
                      } else {
                        setDestination(v);
                      }
                      setShowDestDrop(false);
                    }} show={showDestDrop} />
                  </div>

                  {/* Date */}
                  <div className="w-full md:w-1/4">
                    <label className="mb-1.5 ml-1 block text-xs font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">Date</label>
                    <div className="flex items-center rounded-2xl border-2 border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-4 py-3.5 transition-all hover:border-[#8B7D3C]/50 focus-within:border-[#8B7D3C] focus-within:bg-[var(--scl-card)]">
                      <span className="text-[#8B7D3C]"><I.Calendar className="h-5 w-5" /></span>
                      <input
                        type="date"
                        className="ml-3 w-full cursor-pointer bg-transparent text-lg font-semibold text-[var(--scl-text)] outline-none"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={today()}
                      />
                    </div>
                  </div>

                  {/* Search CTA */}
                  <div className="w-full md:w-auto md:mt-6">
                    <button
                      onClick={search}
                      className="haptic-tap w-full rounded-2xl bg-gradient-to-r from-[#8B7D3C] to-[#B8A94E] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-[#8B7D3C]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#8B7D3C]/30 active:scale-[0.98] md:w-auto"
                    >
                      Find Seats
                    </button>
                  </div>
                </div>

                {/* Favorite routes */}
                {favoriteRoutes.length > 0 && (
                  <div className="pt-2">
                    <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">
                      <I.Ticket className="mr-1 inline h-3.5 w-3.5" /> Recent Routes
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {favoriteRoutes.map((fav, i) => (
                        <button
                          key={`${fav.origin}-${fav.destination}-${i}`}
                          onClick={() => useFavorite(fav)}
                          className="haptic-tap shrink-0 rounded-xl border border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-4 py-2.5 text-xs font-semibold text-[var(--scl-text)] transition hover:border-[#8B7D3C]/30 hover:bg-[#8B7D3C]/5"
                        >
                          {fav.origin} → {fav.destination}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8B7D3C]/10 text-[#8B7D3C]">
                  <I.Package className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-[var(--scl-text)]">Parcel Tracking</h3>
                <p className="mx-auto mb-6 max-w-md text-sm text-[var(--scl-text-secondary)]">
                  Send items securely. Online parcel booking is coming soon.
                </p>
                <div className="mx-auto flex max-w-sm overflow-hidden rounded-2xl border-2 border-[var(--scl-border)] focus-within:border-[#8B7D3C]">
                  <input type="text" placeholder="Enter tracking code..." className="flex-1 bg-transparent px-4 py-3 text-sm font-medium outline-none" />
                  <button className="bg-gray-900 px-6 font-bold text-white transition hover:bg-black dark:bg-white dark:text-gray-900">Track</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Browse All Trips CTA */}
      <div className="mx-auto mb-6 w-full max-w-5xl px-4">
        <button
          onClick={() => { haptic("tap"); playClick(); navigate("/all-trips"); }}
          className="haptic-tap w-full rounded-2xl border-2 border-dashed border-[#8B7D3C]/30 bg-[#8B7D3C]/5 py-4 text-center transition-all hover:border-[#8B7D3C]/60 hover:bg-[#8B7D3C]/10"
        >
          <div className="flex items-center justify-center gap-3">
            <I.Bus className="h-5 w-5 text-[#8B7D3C]" />
            <span className="text-sm font-bold text-[#8B7D3C]">Browse All Available Trips</span>
            <I.ArrowRight className="h-4 w-4 text-[#8B7D3C]" />
          </div>
          <p className="mt-1 text-xs text-[var(--scl-text-secondary)]">See every departure across all routes</p>
        </button>
      </div>

      {/* Trip Countdown */}
      <TripCountdown />

      {/* Value Props — Premium cards */}
      <div className="w-full px-4 py-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-extrabold text-[var(--scl-text)] md:text-3xl">Why Book Online?</h2>
            <p className="mt-2 text-sm text-[var(--scl-text-secondary)]">Fast, secure, and no queueing at the stage.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { icon: <I.Wifi className="h-6 w-6" />, title: "Pick Your Seat", desc: "See the seat map in real time. Choose where you sit.", color: "from-blue-500 to-blue-600" },
              { icon: <I.Shield className="h-6 w-6" />, title: "Secure Payment", desc: "Pay with M-Pesa directly from your phone.", color: "from-[#8B7D3C] to-[#B8A94E]" },
              { icon: <I.Phone className="h-6 w-6" />, title: "Instant Ticket", desc: "Digital boarding pass — show it to the conductor.", color: "from-purple-500 to-purple-600" },
            ].map((item, i) => (
              <div
                key={i}
                className="haptic-tap group rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-7 text-center shadow-[var(--scl-shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  {item.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-[var(--scl-text)]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--scl-text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
