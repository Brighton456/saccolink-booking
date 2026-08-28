import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { money } from "@/lib/utils";
import * as I from "@/icons";

export default function MyTicketsView() {
  const navigate = useNavigate();
  const { history } = useBooking();

  return (
    <div className="min-h-screen animate-fade-in bg-[var(--scl-surface-alt)] pb-8">
      <div className="sticky top-0 z-40 border-b border-[var(--scl-border)] bg-[var(--scl-card)] py-4 shadow-sm">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="text-xl font-extrabold text-[var(--scl-text)]">My Tickets</h1>
          <p className="text-xs text-[var(--scl-text-secondary)]">Your recent bookings</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {history.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--scl-surface-alt)]">
              <I.Ticket className="h-10 w-10 text-[var(--scl-text-secondary)]" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-[var(--scl-text)]">No tickets yet</h2>
            <p className="mb-6 max-w-xs text-sm text-[var(--scl-text-secondary)]">
              Your booked tickets will appear here. Search for a trip to get started.
            </p>
            <button
              onClick={() => navigate("/")}
              className="rounded-2xl bg-gradient-to-r from-[#B8A94E] to-[#8B7D3C] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#8B7D3C]/25 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Search for Trips
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => {
              const route = String(h.route || "—");
              const date = String(h.date || "");
              const total = Number(h.total || 0);
              const seats = Array.isArray(h.seats) ? h.seats.map(String) : [];
              const receiptCode = String(h.receiptCode || "—");
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-[var(--scl-border)] bg-[var(--scl-card)] p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B7D3C]/10">
                        <I.Bus className="h-5 w-5 text-[#8B7D3C]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--scl-text)]">{route}</p>
                        <p className="text-xs text-[var(--scl-text-secondary)]">
                          {date ? new Date(date).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" }) : "—"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-[#8B7D3C]/10 px-2 py-1 text-xs font-bold text-[#8B7D3C]">
                      {money(total)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[var(--scl-border)] pt-3 text-xs text-[var(--scl-text-secondary)]">
                    <span>Seats: {seats.join(", ")}</span>
                    <span className="font-mono">{receiptCode}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
