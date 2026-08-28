import { useEffect, useRef, useState } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(100);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setTranslateY(0));
    } else {
      setTranslateY(100);
    }
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setTranslateY(Math.min(100, (delta / (window.innerHeight * 0.6)) * 100));
  };

  const handleTouchEnd = () => {
    setDragging(false);
    if (translateY > 40) onClose();
    else setTranslateY(0);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0 }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 rounded-t-[2rem] bg-[var(--scl-card)] shadow-2xl transition-transform duration-300"
        style={{
          transform: `translateY(${translateY}%)`,
          transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          maxHeight: "85vh",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
        {/* Title */}
        {title && (
          <div className="border-b border-[var(--scl-border)] px-6 pb-3">
            <h3 className="text-lg font-bold text-[var(--scl-text)]">{title}</h3>
          </div>
        )}
        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(85vh - 60px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
