import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { money, timeOf } from "@/lib/utils";
import { useHaptic, useCountdown } from "@/lib/hooks";
import { playClick, playSuccess } from "@/lib/sounds";
import { SkeletonCard } from "@/components/SkeletonLoader";
import * as I from "@/icons";
import type { SearchResult } from "@/types";

function NextDeparture({ scheduledAt }: { scheduledAt: string }) {
  const { hours, minutes, expired } = useCountdown(scheduledAt);
  if (expired) return <span className="text-xs font-bold text-[#8B7D3C]">Departing now</span>;
  return (
    <span className="text-xs font-bold text-[#8B7D3C]">
      In {hours > 0 ? `${hours}h ` : ""}{minutes}m
    </span>
  );
}

export default function ResultsView() {
  const navigate = useNavigate();
  const { searchParams, allTrips, tickets, stations, routeStops, saccosMap, selectTrip, updateDate, addFavorite, isFavorite, showToast } = useBooking();
  const haptic = useHaptic();

  const results = useMemo<SearchResult[]>(() => {
    if (!searchParams) return [];
    const originStation = stations.find((s) => s.name.toLowerCase().includes(searchParams.origin.toLowerCase()));
    const destStation = stations.find((s) => s.name.toLowerCase().includes(searchParams.destination.toLowerCase()));

    const now = new Date();
    return allTrips
      .filter((t) => (t.status === "scheduled" || t.status === "boarding") && new Date(t.scheduled_at) > now)
      .map((trip) => {
        const route = trip.routes;
        const vehicle = trip.vehicles;
        const capacity = vehicle?.capacity ?? 14;
        const soldCount = tickets.filter((tk) => tk.trip_id === trip.id).length;
        let fare = route?.standard_fare ?? 0;
        let routePasses = false;
        if (originStation && destStation && route) {
          const stops = routeStops.filter((rs) => rs.route_id === route.id).sort((a, b) => a.sequence_no - b.sequence_no);
          const origIdx = stops.findIndex((s) => s.station_id === originStation.id);
          const destIdx = stops.findIndex((s) => s.station_id === destStation.id);
          if (origIdx >= 0 && destIdx >= 0 && destIdx > origIdx) {
            routePasses = true;
            const origCum = stops[origIdx]?.cumulative_fare ?? 0;
            const destCum = stops[destIdx]?.cumulative_fare ?? 0;
            fare = destCum - origCum;
          }
        }
        return {
          trip, departure: timeOf(trip.scheduled_at), arrival: "—",
          availableSeats: capacity - soldCount, vehicleType: `${capacity}-Seater`,
          plate: vehicle?.plate ?? "—",
          saccoName: (trip.sacco_id && saccosMap.get(trip.sacco_id)) || "—",
          price: fare, routePasses,
        };
      })
      .filter((sr) => sr.routePasses && sr.price > 0 && sr.availableSeats > 0);
  }, [allTrips, tickets, stations, routeStops, saccosMap, searchParams]);

  if (!searchParams) return null;

  const currDate = new Date(searchParams.date);
  const prevDate = new Date(currDate); prevDate.setDate(currDate.getDate() - 1);
  const nextDate = new Date(currDate); nextDate.setDate(currDate.getDate() + 1);
  const fmtDate = (d: Date) => d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  const handleDateChange = (d: Date) => { haptic("tap"); playClick(); updateDate(toISODate(d)); };

  const handleSelect = useCallback((sr: SearchResult) => {
    haptic("tap");
    playClick();
    addFavorite(searchParams.origin, searchParams.destination);
    selectTrip(sr);
    navigate("/select-seats");
  }, [haptic, addFavorite, searchParams, selectTrip, navigate]);

  const toggleFav = useCallback(() => {
    haptic("tap");
    if (isFavorite(searchParams.origin, searchParams.destination)) {
      showToast("Route removed from favorites", "info");
    } else {
      addFavorite(searchParams.origin, searchParams.destination);
      playSuccess();
      showToast("Route saved to favorites!", "success");
    }
  }, [haptic, isFavorite, addFavorite, searchParams, showToast]);

  return (
    <div className="min-h-screen animate-fade-in bg-[var(--scl-surface-alt)] pb-20">
      {/* Header */}
      <div className="border-b border-[var(--scl-border)] bg-[var(--scl-card)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:py-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="haptic-tap flex h-10 w-10 items-center justify-center rounded-full bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:bg-[var(--scl-border)]">
              <I.ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[var(--scl-text)] md:text-xl">
                  {searchParams.origin}
                </h2>
                <I.ArrowRight className="h-4 w-4 text-[#8B7D3C]" />
                <h2 className="text-lg font-extrabold text-[var(--scl-text)] md:text-xl">
                  {searchParams.destination}
                </h2>
              </div>
              <p className="mt-0.5 text-xs font-medium text-[var(--scl-text-secondary)]">{searchParams.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleFav} className="haptic-tap flex h-10 w-10 items-center justify-center rounded-full bg-[var(--scl-surface-alt)] text-[#8B7D3C] transition hover:bg-[#8B7D3C]/10">
              <I.Ticket className="h-5 w-5" />
            </button>
            <button onClick={() => navigate("/")} className="rounded-xl bg-[#8B7D3C]/10 px-4 py-2 text-xs font-bold text-[#8B7D3C] transition hover:bg-[#8B7D3C]/20">
              Modify
            </button>
          </div>
        </div>

        {/* Date nav */}
        <div className="mx-auto flex max-w-7xl overflow-x-auto px-4">
          {[
            { date: prevDate, label: fmtDate(prevDate), active: false },
            { date: currDate, label: fmtDate(currDate), active: true },
            { date: nextDate, label: fmtDate(nextDate), active: false },
          ].map((d) => (
            <button
              key={d.label}
              onClick={() => handleDateChange(d.date)}
              className={`flex-1 whitespace-nowrap px-4 py-3.5 text-center text-sm transition-all ${
                d.active
                  ? "border-b-[3px] border-[#8B7D3C] bg-[#8B7D3C]/5 font-bold text-[#8B7D3C]"
                  : "font-medium text-[var(--scl-text-secondary)] hover:bg-[var(--scl-surface-alt)]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {results.length === 0 ? (
          <div className="flex flex-col items-center rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-12 text-center shadow-[var(--scl-shadow-sm)]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)]">
              <I.Bus className="h-8 w-8" />
            </div>
            <p className="mb-2 text-lg font-bold text-[var(--scl-text)]">No trips found</p>
            <p className="text-sm text-[var(--scl-text-secondary)]">No departures for this route on this date.</p>
            <button onClick={() => navigate("/")} className="mt-6 font-bold text-[#8B7D3C]">Change search</button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">
                {results.length} trip{results.length !== 1 ? "s" : ""} available
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B8A94E] animate-pulse-soft" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B7D3C]">Live</span>
              </div>
            </div>
            <div className="space-y-4">
              {results.map((sr, i) => (
                <div
                  key={sr.trip.id}
                  className="haptic-tap group relative overflow-hidden rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-5 shadow-[var(--scl-shadow-sm)] transition-all duration-300 hover:border-[#8B7D3C]/20 hover:shadow-md md:flex md:flex-row md:justify-between md:gap-6"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Left accent */}
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#B8A94E] to-[#8B7D3C] opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-gray-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white dark:bg-white dark:text-gray-900">
                        {sr.vehicleType}
                      </span>
                      <span className="text-xs font-medium text-[var(--scl-text-secondary)]">
                        {sr.saccoName} · {sr.plate}
                      </span>
                      <NextDeparture scheduledAt={sr.trip.scheduled_at} />
                    </div>
                    <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                      <div>
                        <p className="text-xl font-extrabold text-[var(--scl-text)]">{sr.departure}</p>
                        <p className="mt-0.5 text-xs font-semibold text-[var(--scl-text-secondary)]">{searchParams.origin}</p>
                      </div>
                      <div className="flex flex-col items-center px-2">
                        <div className="relative flex w-full items-center justify-center border-t-2 border-dashed border-[var(--scl-border)]">
                          <div className="absolute rounded-full bg-[var(--scl-card)] px-2 text-[#8B7D3C]"><I.Bus className="h-5 w-5" /></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-[var(--scl-text)]">{sr.arrival}</p>
                        <p className="mt-0.5 text-xs font-semibold text-[var(--scl-text-secondary)]">{searchParams.destination}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row items-center justify-between gap-4 border-t border-[var(--scl-border)] pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">Fare</p>
                      <p className="text-2xl font-extrabold text-[#8B7D3C]">{money(sr.price)}</p>
                      <p className={`mt-1 text-[11px] font-bold ${sr.availableSeats <= 4 ? "rounded-lg bg-red-50 px-2 py-0.5 text-red-500 dark:bg-red-950/50 dark:text-red-400" : "text-[#8B7D3C]"}`}>
                        {sr.availableSeats} seats left
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelect(sr); }}
                      className="rounded-2xl bg-gray-900 px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-black hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-gray-900 md:w-auto"
                    >
                      View Seats
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
