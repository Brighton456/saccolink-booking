import { useBooking, type Notification } from "@/context/BookingContext";
import * as I from "@/icons";

const icons: Record<Notification["type"], React.ReactNode> = {
  success: <I.Check className="h-5 w-5 text-white" />,
  error: <I.X className="h-5 w-5 text-white" />,
  warning: <I.Shield className="h-5 w-5 text-white" />,
  info: <I.Phone className="h-5 w-5 text-white" />,
};

const colors: Record<Notification["type"], string> = {
  success: "bg-[#16a34a]",
  error: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-gray-800",
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useBooking();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed left-0 right-0 top-4 z-[90] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl ${colors[toast.type]} px-5 py-3.5 shadow-xl`}
          style={{ animation: "toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
          onClick={() => dismissToast(toast.id)}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
            {icons[toast.type]}
          </div>
          <p className="flex-1 text-sm font-semibold text-white">{toast.message}</p>
          <button onClick={(e) => { e.stopPropagation(); dismissToast(toast.id); }} className="shrink-0 text-white/60 transition hover:text-white">
            <I.X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
