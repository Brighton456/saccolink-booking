import { useLocation, useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import * as I from "@/icons";

const tabs = [
  { path: "/", label: "Home", icon: I.Bus },
  { path: "/all-trips", label: "Trips", icon: I.MapPin },
  { path: "/search", label: "Search", icon: I.ArrowRight, isCenter: true },
  { path: "/my-tickets", label: "Tickets", icon: I.Ticket },
  { path: "/support", label: "Support", icon: I.Phone },
] as const;

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { history } = useBooking();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/search") return location.pathname === "/search";
    return location.pathname.startsWith(path);
  };

  /* Map sub-routes to their parent tab */
  const activeTab = (() => {
    const p = location.pathname;
    if (p === "/") return "/";
    if (p.startsWith("/results") || p.startsWith("/select-seats") || p.startsWith("/checkout") || p.startsWith("/confirmation") || p.startsWith("/ticket")) return "/search";
    if (p.startsWith("/all-trips")) return "/all-trips";
    if (p.startsWith("/my-tickets")) return "/my-tickets";
    if (p.startsWith("/support")) return "/support";
    return "/";
  })();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--scl-border)] bg-[var(--scl-surface)] pb-[env(safe-area-inset-bottom)] transition-colors duration-300 md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1">
        {tabs.map(({ path, label, icon: Icon, isCenter }) => {
          const active = activeTab === path;
          
          /* Center "Search" button - raised FAB style */
          if (isCenter) {
            return (
              <button
                key={path}
                onClick={() => navigate("/")}
                className="relative -mt-5 flex flex-col items-center gap-0.5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#B8A94E] to-[#8B7D3C] shadow-lg shadow-[#8B7D3C]/30 transition-all active:scale-95">
                  <I.ArrowRight className="h-6 w-6 text-white -rotate-45" strokeWidth={2.5} />
                </div>
                <span className="text-[9px] font-bold text-[#8B7D3C]">{label}</span>
              </button>
            );
          }

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex flex-col items-center gap-0.5 py-2 px-3 pt-3 transition-all duration-200"
            >
              {/* Active indicator pill */}
              {active && (
                <div className="absolute inset-x-2 top-1 h-8 rounded-full bg-[#8B7D3C]/12 transition-all duration-300" />
              )}
              <div className={`relative z-10 transition-all duration-200 ${active ? "text-[#8B7D3C] scale-110" : "text-[var(--scl-text-secondary)]"}`}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={`relative z-10 text-[9px] font-semibold tracking-wide transition-all duration-200 ${
                active ? "text-[#8B7D3C]" : "text-[var(--scl-text-secondary)]"
              }`}>
                {label}
              </span>
              {/* Badge for tickets with history */}
              {label === "Tickets" && history.length > 0 && !active && (
                <span className="absolute right-1 top-1.5 h-2 w-2 rounded-full bg-[#8B7D3C]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
