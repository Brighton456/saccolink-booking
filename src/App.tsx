import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */
type View = "HOME" | "RESULTS" | "SEATS" | "CHECKOUT" | "TICKET";

interface Station { id: string; name: string; }
interface RouteRow { id: string; name: string; standard_fare: number; origin_station_id?: string; destination_station_id?: string; }
interface Vehicle { id: string; plate: string; capacity: number; }
interface Driver { id: string; full_name: string; }
interface SaccoRow { id: string; name: string; }
interface TripRow {
  id: string; scheduled_at: string; status: string; station_id: string;
  route_id: string; vehicle_id: string; driver_id: string; sacco_id?: string | null;
  routes?: RouteRow; vehicles?: Vehicle; drivers?: Driver; saccos?: SaccoRow;
}
interface TicketRow {
  id: string; trip_id: string; seat_no: number; passenger_name: string;
  passenger_phone: string | null; fare: number; payment_method: string;
  receipt_code: string; created_at: string;
  boarding_station_id?: string | null; destination_station_id?: string | null;
}
interface RouteStop { id: string; route_id: string; station_id: string; sequence_no: number; segment_fare: number; cumulative_fare: number; stations?: Station; }
interface SearchResult {
  trip: TripRow; departure: string; arrival: string; availableSeats: number;
  vehicleType: string; plate: string; saccoName: string; price: number;
  routePasses: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════
   ICONS (inline SVGs — no external deps)
   ═══════════════════════════════════════════════════════════════════════ */
const I = {
  Bus: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>,
  MapPin: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Calendar: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>,
  ArrowRight: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  ArrowLeft: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
  Swap: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 4v16"/><path d="m21 8-4-4-4 4"/><path d="M7 20V4"/><path d="m3 16 4 4 4-4"/></svg>,
  Check: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Steering: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2.6 9h18.8"/><path d="M2.6 15h18.8"/></svg>,
  Shield: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Phone: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>,
  Wifi: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  Package: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  Headphones: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>,
  Loader: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>,
  Menu: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  X: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Ticket: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>,
  QrCode: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1a2 2 0 0 1 2 2v.01"/><path d="M12 21v-1"/></svg>,
};

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */
const money = (n: number) => `KES ${n.toLocaleString()}`;
const timeOf = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true });
};
const today = () => new Date().toISOString().slice(0, 10);

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
function App() {
  const [view, setView] = useState<View>("HOME");
  const [searchParams, setSearchParams] = useState<{ origin: string; destination: string; date: string } | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<SearchResult | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);

  /* Data from Supabase */
  const [stations, setStations] = useState<Station[]>([]);
  const [allTrips, setAllTrips] = useState<TripRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [saccosMap, setSaccosMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  /* Fetch all public data on mount */
  useEffect(() => {
    (async () => {
      const sRes = await supabase.from("stations").select("id, name").order("name");
      setStations((sRes.data as Station[]) ?? []);
      const tRes = await supabase.from("trips").select("*, routes(*), vehicles(*), drivers(*), saccos(id, name)").gte("scheduled_at", today()).lte("scheduled_at", today() + "T23:59:59").order("scheduled_at");
      const tripData = (tRes.data as TripRow[]) ?? [];
      setAllTrips(tripData);
      const smap = new Map<string, string>();
      for (const t of tripData) {
        if ((t as any).saccos?.name && t.sacco_id) smap.set(t.sacco_id, (t as any).saccos.name);
      }
      if (smap.size === 0) {
        const sacRes = await supabase.from("saccos" as any).select("id, name" as any);
        for (const s of (sacRes.data ?? []) as any[]) smap.set(s.id, s.name);
      }
      setSaccosMap(smap);
      // Fetch route_stops via direct REST (table not in generated types)
      const mpesaUrl = import.meta.env["VITE_SUPABASE_URL"] as string;
      const mpesaKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;
      try {
        const rsRes = await fetch(`${mpesaUrl}/rest/v1/route_stops?select=*,stations(id,name)&order=sequence_no`, {
          headers: { apikey: mpesaKey, Authorization: `Bearer ${mpesaKey}` },
        });
        if (rsRes.ok) setRouteStops((await rsRes.json()) as RouteStop[]);
      } catch { /* ignore */ }
      if (tripData.length > 0) {
        const { data: tkData } = await supabase.from("tickets").select("id, trip_id, seat_no").in("trip_id", tripData.map((t) => t.id));
        setTickets((tkData as TicketRow[]) ?? []);
      }
      setLoading(false);
    })();
  }, []);

  /* Navigate */
  const go = useCallback((v: View) => { setView(v); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  /* Search */
  const handleSearch = (params: { origin: string; destination: string; date: string }) => {
    setSearchParams(params);
    go("RESULTS");
  };

  /* Select trip */
  const selectTrip = (sr: SearchResult) => {
    setSelectedTrip(sr);
    supabase.from("tickets").select("id, trip_id, seat_no").eq("trip_id", sr.trip.id).then(({ data }) => {
      setTickets((data as TicketRow[]) ?? []);
    });
    go("SEATS");
  };

  /* Confirm seats → checkout */
  const confirmSeats = (seats: number[]) => {
    setSelectedSeats(seats);
    go("CHECKOUT");
  };

  /* Booking complete */
  const completeBooking = (b: Record<string, unknown>) => {
    setBooking(b);
    go("TICKET");
  };

  /* Reset to home */
  const goHome = () => {
    setSearchParams(null);
    setSelectedTrip(null);
    setSelectedSeats([]);
    setBooking(null);
    setView("HOME");
    go("HOME");
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <TopNav view={view} onNav={(v) => { if (v === "BACK") { if (view === "RESULTS") goHome(); else if (view === "SEATS") go("RESULTS"); else if (view === "CHECKOUT") go("SEATS"); } else goHome(); }} />
      <main className="flex-1 flex flex-col">
        {view === "HOME" && <HomeView stations={stations} onSearch={handleSearch} loading={loading} />}
        {view === "RESULTS" && searchParams && (
          <ResultsView params={searchParams} allTrips={allTrips} tickets={tickets} stations={stations} routeStops={routeStops} saccosMap={saccosMap} onSelect={selectTrip} onBack={() => go("HOME")} />
        )}
        {view === "SEATS" && selectedTrip && (
          <SeatsView result={selectedTrip} tickets={tickets} onConfirm={confirmSeats} onBack={() => go("RESULTS")} />
        )}
        {view === "CHECKOUT" && selectedTrip && (
          <CheckoutView result={selectedTrip} seats={selectedSeats} onComplete={completeBooking} onBack={() => go("SEATS")} />
        )}
        {view === "TICKET" && booking && (
          <TicketView booking={booking} onHome={goHome} />
        )}
      </main>
      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TOP NAV
   ═══════════════════════════════════════════════════════════════════════ */
function TopNav({ view, onNav }: { view: View; onNav: (v: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex cursor-pointer items-center" onClick={() => onNav("HOME")}>
          <div className="mr-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#16a34a] text-lg font-bold text-white shadow-sm">S</div>
          <span className="text-2xl font-extrabold tracking-tight text-gray-900">Sacco<span className="text-[#16a34a]">Link</span></span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <button onClick={() => onNav("HOME")} className={`font-semibold transition ${view === "HOME" ? "border-b-2 border-[#16a34a] pb-1 text-[#16a34a]" : "text-gray-500 hover:text-[#16a34a]"}`}>Trips</button>
          <button className="font-medium text-gray-500 transition hover:text-[#16a34a]">Parcels</button>
          <button className="font-medium text-gray-500 transition hover:text-[#16a34a]">Help</button>
        </div>
        <div className="flex items-center gap-3 md:hidden">
          {view !== "HOME" && view !== "TICKET" && (
            <button onClick={() => onNav("BACK")} className="rounded-full bg-gray-100 p-2 text-gray-500 transition hover:bg-gray-200"><I.ArrowLeft className="h-5 w-5" /></button>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-700 focus:outline-none">{menuOpen ? <I.X className="h-6 w-6" /> : <I.Menu className="h-6 w-6" />}</button>
        </div>
      </div>
      {menuOpen && (
        <div className="absolute left-0 top-16 z-40 w-full animate-slide-down border-b border-gray-100 bg-white shadow-xl md:hidden">
          <div className="space-y-2 px-4 pb-6 pt-2">
            {["Trips", "Parcels", "Help"].map((n) => (
              <button key={n} onClick={() => { setMenuOpen(false); if (n === "Trips") onNav("HOME"); }} className="w-full rounded-xl px-4 py-3 text-left text-base font-medium text-gray-700 transition hover:bg-green-50 hover:text-[#16a34a]">{n}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HOME VIEW
   ═══════════════════════════════════════════════════════════════════════ */
function HomeView({ stations, onSearch, loading }: { stations: Station[]; onSearch: (p: { origin: string; destination: string; date: string }) => void; loading: boolean }) {
  const [activeTab, setActiveTab] = useState<"shuttle" | "parcel">("shuttle");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(today());
  const [error, setError] = useState("");
  const [showOriginDrop, setShowOriginDrop] = useState(false);
  const [showDestDrop, setShowDestDrop] = useState(false);

  const names = useMemo(() => stations.map((s) => s.name).sort(), [stations]);
  const filteredOrigin = useMemo(() => names.filter((n) => n.toLowerCase().includes(origin.toLowerCase())), [names, origin]);
  const filteredDest = useMemo(() => names.filter((n) => n.toLowerCase().includes(destination.toLowerCase())), [names, destination]);

  const swap = () => { setOrigin(destination); setDestination(origin); };
  const search = () => {
    if (!origin || !destination || !date) { setError("Please fill in all fields"); return; }
    setError("");
    onSearch({ origin, destination, date });
  };

  const AutoDrop = ({ items, value, onSelect, show }: { items: string[]; value: string; onSelect: (v: string) => void; show: boolean }) => {
    if (!show) return null;
    const filtered = items.filter((i) => i.toLowerCase().includes(value.toLowerCase()));
    return (
      <div className="absolute left-0 z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
        {filtered.length === 0 ? <div className="px-4 py-3 text-sm text-gray-500">No matches</div> : filtered.map((i) => (
          <div key={i} onMouseDown={() => onSelect(i)} className="flex cursor-pointer items-center gap-3 border-b border-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-green-50 hover:text-[#16a34a] last:border-0">
            <I.MapPin className="h-4 w-4" /> {i}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col animate-fade-in">
      {/* Hero */}
      <div className="relative bg-cover bg-center px-4 pt-24 pb-36 md:pt-36 md:pb-52" style={{ backgroundImage: "linear-gradient(rgba(17,24,39,0.75),rgba(17,24,39,0.85)),url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop')" }}>
        <div className="relative z-10 mx-auto max-w-7xl text-center">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white drop-shadow-xl md:text-6xl">
            Travel Comfortable,<br className="md:hidden" /> <span className="text-[#22c55e]">Arrive Rested.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg font-medium text-gray-200 drop-shadow-md md:text-2xl">
            Book your seat online. Fast, safe, and convenient.
          </p>
        </div>
      </div>

      {/* Search Widget */}
      <div className="relative z-20 mx-auto -mt-24 mb-16 w-full max-w-5xl px-4 md:-mt-20">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)]">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button onClick={() => setActiveTab("shuttle")} className={`flex flex-1 items-center justify-center gap-2 py-4 text-center text-sm font-bold transition md:py-5 md:text-base ${activeTab === "shuttle" ? "border-b-2 border-[#16a34a] bg-white text-[#16a34a]" : "bg-gray-50 text-gray-500 hover:bg-white"}`}><I.Bus className="h-5 w-5" /> Book a Trip</button>
            <button onClick={() => setActiveTab("parcel")} className={`flex flex-1 items-center justify-center gap-2 py-4 text-center text-sm font-bold transition md:py-5 md:text-base ${activeTab === "parcel" ? "border-b-2 border-[#16a34a] bg-white text-[#16a34a]" : "bg-gray-50 text-gray-500 hover:bg-white"}`}><I.Package className="h-5 w-5" /> Send Parcel</button>
          </div>

          <div className="p-5 md:p-8">
            {activeTab === "shuttle" ? (
              <div className="space-y-4">
                {error && <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 animate-slide-down"><I.Shield className="h-4 w-4" /> {error}</div>}
                <div className="flex flex-col items-center gap-4 md:flex-row">
                  {/* From */}
                  <div className="relative w-full md:w-1/3">
                    <label className="mb-1 ml-1 block text-xs font-bold uppercase text-gray-500">From</label>
                    <div className="flex items-center rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3.5 transition-colors hover:border-[#16a34a] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#16a34a]/20">
                      <span className="text-[#16a34a]"><I.MapPin className="h-5 w-5" /></span>
                      <input type="text" placeholder="Origin station..." className="ml-3 w-full bg-transparent text-lg font-semibold text-gray-800 outline-none placeholder-gray-400" value={origin} onChange={(e) => setOrigin(e.target.value)} onFocus={() => setShowOriginDrop(true)} onBlur={() => setTimeout(() => setShowOriginDrop(false), 200)} />
                    </div>
                    <AutoDrop items={filteredOrigin} value={origin} onSelect={(v) => { setOrigin(v); setShowOriginDrop(false); }} show={showOriginDrop} />
                  </div>

                  <button onClick={swap} className="rounded-full border border-[#16a34a]/20 bg-green-50 p-3 text-[#16a34a] shadow-sm transition hover:bg-[#16a34a] hover:text-white md:mt-5">
                    <I.Swap className="h-6 w-6" />
                  </button>

                  {/* To */}
                  <div className="relative w-full md:w-1/3">
                    <label className="mb-1 ml-1 block text-xs font-bold uppercase text-gray-500">To</label>
                    <div className="flex items-center rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3.5 transition-colors hover:border-[#16a34a] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#16a34a]/20">
                      <span className="text-[#16a34a]"><I.MapPin className="h-5 w-5" /></span>
                      <input type="text" placeholder="Destination..." className="ml-3 w-full bg-transparent text-lg font-semibold text-gray-800 outline-none placeholder-gray-400" value={destination} onChange={(e) => setDestination(e.target.value)} onFocus={() => setShowDestDrop(true)} onBlur={() => setTimeout(() => setShowDestDrop(false), 200)} />
                    </div>
                    <AutoDrop items={filteredDest} value={destination} onSelect={(v) => { setDestination(v); setShowDestDrop(false); }} show={showDestDrop} />
                  </div>

                  {/* Date */}
                  <div className="w-full md:w-1/4">
                    <label className="mb-1 ml-1 block text-xs font-bold uppercase text-gray-500">Date</label>
                    <div className="flex items-center rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3.5 transition-colors hover:border-[#16a34a] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#16a34a]/20">
                      <span className="text-[#16a34a]"><I.Calendar className="h-5 w-5" /></span>
                      <input type="date" className="ml-3 w-full cursor-pointer bg-transparent text-lg font-semibold text-gray-800 outline-none" value={date} onChange={(e) => setDate(e.target.value)} min={today()} />
                    </div>
                  </div>

                  {/* Search */}
                  <div className="w-full md:w-auto md:mt-5">
                    <button onClick={search} className="w-full rounded-2xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-green-500/30 transition-all hover:-translate-y-1 hover:from-[#16a34a] hover:to-[#15803d] md:w-auto">
                      Find Seats
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-[#16a34a]"><I.Package className="h-8 w-8" /></div>
                <h3 className="mb-2 text-xl font-bold">Parcel Tracking</h3>
                <p className="mx-auto mb-6 max-w-md text-gray-500">Send items securely. Online parcel booking is coming soon. Visit our offices to send today.</p>
                <div className="mx-auto flex max-w-sm">
                  <input type="text" placeholder="Enter tracking code..." className="flex-1 rounded-l-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#16a34a]" />
                  <button className="rounded-r-2xl bg-gray-900 px-6 font-bold text-white transition hover:bg-black">Track</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Value Props */}
      <div className="w-full py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Why Book Online?</h2>
            <p className="mt-3 text-gray-500">Fast, secure, and no queueing at the stage.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { icon: <I.Wifi className="h-6 w-6" />, title: "Pick Your Seat", desc: "See the seat map in real time. Choose where you want to sit before you even arrive at the stage." },
              { icon: <I.Shield className="h-6 w-6" />, title: "Secure Payment", desc: "Pay with M-Pesa directly from your phone. No cash handling, no confusion." },
              { icon: <I.Phone className="h-6 w-6" />, title: "Instant Ticket", desc: "Get your digital boarding pass immediately. Show it to the conductor — no printing needed." },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-[#16a34a] shadow-sm">{item.icon}</div>
                <h3 className="mb-3 text-xl font-bold text-gray-800">{item.title}</h3>
                <p className="leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <I.Loader className="h-10 w-10 animate-spin text-[#16a34a]" />
            <p className="text-sm font-medium text-gray-500">Loading trips...</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SEARCH RESULTS VIEW
   ═══════════════════════════════════════════════════════════════════════ */
function ResultsView({ params, allTrips, tickets, stations, routeStops, saccosMap, onSelect, onBack }: {
  params: { origin: string; destination: string; date: string };
  allTrips: TripRow[]; tickets: TicketRow[]; stations: Station[]; routeStops: RouteStop[]; saccosMap: Map<string, string>;
  onSelect: (sr: SearchResult) => void; onBack: () => void;
}) {
  const results = useMemo<SearchResult[]>(() => {
    const originStation = stations.find((s) => s.name.toLowerCase().includes(params.origin.toLowerCase()));
    const destStation = stations.find((s) => s.name.toLowerCase().includes(params.destination.toLowerCase()));

    return allTrips
      .filter((t) => t.status === "scheduled" || t.status === "boarding")
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
          plate: vehicle?.plate ?? "—", saccoName: (trip.sacco_id && saccosMap.get(trip.sacco_id)) || "—",
          price: fare, routePasses,
        };
      })
      .filter((sr) => sr.routePasses && sr.price > 0 && sr.availableSeats > 0);
  }, [allTrips, tickets, stations, routeStops, saccosMap, params]);

  const currDate = new Date(params.date);
  const prevDate = new Date(currDate); prevDate.setDate(currDate.getDate() - 1);
  const nextDate = new Date(currDate); nextDate.setDate(currDate.getDate() + 1);
  const fmtDate = (d: Date) => d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="min-h-screen animate-fade-in bg-gray-50 pb-16">
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 py-4 md:flex-row md:items-center md:py-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"><I.ArrowLeft className="h-5 w-5" /></button>
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black text-gray-900 md:text-2xl">
                {params.origin} <span className="text-[#16a34a]"><I.ArrowRight className="h-5 w-5" /></span> {params.destination}
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500">{params.date}</p>
            </div>
          </div>
          <button onClick={onBack} className="w-full rounded-lg bg-green-50 px-4 py-2 text-center text-sm font-bold text-[#16a34a] transition hover:bg-green-100 md:w-auto">Modify Search</button>
        </div>
        <div className="mx-auto flex max-w-7xl overflow-x-auto px-4">
          <button className="flex-1 whitespace-nowrap px-4 py-4 text-center text-sm font-medium text-gray-500 transition hover:bg-gray-50">{fmtDate(prevDate)}</button>
          <button className="flex-1 whitespace-nowrap bg-green-50 px-4 py-4 text-center text-sm font-bold text-gray-900">{fmtDate(currDate)}</button>
          <button className="flex-1 whitespace-nowrap px-4 py-4 text-center text-sm font-medium text-gray-500 transition hover:bg-gray-50">{fmtDate(nextDate)}</button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {results.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400"><I.Bus className="h-8 w-8" /></div>
            <p className="mb-2 text-lg font-bold text-gray-800">No trips found</p>
            <p className="text-gray-500">No departures for this route on the selected date. Try another date.</p>
            <button onClick={onBack} className="mt-6 font-bold text-[#16a34a]">Change search</button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">{results.length} trip{results.length !== 1 ? "s" : ""} available</p>
            <div className="space-y-6">
              {results.map((sr) => (
                <div key={sr.trip.id} className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-card transition-all hover:border-[#16a34a]/30 hover:shadow-lg md:flex md:flex-row md:justify-between md:gap-6">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#22c55e] to-[#16a34a] opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex-1">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="rounded-md bg-gray-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">{sr.vehicleType}</span>
                      <span className="text-sm font-medium text-gray-500">{sr.saccoName} · {sr.plate}</span>
                    </div>
                    <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                      <div className="text-left">
                        <p className="text-2xl font-black text-gray-900">{sr.departure}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-500">{params.origin}</p>
                      </div>
                      <div className="flex flex-col items-center px-2">
                        <div className="flex w-full items-center justify-center border-t-2 border-dashed border-gray-300"><div className="absolute bg-white px-2 text-[#16a34a]"><I.Bus className="h-5 w-5" /></div></div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-gray-900">{sr.arrival}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-500">{params.destination}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Fare</p>
                      <p className="text-2xl font-black text-[#16a34a] md:text-3xl">{money(sr.price)}</p>
                      <p className={`mt-1 text-xs font-bold ${sr.availableSeats <= 4 ? "inline-block rounded-md bg-red-50 px-2 py-1 text-red-500" : "text-green-600"}`}>{sr.availableSeats} seats left</p>
                    </div>
                    <button onClick={() => onSelect(sr)} className="w-full rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-black md:w-auto">
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

/* ═══════════════════════════════════════════════════════════════════════
   SEAT SELECTION VIEW
   ═══════════════════════════════════════════════════════════════════════ */
function SeatsView({ result, tickets, onConfirm, onBack }: {
  result: SearchResult; tickets: TicketRow[]; onConfirm: (seats: number[]) => void; onBack: () => void;
}) {
  const capacity = result.trip.vehicles?.capacity ?? 14;
  const booked = useMemo(() => new Set(tickets.filter((t) => t.trip_id === result.trip.id).map((t) => t.seat_no)), [tickets, result]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (n: number) => {
    if (booked.has(n)) return;
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
    if (selected.has(n)) return base + "border-[#16a34a] bg-[#16a34a] text-white shadow-lg scale-105";
    if (booked.has(n)) return base + "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50";
    return base + "border-gray-300 bg-white text-gray-700 cursor-pointer hover:border-[#16a34a] hover:text-[#16a34a] hover:-translate-y-0.5";
  };

  const total = selected.size * result.price;

  return (
    <div className="min-h-screen animate-fade-in bg-gray-50 pb-32 md:pb-0">
      <div className="sticky top-16 z-40 border-b border-gray-200 bg-white py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <div>
            <h2 className="text-xl font-black text-gray-800 md:text-2xl">Select Seats</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">{result.plate} · {result.departure}</p>
          </div>
          <div className="hidden rounded-xl bg-green-50 px-4 py-2 text-right md:block">
            <p className="text-xs font-bold uppercase tracking-wider text-[#16a34a]">Selected</p>
            <p className="text-xl font-black text-gray-900">{selected.size} Seat{selected.size !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl w-full flex-col gap-8 px-4 py-8 md:flex-row">
        <div className="flex flex-1 flex-col items-center rounded-3xl border border-gray-100 bg-white p-6 shadow-card md:p-10">
          <div className="mb-6 flex w-full max-w-sm justify-between px-4 text-xs font-bold uppercase tracking-wider text-gray-400">
            <span>Front</span><span>Rear</span>
          </div>
          <div className="rounded-[40px_40px_10px_10px] border-4 border-gray-200 bg-white p-[25px_15px_15px_15px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] relative w-full max-w-[320px]">
            <div className="absolute left-[-4px] top-[100px] h-20 w-1 rounded bg-[#16a34a]" />
            <div className="mb-8 flex items-center justify-between px-2">
              <div className="flex gap-2">
                {front.map((n) => <button key={n} onClick={() => toggle(n)} className={seatClass(n)}>{n}</button>)}
              </div>
              <div className="flex h-14 w-12 items-center justify-center text-gray-300"><I.Steering className="h-6 w-6" /></div>
            </div>
            {rows.map((row, ri) => (
              <div key={ri} className="relative mb-5 flex justify-start gap-3 pl-12 px-2">
                {row.map((n) => <button key={n} onClick={() => toggle(n)} className={seatClass(n)}>{n}</button>)}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 rounded-full bg-gray-50 px-6 py-3 text-sm font-bold text-gray-600">
            <div className="flex items-center gap-2"><div className="h-5 w-5 rounded-md border-2 border-gray-300 bg-white" /> Available</div>
            <div className="flex items-center gap-2"><div className="h-5 w-5 rounded-md border-2 border-[#16a34a] bg-[#16a34a]" /> Selected</div>
            <div className="flex items-center gap-2"><div className="h-5 w-5 rounded-md border-2 border-gray-200 bg-gray-200" /> Booked</div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:static md:w-96 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <div className="hidden md:block mb-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-4 border-b border-gray-100 pb-4 text-xl font-bold text-gray-800">Trip Summary</h3>
            <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span className="rounded-lg bg-gray-100 px-3 py-1 text-gray-700">{result.vehicleType}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Route</span><span className="text-gray-800">{result.plate}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="text-gray-800">{result.departure}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-4"><span className="text-gray-500">Seats</span><span className="font-bold text-[#16a34a] text-lg">{selected.size ? [...selected].join(", ") : "None"}</span></div>
            </div>
          </div>
          <div className="flex items-end justify-between md:mb-6 md:rounded-3xl md:border md:border-gray-100 md:bg-white md:p-6 md:shadow-card">
            <div className="md:hidden">
              <span className="text-xs font-bold uppercase text-gray-400">Selected</span>
              <p className="font-black text-gray-800">{selected.size || 0} Seat{(selected.size || 0) !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex-1 text-right">
              <span className="mb-1 block text-sm font-bold uppercase tracking-wider text-gray-400">Total</span>
              <span className="text-2xl font-black leading-none text-gray-900 md:text-3xl">{money(total)}</span>
            </div>
          </div>
          <button disabled={selected.size === 0} onClick={() => onConfirm([...selected])} className={`mt-4 w-full rounded-2xl py-4 text-lg font-bold shadow-md transition-all md:py-5 ${selected.size > 0 ? "bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white hover:-translate-y-1 hover:shadow-lg" : "cursor-not-allowed bg-gray-100 text-gray-400"}`}>
            Continue to Checkout <I.ArrowRight className="inline h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CHECKOUT VIEW
   ═══════════════════════════════════════════════════════════════════════ */
function CheckoutView({ result, seats, onComplete, onBack }: {
  result: SearchResult; seats: number[]; onComplete: (b: Record<string, unknown>) => void; onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"IDLE" | "PROCESSING" | "STK_SENT" | "WAITING" | "SUCCESS" | "FAILED">("IDLE");
  const [msg, setMsg] = useState("");
  const total = result.price * seats.length;
  const valid = name.length > 2 && phone.length >= 10;

  const pay = async () => {
    if (!valid) return;
    setStatus("PROCESSING");

    try {
      // 1. Create the booking via PostgreSQL function
      const { data: bookingResult, error: bookingError } = await supabase.rpc("api_online_booking" as never, {
        p_trip_id: result.trip.id,
        p_seat_no: seats[0],
        p_passenger_name: name.trim(),
        p_boarding_station_id: result.trip.station_id,
        p_destination_station_id: null,
        p_passenger_phone: phone.trim(),
        p_payment_method: "mpesa",
      } as never);

      if (bookingError || !bookingResult) {
        setStatus("FAILED");
        setMsg(bookingError?.message || "Booking failed");
        return;
      }

      // 2. Initiate STK Push via BrightPay (endpoint-pay)
      setStatus("STK_SENT");
      setMsg("Sending payment prompt to your phone...");

      const externalReference = (bookingResult as Record<string, unknown>)?.receipt_code || `SCL-${Date.now().toString(36).toUpperCase()}`;
      const bpUrl = import.meta.env["VITE_BRIGHTPAY_BASE_URL"] as string;
      const bpKey = import.meta.env["VITE_BRIGHTPAY_API_KEY"] as string;
      const phoneFormatted = phone.trim().replace(/^0/, "254").replace(/[^0-9]/g, "");

      const stkRes = await fetch(`${bpUrl}/functions/v1/endpoint-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": bpKey },
        body: JSON.stringify({
          amount: total,
          phone_number: phoneFormatted,
          external_reference: externalReference,
        }),
      });

      const stkData = await stkRes.json().catch(() => ({}));

      if (!stkRes.ok || !stkData.success) {
        setStatus("FAILED");
        setMsg(stkData.message || stkData.error || "M-Pesa payment failed. Please try again or pay at the stage.");
        return;
      }

      const checkoutId = stkData.checkout_id;
      setStatus("WAITING");
      setMsg("Check your phone — enter your M-Pesa PIN to complete payment.");

      // 3. Poll status via BrightPay (endpoint-status), every ~3s up to ~2 min
      let attempts = 0;
      const maxAttempts = 40; // 40 * 3s = 120s
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) { clearInterval(poll); setStatus("FAILED"); setMsg("Payment timed out. Your seat is reserved for 5 minutes."); return; }

        try {
          const pollRes = await fetch(`${bpUrl}/functions/v1/endpoint-status?checkout_id=${encodeURIComponent(checkoutId)}`, {
            headers: { "x-api-key": bpKey },
          });
          const pollData = await pollRes.json().catch(() => ({}));
          const txStatus = pollData.status;

          if (/COMPLETED|SUCCESS|success/i.test(txStatus)) {
            clearInterval(poll);
            setStatus("SUCCESS");
            setMsg("Payment confirmed!");
            setTimeout(() => onComplete({
              bookingRef: externalReference,
              trip: { origin: result.plate, destination: "—", date: new Date().toLocaleDateString(), departure: result.departure },
              seats, passenger: { name, phone, email }, amount: total,
            }), 1500);
          } else if (/FAILED|CANCELLED|cancelled|failed/i.test(txStatus)) {
            clearInterval(poll);
            setStatus("FAILED");
            setMsg("Payment was not completed.");
          }
        } catch { /* ignore poll errors */ }
      }, 3000);
    } catch (err) {
      setStatus("FAILED");
      setMsg(err instanceof Error ? err.message : "Payment failed");
    }
  };

  return (
    <div className="min-h-screen animate-fade-in bg-gray-50 py-8 px-4">
      <div className="mx-auto flex max-w-5xl w-full flex-col gap-8">
        <div className="flex-1 space-y-6">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#16a34a]"><I.ArrowLeft className="h-4 w-4" /> Back to seat selection</button>
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card md:p-10">
            <h2 className="mb-8 text-2xl font-black text-gray-800">Passenger Details</h2>
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Full Name</label>
                <input type="text" placeholder="e.g. John Kamau" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-5 py-4 font-medium transition-all focus:border-[#16a34a] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#16a34a]/10" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">M-Pesa Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-2xl border-2 border-r-0 border-gray-200 bg-gray-100 px-5 font-bold text-gray-500">+254</span>
                  <input type="tel" placeholder="712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-r-2xl border-2 border-gray-200 bg-gray-50 px-5 py-4 font-medium transition-all focus:border-[#16a34a] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#16a34a]/10" />
                </div>
                <p className="mt-2 text-xs font-medium text-gray-400">A payment prompt (STK Push) will be sent to this number.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Email (Optional)</label>
                <input type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-5 py-4 font-medium transition-all focus:border-[#16a34a] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#16a34a]/10" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-96 md:space-y-6">
          <div className="sticky top-24 rounded-3xl border border-gray-100 bg-white p-6 shadow-card md:p-8">
            <h3 className="mb-6 text-xl font-bold text-gray-800">Payment Summary</h3>
            <div className="mb-8 rounded-2xl border border-green-100 bg-green-50 p-5 text-sm">
              <div className="flex justify-between"><span className="font-medium text-gray-600">Ticket(s)</span><span className="font-bold text-gray-800">{seats.length} x {money(result.price)}</span></div>
              <div className="mt-3 flex justify-between border-t border-green-200/50 pt-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Total</span>
                <span className="text-2xl font-black text-[#16a34a]">{money(total)}</span>
              </div>
            </div>

            {status === "IDLE" && (
              <button disabled={!valid} onClick={pay} className={`w-full rounded-2xl py-5 text-lg font-bold shadow-md transition-all ${valid ? "bg-gray-900 text-white hover:-translate-y-1 hover:shadow-xl hover:bg-black" : "cursor-not-allowed bg-gray-100 text-gray-400"}`}>
                Pay with M-Pesa
              </button>
            )}

            {(status === "PROCESSING" || status === "STK_SENT") && (
              <div className="animate-pulse rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
                <I.Loader className="mx-auto mb-4 h-10 w-10 animate-spin text-[#16a34a]" />
                <p className="text-lg font-black text-[#16a34a]">{status === "STK_SENT" ? "Check your phone" : "Processing..."}</p>
                <p className="mt-2 text-sm font-medium text-green-700">{msg}</p>
              </div>
            )}

            {status === "WAITING" && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
                <I.Phone className="mx-auto mb-4 h-10 w-10 text-blue-500 animate-pulse" />
                <p className="text-lg font-black text-blue-700">Waiting for payment</p>
                <p className="mt-2 text-sm font-medium text-blue-600">{msg}</p>
              </div>
            )}

            {status === "SUCCESS" && (
              <div className="animate-slide-down rounded-2xl border border-green-300 bg-green-100 p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-lg"><I.Check className="h-7 w-7" /></div>
                <p className="text-xl font-black text-green-800">Payment Successful!</p>
                <p className="mt-2 text-sm font-medium text-green-700">Generating your ticket...</p>
              </div>
            )}

            {status === "FAILED" && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-lg font-bold text-red-700">Payment Failed</p>
                <p className="mt-2 text-sm text-red-600">{msg}</p>
                <button onClick={() => { setStatus("IDLE"); setMsg(""); }} className="mt-4 rounded-xl bg-red-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-red-700">Try Again</button>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <I.Shield className="h-4 w-4" /> End-to-End Encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TICKET VIEW (digital boarding pass)
   ═══════════════════════════════════════════════════════════════════════ */
function TicketView({ booking, onHome }: { booking: Record<string, unknown>; onHome: () => void }) {
  const trip = booking.trip as Record<string, string> | undefined;
  const passenger = booking.passenger as Record<string, string> | undefined;
  const seats = booking.seats as number[] | undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl">
          <div className="absolute left-[-24px] top-[55%] h-12 w-12 rounded-full bg-green-50 shadow-inner" />
          <div className="absolute right-[-24px] top-[55%] h-12 w-12 rounded-full bg-green-50 shadow-inner" />
          <div className="relative bg-gray-900 p-8 text-center text-white">
            <h2 className="relative z-10 text-3xl font-extrabold">Sacco<span className="text-[#22c55e]">Link</span></h2>
            <p className="relative z-10 mt-2 text-xs font-bold uppercase tracking-widest text-gray-400">Boarding Pass</p>
          </div>
          <div className="border-b-2 border-dashed border-gray-200 p-8 pb-12">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">From</p>
                <p className="text-2xl font-black text-gray-800">{trip?.origin || "—"}</p>
              </div>
              <I.ArrowRight className="h-5 w-5 text-[#16a34a] opacity-50" />
              <div className="text-right">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">To</p>
                <p className="text-2xl font-black text-gray-800">{trip?.destination || "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8">
              <div><p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Passenger</p><p className="font-bold text-gray-800">{passenger?.name}</p></div>
              <div className="text-right"><p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Seat(s)</p><p className="font-bold text-gray-800">{seats?.join(", ")}</p></div>
              <div><p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Date</p><p className="font-bold text-gray-800">{trip?.date}</p></div>
              <div className="text-right"><p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Time</p><p className="font-black text-[#16a34a]">{trip?.departure}</p></div>
            </div>
          </div>
          <div className="flex flex-col items-center bg-gray-50 p-8 text-center">
            <I.QrCode className="mb-4 h-16 w-16 text-gray-800 opacity-80" />
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">Booking Ref</p>
            <p className="text-2xl font-black tracking-widest text-gray-800">{booking.bookingRef as string}</p>
            <div className="mt-6 flex items-center gap-2 rounded-full bg-green-100 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-green-800">
              <I.Check className="h-4 w-4" /> Paid {money(booking.amount as number)}
            </div>
          </div>
        </div>
        <button onClick={onHome} className="mt-8 w-full rounded-2xl border-2 border-gray-300 bg-transparent py-5 font-bold text-gray-900 shadow-sm transition hover:bg-white hover:shadow">
          Book Another Trip
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="mt-auto bg-gray-900 pb-8 pt-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div className="mb-5 flex items-center">
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#16a34a] text-lg font-bold shadow">S</div>
              <span className="text-2xl font-extrabold tracking-tight">SaccoLink</span>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">Reliable, safe, and comfortable transport. Book your seat or send parcels online.</p>
          </div>
          <div>
            <h4 className="mb-5 text-lg font-bold">Services</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2 hover:text-[#22c55e] transition"><I.Bus className="h-4 w-4" /> Book a Trip</li>
              <li className="flex items-center gap-2 hover:text-[#22c55e] transition"><I.Package className="h-4 w-4" /> Send a Parcel</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-lg font-bold">Support</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="hover:text-[#22c55e] transition cursor-pointer">Help Center</li>
              <li className="hover:text-[#22c55e] transition cursor-pointer">Terms of Service</li>
              <li className="hover:text-[#22c55e] transition cursor-pointer">Privacy Policy</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-lg font-bold">Contact</h4>
            <ul className="mb-6 space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-3"><div className="rounded-lg bg-gray-800 p-2 text-[#22c55e]"><I.Phone className="h-5 w-5" /></div> +254 700 000 000</li>
              <li className="flex items-center gap-3"><div className="rounded-lg bg-gray-800 p-2 text-[#22c55e]"><I.Headphones className="h-5 w-5" /></div> support@saccolink.co.ke</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between border-t border-gray-800 pt-8 text-sm text-gray-500 md:flex-row">
          <p>&copy; {new Date().getFullYear()} SaccoLink. All rights reserved.</p>
          <p className="mt-2 font-medium md:mt-0">Powered by BrightPay</p>
        </div>
      </div>
    </footer>
  );
}

export default App;
