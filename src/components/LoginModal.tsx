import { useState } from "react";
import { usePassenger } from "@/context/PassengerAuth";
import * as I from "@/icons";

export default function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, signUp, passenger, signOut } = usePassenger();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  /* If already logged in, show profile */
  if (passenger) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center" onClick={onClose}>
        <div className="w-full max-w-sm rounded-t-3xl bg-[var(--scl-card)] p-6 shadow-2xl animate-slide-up md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[var(--scl-text)]">My Account</h2>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--scl-surface-alt)]"><I.X className="h-4 w-4" /></button>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#B8A94E] to-[#8B7D3C] text-2xl font-bold text-white">
              {passenger.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-bold text-[var(--scl-text)]">{passenger.name}</p>
              <p className="text-xs text-[var(--scl-text-secondary)]">{passenger.email}</p>
              {passenger.phone && <p className="text-xs text-[var(--scl-text-secondary)]">{passenger.phone}</p>}
            </div>
          </div>

          {/* Points / Rewards */}
          <div className="mb-6 rounded-2xl border border-[#8B7D3C]/20 bg-gradient-to-r from-[#8B7D3C]/5 to-[#B8A94E]/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8B7D3C]">Reward Points</p>
                <p className="text-2xl font-extrabold text-[#8B7D3C]">{passenger.points.toLocaleString()}</p>
              </div>
              <div className="text-3xl">🎁</div>
            </div>
            <p className="mt-2 text-[10px] text-[var(--scl-text-secondary)]">
              Earn 50 points per booking. Redeem for discounts!
            </p>
          </div>

          <button
            onClick={() => { signOut(); onClose(); }}
            className="w-full rounded-2xl border-2 border-red-300 py-3 text-sm font-bold text-red-500 transition hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        const err = await signIn(email, password);
        if (err) { setError(err); setBusy(false); return; }
      } else {
        if (!name.trim()) { setError("Name is required"); setBusy(false); return; }
        const err = await signUp(email, password, name, phone);
        if (err) { setError(err); setBusy(false); return; }
      }
      onClose();
    } catch {
      setError("Something went wrong");
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl bg-[var(--scl-card)] p-6 shadow-2xl animate-slide-up md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[var(--scl-text)]">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--scl-surface-alt)]"><I.X className="h-4 w-4" /></button>
        </div>

        {mode === "register" && (
          <p className="mb-4 text-xs text-[var(--scl-text-secondary)]">
            🎁 Get <b>100 bonus points</b> when you sign up! Earn rewards on every booking.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-4 py-3 text-sm text-[var(--scl-text)] outline-none focus:border-[#8B7D3C]"
                required
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-4 py-3 text-sm text-[var(--scl-text)] outline-none focus:border-[#8B7D3C]"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-4 py-3 text-sm text-[var(--scl-text)] outline-none focus:border-[#8B7D3C]"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--scl-border)] bg-[var(--scl-surface-alt)] px-4 py-3 text-sm text-[var(--scl-text)] outline-none focus:border-[#8B7D3C]"
            required
            minLength={6}
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-gradient-to-r from-[#B8A94E] to-[#8B7D3C] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#8B7D3C]/25 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="text-xs font-semibold text-[#8B7D3C] hover:underline"
          >
            {mode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>

        <div className="mt-3 text-center">
          <button onClick={onClose} className="text-xs text-[var(--scl-text-secondary)] hover:underline">
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
