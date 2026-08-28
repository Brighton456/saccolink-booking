import { useLocation, useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import * as I from "@/icons";

const tabs = [
  { path: "/", label: "Home", icon: I.Bus },
  { path: "/results", label: "Trips", icon: I.MapPin },
  { path: "/ticket", label: "Ticket", icon: I.Ticket },
  { path: "/profile", label: "Profile", icon: I.Phone },
] as const;

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { history } = useBooking();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/ticket") return location.pathname === "/ticket";
    return location.pathname.startsWith(path);
  };

  /* Map sub-routes to their parent tab */
  const activeTab = (() => {
    const p = location.pathname;
    if (p === "/") return "/";
    if (p.startsWith("/results") || p.startsWith("/select-seats") || p.startsWith("/checkout")) return "/results";
    if (p.startsWith("/ticket")) return "/ticket";
    if (p.startsWith("/profile")) return "/profile";
    return "/";
  })();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--scl-border)] bg-[var(--scl-surface)] pb-[env(safe-area-inset-bottom)] transition-colors duration-300 md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = activeTab === path;
          return (
            <button
              key={path}
              onClick={() => {
                if (path === "/ticket" && history.length > 0) navigate(path);
                else if (path !== "/ticket") navigate(path);
              }}
              className="relative flex flex-col items-center gap-0.5 py-2 px-4 pt-3 transition-all duration-200"
            >
              {/* Material Design 3 active indicator pill */}
              {active && (
                <div className="absolute inset-x-1 top-1 h-8 rounded-full bg-[#8B7D3C]/12 transition-all duration-300" />
              )}
              <div className={`relative z-10 transition-all duration-200 ${active ? "text-[#8B7D3C] scale-110" : "text-[var(--scl-text-secondary)]"}`}>
                <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={`relative z-10 text-[10px] font-semibold tracking-wide transition-all duration-200 ${
                active ? "text-[#8B7D3C]" : "text-[var(--scl-text-secondary)]"
              }`}>
                {label}
              </span>
              {label === "Ticket" && history.length > 0 && !active && (
                <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-[#8B7D3C]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
