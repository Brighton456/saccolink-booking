import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { money, timeOf, today } from "@/lib/utils";
import { useHaptic } from "@/lib/hooks";
import { playClick, playSuccess } from "@/lib/sounds";
import * as I from "@/icons";
import type { SearchResult } from "@/types";

export default function AllTripsView() {
  const navigate = useNavigate();
  const { allTrips, tickets, stations, routeStops, saccosMap, selectTrip, addFavorite } = useBooking();
  const haptic = useHaptic();
  const [routeFilter, setRouteFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(today());

  const allRouteNames = useMemo(() => {
    const routes = new Map<string, string>();
    allTrips.forEach((t) => {
      if (t.routes?.origin && t.routes?.destination) {
        const key = `${t.routes.origin} → ${t.routes.destination}`;
        routes.set(key, t.route_id);
      }
    });
    return Array.from(routes.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allTrips]);

  const results = useMemo<SearchResult[]>(() => {
    const now = new Date();
    return allTrips
      .filter((t) => {
        if (t.status !== "scheduled" && t.status !== "boarding") return false;
        const tripDate = t.scheduled_at.slice(0, 10);
        if (tripDate !== dateFilter) return false;
        if (routeFilter !== "all" && t.route_id !== routeFilter) return false;
        // Filter out past trips
        const tripTime = new Date(t.scheduled_at);
        if (tripTime < now) return false;
        return true;
      })
      .map((trip) => {
        const route = trip.routes;
        const vehicle = trip.vehicles;
        const capacity = vehicle?.capacity ?? 14;
        const soldCount = tickets.filter((tk) => tk.trip_id === trip.id).length;
        const fare = route?.standard_fare ?? 0;
        const originStation = stations.find((s) => s.name.toLowerCase() === (route?.origin ?? "").toLowerCase());
        const destStation = stations.find((s) => s.name.toLowerCase() === (route?.destination ?? "").toLowerCase());
        let segmentFare = fare;
        if (originStation && destStation && route) {
          const stops = routeStops.filter((rs) => rs.route_id === route.id).sort((a, b) => a.sequence_no - b.sequence_no);
          const origIdx = stops.findIndex((s) => s.station_id === originStation.id);
          const destIdx = stops.findIndex((s) => s.station_id === destStation.id);
          if (origIdx >= 0 && destIdx >= 0 && destIdx > origIdx) {
            segmentFare = (stops[destIdx]?.cumulative_fare ?? 0) - (stops[origIdx]?.cumulative_fare ?? 0);
          }
        }
        return {
          trip,
          departure: timeOf(trip.scheduled_at),
          arrival: "—",
          availableSeats: capacity - soldCount,
          vehicleType: `${capacity}-Seater`,
          plate: vehicle?.plate ?? "—",
          saccoName: (trip.sacco_id && saccosMap.get(trip.sacco_id)) || "Kangaroo Shuttle",
          price: segmentFare,
          routePasses: true,
        };
      })
      .filter((sr) => sr.availableSeats > 0 && sr.price > 0)
      .sort((a, b) => a.departure.localeCompare(b.departure));
  }, [allTrips, tickets, stations, routeStops, saccosMap, routeFilter, dateFilter]);

  const handleSelect = (sr: SearchResult) => {
    haptic("tap");
    playClick();
    addFavorite(
      sr.trip.routes?.origin ?? "",
      sr.trip.routes?.destination ?? ""
    );
    selectTrip(sr);
    navigate("/select-seats");
  };

  const formatDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen animate-fade-in bg-[var(--scl-surface-alt)] pb-20">
      {/* Header */}
      <div className="border-b border-[var(--scl-border)] bg-[var(--scl-card)]">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/")} className="haptic-tap flex h-10 w-10 items-center justify-center rounded-full bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:bg-[var(--scl-border)]">
              <I.ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-[var(--scl-text)]">All Available Trips</h1>
              <p className="text-xs font-medium text-[var(--scl-text-secondary)]">{results.length} trips found</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex-1">
              <select
                value={routeFilter}
                onChange={(e) => { setRouteFilter(e.target.value); haptic("tap"); }}
                className="w-full rounded-xl border-2 border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-4 py-2.5 text-sm font-semibold text-[var(--scl-text)] outline-none focus:border-[#16a34a]"
              >
                <option value="all">All Routes</option>
                {allRouteNames.map(([name, id]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-xl border-2 border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-4 py-2.5">
              <I.Calendar className="h-4 w-4 text-[#16a34a]" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); haptic("tap"); }}
                min={today()}
                className="cursor-pointer bg-transparent text-sm font-semibold text-[var(--scl-text)] outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trip cards */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {results.length === 0 ? (
          <div className="flex flex-col items-center rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-12 text-center shadow-[var(--scl-shadow-sm)]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)]">
              <I.Bus className="h-8 w-8" />
            </div>
            <p className="mb-2 text-lg font-bold text-[var(--scl-text)]">No trips available</p>
            <p className="text-sm text-[var(--scl-text-secondary)]">Try a different date or route filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((sr, i) => (
              <div
                key={sr.trip.id}
                className="haptic-tap group relative overflow-hidden rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-5 shadow-[var(--scl-shadow-sm)] transition-all duration-300 hover:border-[#16a34a]/20 hover:shadow-md"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => handleSelect(sr)}
              >
                {/* Route badge */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-lg bg-[#16a34a]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#16a34a]">
                    {sr.routePasses ? sr.vehicleType : ""}
                  </span>
                  <span className={`text-[11px] font-bold ${sr.availableSeats <= 4 ? "text-red-500" : "text-[#16a34a]"}`}>
                    {sr.availableSeats} seats
                  </span>
                </div>

                {/* Route */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-[var(--scl-text)]">{sr.departure}</p>
                    <p className="text-xs font-semibold text-[var(--scl-text-secondary)]">{sr.trip.routes?.origin ?? "—"}</p>
                  </div>
                  <div className="flex flex-1 items-center justify-center">
                    <div className="h-px flex-1 bg-[var(--scl-border)]" />
                    <div className="mx-2 rounded-full bg-[#16a34a]/10 p-1.5 text-[#16a34a]">
                      <I.Bus className="h-4 w-4" />
                    </div>
                    <div className="h-px flex-1 bg-[var(--scl-border)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-[var(--scl-text)]">{sr.arrival}</p>
                    <p className="text-xs font-semibold text-[var(--scl-text-secondary)]">{sr.trip.routes?.destination ?? "—"}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-center justify-between border-t border-[var(--scl-border)] pt-3">
                  <div>
                    <p className="text-xs text-[var(--scl-text-secondary)]">{sr.saccoName} · {sr.plate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-[#16a34a]">{money(sr.price)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
