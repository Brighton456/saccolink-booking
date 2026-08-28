import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { today } from "@/lib/utils";
import type { Station, TripRow, TicketRow, RouteStop, SearchResult, SearchParams } from "@/types";

export interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  timestamp: number;
}

interface BookingContextValue {
  /* Data */
  stations: Station[];
  allTrips: TripRow[];
  tickets: TicketRow[];
  routeStops: RouteStop[];
  saccosMap: Map<string, string>;
  loading: boolean;

  /* Booking flow */
  searchParams: SearchParams | null;
  selectedTrip: SearchResult | null;
  selectedSeats: number[];
  booking: Record<string, unknown> | null;

  /* Favorites */
  favoriteRoutes: { origin: string; destination: string }[];
  addFavorite: (origin: string, destination: string) => void;
  removeFavorite: (origin: string, destination: string) => void;
  isFavorite: (origin: string, destination: string) => boolean;

  /* Booking history */
  history: Record<string, unknown>[];
  addToHistory: (b: Record<string, unknown>) => void;

  /* Dark mode */
  darkMode: boolean;
  toggleDarkMode: () => void;

  /* Toasts */
  toasts: Notification[];
  showToast: (message: string, type?: Notification["type"]) => void;
  dismissToast: (id: string) => void;

  /* Actions */
  handleSearch: (params: SearchParams) => void;
  selectTrip: (sr: SearchResult) => void;
  confirmSeats: (seats: number[]) => void;
  completeBooking: (b: Record<string, unknown>) => void;
  goHome: () => void;
  updateDate: (date: string) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage full or unavailable */ }
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
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

  /* Favorites — persisted to localStorage */
  const [favoriteRoutes, setFavoriteRoutes] = useState<{ origin: string; destination: string }[]>(
    () => loadFromStorage("scl_favorites", []),
  );
  useEffect(() => { saveToStorage("scl_favorites", favoriteRoutes); }, [favoriteRoutes]);

  /* Booking history — persisted */
  const [history, setHistory] = useState<Record<string, unknown>[]>(
    () => loadFromStorage("scl_history", []),
  );
  useEffect(() => { saveToStorage("scl_history", history); }, [history]);

  /* Dark mode — persisted + system preference */
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("scl_dark");
    if (stored !== null) return stored === "true";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });
  useEffect(() => {
    localStorage.setItem("scl_dark", String(darkMode));
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  /* Toasts */
  const [toasts, setToasts] = useState<Notification[]>([]);
  const showToast = useCallback((message: string, type: Notification["type"] = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* Fetch all public data on mount */
  useEffect(() => {
    (async () => {
      const sRes = await supabase.from("stations").select("id, name").order("name");
      setStations((sRes.data as Station[]) ?? []);
      const tRes = await supabase
        .from("trips")
        .select("*, routes(*), vehicles(*), drivers(*), saccos(id, name)")
        .gte("scheduled_at", today())
        .lte("scheduled_at", today() + "T23:59:59")
        .order("scheduled_at");
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

      const baseUrl = import.meta.env["VITE_SUPABASE_URL"] as string;
      const anonKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;
      try {
        const rsRes = await fetch(`${baseUrl}/rest/v1/route_stops?select=*,stations(id,name)&order=sequence_no`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        });
        if (rsRes.ok) setRouteStops((await rsRes.json()) as RouteStop[]);
      } catch { /* ignore */ }

      if (tripData.length > 0) {
        const { data: tkData } = await supabase
          .from("tickets")
          .select("id, trip_id, seat_no")
          .in("trip_id", tripData.map((t) => t.id));
        setTickets((tkData as TicketRow[]) ?? []);
      }
      setLoading(false);
    })();
  }, []);

  /* Actions */
  const handleSearch = useCallback((params: SearchParams) => {
    setSearchParams(params);
  }, []);

  const selectTrip = useCallback((sr: SearchResult) => {
    setSelectedTrip(sr);
    supabase
      .from("tickets")
      .select("id, trip_id, seat_no")
      .eq("trip_id", sr.trip.id)
      .then(({ data }) => { setTickets((data as TicketRow[]) ?? []); });
  }, []);

  const confirmSeats = useCallback((seats: number[]) => { setSelectedSeats(seats); }, []);

  const completeBooking = useCallback((b: Record<string, unknown>) => {
    setBooking(b);
    setHistory((prev) => [b, ...prev].slice(0, 20)); // keep last 20
  }, []);

  const goHome = useCallback(() => {
    setSearchParams(null);
    setSelectedTrip(null);
    setSelectedSeats([]);
    setBooking(null);
  }, []);

  const updateDate = useCallback((date: string) => {
    setSearchParams((prev) => (prev ? { ...prev, date } : prev));
  }, []);

  const addFavorite = useCallback((origin: string, destination: string) => {
    setFavoriteRoutes((prev) => {
      if (prev.some((f) => f.origin === origin && f.destination === destination)) return prev;
      return [{ origin, destination }, ...prev].slice(0, 10);
    });
  }, []);

  const removeFavorite = useCallback((origin: string, destination: string) => {
    setFavoriteRoutes((prev) => prev.filter((f) => !(f.origin === origin && f.destination === destination)));
  }, []);

  const isFavorite = useCallback(
    (origin: string, destination: string) =>
      favoriteRoutes.some((f) => f.origin === origin && f.destination === destination),
    [favoriteRoutes],
  );

  const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), []);

  const value = useMemo<BookingContextValue>(
    () => ({
      stations, allTrips, tickets, routeStops, saccosMap, loading,
      searchParams, selectedTrip, selectedSeats, booking,
      favoriteRoutes, addFavorite, removeFavorite, isFavorite,
      history, addToHistory: completeBooking,
      darkMode, toggleDarkMode,
      toasts, showToast, dismissToast,
      handleSearch, selectTrip, confirmSeats, completeBooking, goHome, updateDate,
    }),
    [stations, allTrips, tickets, routeStops, saccosMap, loading, searchParams, selectedTrip, selectedSeats, booking, favoriteRoutes, addFavorite, removeFavorite, isFavorite, history, completeBooking, darkMode, toggleDarkMode, toasts, showToast, dismissToast, handleSearch, selectTrip, confirmSeats, goHome, updateDate],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
