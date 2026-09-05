import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { money, timeOf } from "@/lib/utils";
import { useHaptic } from "@/lib/hooks";
import { playClick, playSuccess } from "@/lib/sounds";
import { renderBookingReceiptHtml, printBookingReceipt, type ReceiptData, type CompanyReceiptConfig } from "@/lib/receipt-renderer";
import { supabase } from "@/lib/supabase";
import * as I from "@/icons";

export default function ConfirmationView() {
  const navigate = useNavigate();
  const { booking, selectedTrip, selectedSeats, goHome } = useBooking();
  const haptic = useHaptic();

  if (!booking || !selectedTrip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--scl-surface-alt)]">
        <div className="text-center">
          <I.Bus className="mx-auto mb-4 h-12 w-12 text-[var(--scl-text-secondary)]" />
          <p className="mb-4 text-lg font-bold text-[var(--scl-text)]">No booking found</p>
          <button onClick={() => navigate("/")} className="rounded-2xl bg-[#8B7D3C] px-6 py-3 font-bold text-white">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleDone = () => {
    haptic("success");
    playSuccess();
    goHome();
    navigate("/");
  };

  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [companyConfig, setCompanyConfig] = useState<CompanyReceiptConfig | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* Auto-show receipt after a brief delay so the user sees success first */
  useEffect(() => {
    const t = setTimeout(() => setShowReceiptPreview(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const receiptCode = `SCL-${Date.now().toString(36).toUpperCase()}`;
  const bookingTime = new Date().toLocaleString("en-KE");
  const tripDate = new Date(selectedTrip.trip.scheduled_at).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const receiptData = useCallback((): ReceiptData => ({
    code: receiptCode,
    seat: selectedSeats.map((s) => s === 2 ? "1X" : String(s)).join(", "),
    name: (booking as Record<string, unknown>).name as string ?? "—",
    phone: (booking as Record<string, unknown>).phone as string ?? null,
    fare: selectedTrip.price * selectedSeats.length,
    method: (booking as Record<string, unknown>).method as string ?? "mpesa",
    route: `${selectedTrip.trip.routes?.origin ?? "—"} → ${selectedTrip.trip.routes?.destination ?? "—"}`,
    origin: selectedTrip.trip.routes?.origin ?? "—",
    destination: selectedTrip.trip.routes?.destination ?? "—",
    vehiclePlate: selectedTrip.plate,
    departureTime: selectedTrip.departure,
    date: tripDate,
    saccoName: selectedTrip.saccoName,
  }), [receiptCode, selectedSeats, booking, selectedTrip, tripDate]);

  // Fetch the company's configured receipt template from Supabase
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const { data } = await supabase
          .from("receipt_templates" as never)
          .select("template_data" as never)
          .eq("is_default" as never, true)
          .limit(1)
          .maybeSingle();
        if (data) {
          const td = (data as unknown as { template_data?: Record<string, unknown> })?.template_data;
          if (td) {
            setCompanyConfig({
              headerText: (td.headerText as string) || "KANGAROO SHUTTLE",
              accentColor: (td.accentColor as string) || "#8B7D3C",
              showLogo: td.showLogo !== false,
              logoUrl: (td.logoUrl as string) || null,
              footerText: (td.footerText as string) || "Thank you for traveling with Kangaroo Shuttle!",
            });
          }
        }
      } catch { /* ignore */ }
    };
    fetchTemplate();
  }, []);

  return (
    <div className="min-h-screen animate-fade-in bg-[var(--scl-surface-alt)] pb-32">
      {/* Success banner */}
      <div className="bg-gradient-to-br from-[#8B7D3C] to-[#B8A94E] px-4 pt-20 pb-12 text-center text-white">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur">
          <I.Check className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-extrabold">Booking Confirmed!</h1>
        <p className="mt-2 text-sm text-white/80">Your digital ticket is ready. Show it to the conductor.</p>
      </div>

      {/* Receipt card */}
      <div className="mx-auto -mt-6 max-w-lg px-4">
        <div className="overflow-hidden rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] shadow-xl">
          {/* Header */}
          <div className="border-b border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-6 py-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8B7D3C] text-xs font-bold text-white">S</div>
              <span className="text-sm font-extrabold">BrightLink Fleet Management System</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">Digital Boarding Ticket</p>
          </div>

          {/* Route */}
          <div className="border-b border-dashed border-[var(--scl-border)] px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-[var(--scl-text)]">{timeOf(selectedTrip.trip.scheduled_at)}</p>
                <p className="text-xs font-semibold text-[var(--scl-text-secondary)]">{selectedTrip.trip.routes?.origin ?? "—"}</p>
              </div>
              <div className="flex flex-col items-center px-4">
                <I.ArrowRight className="h-5 w-5 text-[#8B7D3C]" />
                <p className="mt-1 text-[10px] text-[var(--scl-text-secondary)]">{selectedTrip.plate}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-[var(--scl-text)]">{selectedTrip.arrival}</p>
                <p className="text-xs font-semibold text-[var(--scl-text-secondary)]">{selectedTrip.trip.routes?.destination ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 px-6 py-5">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--scl-text-secondary)]">Date</span>
              <span className="font-semibold text-[var(--scl-text)]">{tripDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--scl-text-secondary)]">Vehicle</span>
              <span className="font-semibold text-[var(--scl-text)]">{selectedTrip.plate} · {selectedTrip.vehicleType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--scl-text-secondary)]">Sacco</span>
              <span className="font-semibold text-[var(--scl-text)]">{selectedTrip.saccoName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--scl-text-secondary)]">Seat(s)</span>
              <span className="font-semibold text-[var(--scl-text)]">
                {selectedSeats.map((s) => s === 2 ? "1X" : String(s)).join(", ")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--scl-text-secondary)]">Passenger</span>
              <span className="font-semibold text-[var(--scl-text)]">{(booking as Record<string, unknown>).name as string ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--scl-text-secondary)]">Phone</span>
              <span className="font-semibold text-[var(--scl-text)]">{(booking as Record<string, unknown>).phone as string ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--scl-text-secondary)]">Payment</span>
              <span className="font-semibold text-[var(--scl-text)] capitalize">{(booking as Record<string, unknown>).method as string ?? "mpesa"}</span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between border-t border-[var(--scl-border)] pt-4">
              <span className="text-sm font-bold text-[var(--scl-text-secondary)]">Total Paid</span>
              <span className="text-2xl font-extrabold text-[#8B7D3C]">{money(selectedTrip.price * selectedSeats.length)}</span>
            </div>
          </div>

          {/* Receipt code */}
          <div className="border-t border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-6 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">Receipt: {receiptCode}</p>
            <p className="text-[10px] text-[var(--scl-text-secondary)]">Booked at {bookingTime}</p>
          </div>

          {/* Barcode placeholder */}
          <div className="flex justify-center border-t border-dashed border-[var(--scl-border)] px-6 py-4">
            <div className="flex gap-px">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-900 dark:bg-white"
                  style={{ width: Math.random() > 0.5 ? 2 : 1, height: 40 }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => {
              haptic("tap");
              playClick();
              printBookingReceipt(receiptData(), companyConfig);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-[#8B7D3C]/30 bg-[#8B7D3C]/5 py-3.5 text-sm font-bold text-[#8B7D3C] transition hover:border-[#8B7D3C]/60 hover:bg-[#8B7D3C]/10"
          >
            {isMobile ? "📥 Download Receipt" : "🖨 Print Receipt"}
          </button>
          <button
            onClick={handleDone}
            className="w-full rounded-2xl bg-gradient-to-r from-[#B8A94E] to-[#8B7D3C] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#8B7D3C]/25 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Done — Back to Home
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 rounded-2xl border border-[var(--scl-border)] bg-[var(--scl-card)] p-4 text-center">
          <p className="text-xs text-[var(--scl-text-secondary)]">Need help?</p>
          <p className="mt-1 text-xs font-bold text-[#8B7D3C]">Kitale: 0728944406 · Eldoret: 0727698996</p>
          <p className="text-xs font-bold text-[#8B7D3C]">Nakuru: 0727360080</p>
        </div>
      </div>

      {/* ─── Receipt Preview Modal ─── */}
      {showReceiptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--scl-border)] bg-[var(--scl-card)] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-4 py-3">
              <h3 className="text-sm font-bold text-[var(--scl-text)]">🎫 Receipt Preview</h3>
              <button
                onClick={() => setShowReceiptPreview(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--scl-border)] transition"
              >
                <I.X className="h-4 w-4 text-[var(--scl-text-secondary)]" />
              </button>
            </div>
            {/* Receipt content */}
            <div className="overflow-y-auto p-2" style={{ maxHeight: "calc(90vh - 120px)" }}>
              <iframe
                srcDoc={renderBookingReceiptHtml({
                  code: receiptCode,
                  seat: selectedSeats.map((s) => s === 2 ? "1X" : String(s)).join(", "),
                  name: (booking as Record<string, unknown>).name as string ?? "—",
                  phone: (booking as Record<string, unknown>).phone as string ?? null,
                  fare: selectedTrip.price * selectedSeats.length,
                  method: (booking as Record<string, unknown>).method as string ?? "mpesa",
                  route: `${selectedTrip.trip.routes?.origin ?? "—"} → ${selectedTrip.trip.routes?.destination ?? "—"}`,
                  origin: selectedTrip.trip.routes?.origin ?? "—",
                  destination: selectedTrip.trip.routes?.destination ?? "—",
                  vehiclePlate: selectedTrip.plate,
                  departureTime: selectedTrip.departure,
                  date: tripDate,
                  saccoName: selectedTrip.saccoName,
                }, companyConfig)}
                title="Receipt Preview"
                className="w-full border-0"
                style={{ minHeight: 400 }}
              />
            </div>
            {/* Actions */}
            <div className="flex gap-2 border-t border-[var(--scl-border)] bg-[var(--scl-surface-alt)] p-3">
              <button
                onClick={() => setShowReceiptPreview(false)}
                className="flex-1 rounded-xl border-2 border-[var(--scl-border)] bg-[var(--scl-card)] py-3 text-sm font-bold text-[var(--scl-text)] transition hover:border-[#8B7D3C]/30"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowReceiptPreview(false);
                  printBookingReceipt(receiptData(), companyConfig);
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#B8A94E] to-[#8B7D3C] py-3 text-sm font-bold text-white shadow-lg shadow-[#8B7D3C]/25 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {isMobile ? "📥 Download" : "🖨 Print"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
