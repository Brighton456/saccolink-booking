import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { usePassenger } from "@/context/PassengerAuth";
import LoginModal from "@/components/LoginModal";
import * as I from "@/icons";

export default function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useBooking();
  const { passenger } = usePassenger();

  const isHome = location.pathname === "/";
  const isTicket = location.pathname === "/ticket";
  const showBack = !isHome && !isTicket;

  return (
    <div className="sticky top-0 z-50 border-b border-[var(--scl-border)] bg-[var(--scl-card)]/80 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex cursor-pointer items-center gap-2.5"
          onClick={() => { if (isHome) window.scrollTo({ top: 0, behavior: "smooth" }); }}
        >
          <img src="/kangaroo-logo.png" alt="Kangaroo Shuttle" className="h-10 w-auto" />
          <span className="text-lg font-extrabold tracking-tight text-[var(--scl-text)]">
            Kangaroo <span className="text-[#8B7D3C]">Shuttle</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className={`text-sm font-semibold transition ${isHome ? "text-[#8B7D3C]" : "text-[var(--scl-text-secondary)] hover:text-[var(--scl-text)]"}`}>
            Trips
          </Link>
          <button className="text-sm font-medium text-[var(--scl-text-secondary)] transition hover:text-[var(--scl-text)]">Parcels</button>
          <button className="text-sm font-medium text-[var(--scl-text-secondary)] transition hover:text-[var(--scl-text)]">Help</button>
          {/* Dark mode toggle */}
          <button onClick={toggleDarkMode} className="haptic-tap flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:bg-[var(--scl-border)]">
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button onClick={() => setShowLogin(true)} className="haptic-tap flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--scl-surface-alt)] transition hover:bg-[var(--scl-border)]">
            {passenger ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B7D3C] text-[10px] font-bold text-white">{passenger.name.charAt(0).toUpperCase()}</span>
            ) : (
              <I.Phone className="h-4 w-4 text-[var(--scl-text-secondary)]" />
            )}
          </button>
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 md:hidden">
          <button onClick={toggleDarkMode} className="haptic-tap flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--scl-surface-alt)] text-sm transition hover:bg-[var(--scl-border)]">
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button onClick={() => setShowLogin(true)} className="haptic-tap flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--scl-surface-alt)] transition hover:bg-[var(--scl-border)]">
            {passenger ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B7D3C] text-[10px] font-bold text-white">{passenger.name.charAt(0).toUpperCase()}</span>
            ) : (
              <I.Phone className="h-4 w-4 text-[var(--scl-text-secondary)]" />
            )}
          </button>
          {showBack && (
            <button onClick={() => navigate(-1)} className="haptic-tap flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:bg-[var(--scl-border)]">
              <I.ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="haptic-tap flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--scl-surface-alt)] text-[var(--scl-text-secondary)] transition hover:bg-[var(--scl-border)]">
            {menuOpen ? <I.X className="h-5 w-5" /> : <I.Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute left-0 top-full z-40 w-full border-b border-[var(--scl-border)] bg-[var(--scl-card)] shadow-xl animate-slide-down md:hidden">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {[
              { label: "Trips", action: () => navigate("/") },
              { label: "Parcels", action: () => {} },
              { label: "Help", action: () => {} },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={() => { setMenuOpen(false); action(); }}
                className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-[var(--scl-text)] transition hover:bg-[#8B7D3C]/5 hover:text-[#8B7D3C]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
