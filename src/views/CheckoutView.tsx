import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { supabase } from "@/lib/supabase";
import { money } from "@/lib/utils";
import { useHaptic } from "@/lib/hooks";
import { playClick, playSuccess, playError } from "@/lib/sounds";
import { initiateSTKPush, pollPaymentStatus, generateReference, formatMpesaPhone } from "@/lib/brightpay";
import * as I from "@/icons";

type Status = "IDLE" | "PROCESSING" | "BOOKING" | "STK_SENT" | "WAITING" | "SUCCESS" | "FAILED";

export default function CheckoutView() {
  const navigate = useNavigate();
  const { selectedTrip, selectedSeats, completeBooking, showToast } = useBooking();
  const haptic = useHaptic();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("IDLE");
  const [msg, setMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Cleanup poll interval on unmount */
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  if (!selectedTrip) return null;

  const total = selectedTrip.price * selectedSeats.length;
  const valid = name.trim().length > 2 && phone.replace(/[^0-9]/g, "").length >= 9;

  const resetToIdle = useCallback(() => {
    setStatus("IDLE");
    setMsg("");
    haptic("tap");
  }, [haptic]);

  const pay = useCallback(async () => {
    if (!valid) return;
    haptic("tap");
    playClick();
    setStatus("PROCESSING");
    setMsg("Booking your seats...");

    try {
      /* ────────────────────────────────────────────────────────
         STEP 1: Book ALL selected seats via Supabase
         ──────────────────────────────────────────────────────── */
      let lastBookingResult: Record<string, unknown> | null = null;

      for (const seatNo of selectedSeats) {
        setStatus("BOOKING");
        setMsg(`Booking seat ${seatNo}...`);

        const { data: bookingResult, error: bookingError } = await supabase.rpc("api_online_booking" as never, {
          p_trip_id: selectedTrip.trip.id,
          p_seat_no: seatNo,
          p_passenger_name: name.trim(),
          p_boarding_station_id: selectedTrip.trip.station_id,
          p_destination_station_id: null,
          p_passenger_phone: phone.trim(),
          p_payment_method: "mpesa",
        } as never);

        if (bookingError || !bookingResult) {
          setStatus("FAILED");
          setMsg(`Booking failed for seat ${seatNo}: ${bookingError?.message || "Unknown error. Your seat has NOT been reserved."}`);
          haptic("error");
          playError();
          return;
        }
        lastBookingResult = bookingResult as Record<string, unknown>;
      }

      /* ────────────────────────────────────────────────────────
         STEP 2: Initiate M-Pesa STK Push via BrightPay
         ──────────────────────────────────────────────────────── */
      setStatus("STK_SENT");
      setMsg("Sending payment prompt to your phone...");

      const externalReference =
        (lastBookingResult as Record<string, unknown>)?.receipt_code as string ||
        generateReference();

      const phoneFormatted = formatMpesaPhone(phone);

      const stkResponse = await initiateSTKPush({
        amount: total,
        phone_number: phoneFormatted,
        external_reference: externalReference,
      });

      if (!stkResponse.success || !stkResponse.checkout_id) {
        setStatus("FAILED");
        setMsg(
          stkResponse.message ||
          stkResponse.error ||
          "Failed to send M-Pesa payment prompt. Please try again or pay at the stage."
        );
        haptic("error");
        playError();
        return;
      }

      const checkoutId = stkResponse.checkout_id;
      setStatus("WAITING");
      setMsg("Check your phone — enter your M-Pesa PIN to complete payment.");

      /* ────────────────────────────────────────────────────────
         STEP 3: Poll BrightPay for payment status
         Poll every 3 seconds, max ~2 minutes (40 attempts)
         ──────────────────────────────────────────────────────── */
      let attempts = 0;
      const maxAttempts = 40;
      const pollInterval = 3000;

      pollRef.current = setInterval(async () => {
        attempts++;

        if (attempts > maxAttempts) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setStatus("FAILED");
          setMsg("Payment timed out. Your seat is reserved for 5 minutes — please try again.");
          haptic("error");
          playError();
          return;
        }

        try {
          const statusData = await pollPaymentStatus(checkoutId);
          const txStatus = statusData.status;

          /* ── Payment completed ── */
          if (txStatus === "COMPLETED") {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setStatus("SUCCESS");
            setMsg("Payment confirmed!");
            playSuccess();
            haptic("success");
            showToast(`Payment successful! M-Pesa receipt: ${statusData.mpesa_receipt || "—"}`, "success");

            setTimeout(() => {
              completeBooking({
                bookingRef: externalReference,
                mpesaReceipt: statusData.mpesa_receipt,
                trip: {
                  origin: selectedTrip.plate,
                  destination: "—",
                  date: new Date().toLocaleDateString(),
                  departure: selectedTrip.departure,
                },
                seats: selectedSeats,
                passenger: { name, phone, email },
                amount: total,
              });
              navigate("/ticket");
            }, 2000);
            return;
          }

          /* ── Payment failed / cancelled ── */
          if (txStatus === "FAILED") {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setStatus("FAILED");
            setMsg("Payment was not completed. Please try again or pay at the stage.");
            haptic("error");
            playError();
            return;
          }

          /* ── Still pending — update sub-message ── */
          if (txStatus === "PENDING") {
            setMsg(`Waiting for payment... (attempt ${attempts}/${maxAttempts})`);
          }
        } catch {
          /* Poll network error — will retry next interval */
        }
      }, pollInterval);

    } catch (err) {
      setStatus("FAILED");
      setMsg(
        err instanceof Error
          ? `Error: ${err.message}`
          : "An unexpected error occurred. Please try again."
      );
      haptic("error");
      playError();
    }
  }, [valid, haptic, selectedSeats, selectedTrip, name, phone, email, total, completeBooking, navigate, showToast]);

  return (
    <div className="min-h-screen animate-fade-in bg-[var(--scl-surface-alt)] px-4 py-6 pb-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex-1 space-y-5">
          <button onClick={() => navigate("/select-seats")} className="haptic-tap flex items-center gap-2 text-sm font-bold text-[var(--scl-text-secondary)] hover:text-[#16a34a]">
            <I.ArrowLeft className="h-4 w-4" /> Back to seats
          </button>

          {/* Passenger Details */}
          <div className="rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-6 shadow-[var(--scl-shadow-sm)] md:p-8">
            <h2 className="mb-6 text-xl font-extrabold text-[var(--scl-text)]">Passenger Details</h2>
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Kamau"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={status !== "IDLE"}
                  className="w-full rounded-2xl border-2 border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-5 py-3.5 font-medium text-[var(--scl-text)] transition-all placeholder-[var(--scl-text-secondary)]/50 focus:border-[#16a34a] focus:bg-[var(--scl-card)] focus:outline-none focus:ring-4 focus:ring-[#16a34a]/10 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">M-Pesa Phone Number</label>
                <div className="flex overflow-hidden rounded-2xl border-2 border-[var(--scl-border)] transition-all focus-within:border-[#16a34a] focus-within:ring-4 focus-within:ring-[#16a34a]/10">
                  <span className="inline-flex items-center border-r-2 border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-5 font-bold text-[var(--scl-text-secondary)]">+254</span>
                  <input
                    type="tel"
                    placeholder="712 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={status !== "IDLE"}
                    className="w-full bg-[var(--scl-surface-alt)] px-5 py-3.5 font-medium text-[var(--scl-text)] outline-none focus:bg-[var(--scl-card)] disabled:opacity-50"
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-[var(--scl-text-secondary)]">STK Push will be sent to this number.</p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status !== "IDLE"}
                  className="w-full rounded-2xl border-2 border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-5 py-3.5 font-medium text-[var(--scl-text)] transition-all placeholder-[var(--scl-text-secondary)]/50 focus:border-[#16a34a] focus:bg-[var(--scl-card)] focus:outline-none focus:ring-4 focus:ring-[#16a34a]/10 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary + CTA */}
        <div className="w-full md:w-96 md:space-y-5">
          <div className="rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-6 shadow-[var(--scl-shadow-sm)] md:p-8">
            <h3 className="mb-5 text-lg font-extrabold text-[var(--scl-text)]">Payment Summary</h3>
            <div className="mb-6 rounded-2xl border border-[#16a34a]/20 bg-[#16a34a]/5 p-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-[var(--scl-text-secondary)]">Ticket(s)</span>
                <span className="font-bold text-[var(--scl-text)]">{selectedSeats.length} × {money(selectedTrip.price)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="font-medium text-[var(--scl-text-secondary)]">Seat(s)</span>
                <span className="font-bold text-[var(--scl-text)]">{selectedSeats.map((s) => s === 2 ? "1X" : String(s)).join(", ")}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-[#16a34a]/20 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">Total</span>
                <span className="text-2xl font-extrabold text-[#16a34a]">{money(total)}</span>
              </div>
            </div>

            {/* ═══════ PAYMENT STATES ═══════ */}

            {/* IDLE — Show pay button */}
            {status === "IDLE" && (
              <button
                disabled={!valid}
                onClick={pay}
                className={`haptic-tap w-full rounded-2xl py-4 text-base font-bold shadow-lg transition-all ${
                  valid
                    ? "bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white shadow-[#16a34a]/25 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
                    : "cursor-not-allowed bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)]"
                }`}
              >
                Pay with M-Pesa
              </button>
            )}

            {/* PROCESSING / BOOKING — Creating seat reservations */}
            {(status === "PROCESSING" || status === "BOOKING") && (
              <div className="animate-pulse rounded-2xl border border-[#16a34a]/20 bg-[#16a34a]/5 p-8 text-center">
                <I.Loader className="mx-auto mb-4 h-10 w-10 animate-spin text-[#16a34a]" />
                <p className="text-lg font-extrabold text-[#16a34a]">Booking seats...</p>
                <p className="mt-2 text-sm font-medium text-[#16a34a]/80">{msg}</p>
              </div>
            )}

            {/* STK_SENT — Payment prompt sent to phone */}
            {status === "STK_SENT" && (
              <div className="animate-pulse rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900/30 dark:bg-amber-950/30">
                <I.Phone className="mx-auto mb-4 h-10 w-10 animate-pulse text-amber-500" />
                <p className="text-lg font-extrabold text-amber-700 dark:text-amber-400">Check your phone</p>
                <p className="mt-2 text-sm font-medium text-amber-600/80 dark:text-amber-400/80">{msg}</p>
              </div>
            )}

            {/* WAITING — Polling for payment confirmation */}
            {status === "WAITING" && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center dark:border-blue-900/30 dark:bg-blue-950/30">
                <I.Loader className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-500" />
                <p className="text-lg font-extrabold text-blue-700 dark:text-blue-400">Waiting for payment</p>
                <p className="mt-2 text-sm font-medium text-blue-600/80 dark:text-blue-400/80">{msg}</p>
                <div className="mt-4 flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full bg-blue-400"
                      style={{ animation: "pulseSoft 1.2s ease-in-out infinite", animationDelay: `${i * 0.3}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SUCCESS — Payment confirmed */}
            {status === "SUCCESS" && (
              <div className="animate-scale-in rounded-2xl border border-[#16a34a]/30 bg-[#16a34a]/10 p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-lg shadow-[#16a34a]/30 animate-bounce-in">
                  <I.Check className="h-8 w-8" />
                </div>
                <p className="text-xl font-extrabold text-[#16a34a]">Payment Successful!</p>
                <p className="mt-2 text-sm font-medium text-[#16a34a]/80">Generating your boarding pass...</p>
              </div>
            )}

            {/* FAILED — Something went wrong */}
            {status === "FAILED" && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/30 dark:bg-red-950/30">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <I.X className="h-6 w-6 text-red-500" />
                </div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">Payment Failed</p>
                <p className="mt-2 text-sm leading-relaxed text-red-500/80 dark:text-red-400/80">{msg}</p>
                <button
                  onClick={resetToIdle}
                  className="haptic-tap mt-4 rounded-xl bg-red-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 active:scale-[0.97]"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Trust badge */}
            <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--scl-text-secondary)]">
              <I.Shield className="h-3.5 w-3.5" /> Secure M-Pesa Payment via BrightPay
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
