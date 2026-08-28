import { useCallback, useEffect, useState } from "react";

/* ─── Haptic Feedback (vibration on supported devices) ─── */
export function useHaptic() {
  return useCallback((pattern: "tap" | "success" | "error" = "tap") => {
    if (!navigator.vibrate) return;
    switch (pattern) {
      case "tap": navigator.vibrate(10); break;
      case "success": navigator.vibrate([10, 50, 10]); break;
      case "error": navigator.vibrate([30, 30, 30]); break;
    }
  }, []);
}

/* ─── Countdown Timer ─── */
export function useCountdown(targetISO: string) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(targetISO).getTime() - Date.now();
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      const diff = new Date(targetISO).getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetISO, remaining]);

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  return { hours, minutes, seconds, total: remaining, expired: remaining <= 0 };
}

/* ─── Pull To Refresh ─── */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const active = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      active.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!active.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(120, delta * 0.5));
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 80) {
      setPulling(true);
      await onRefresh();
      setPulling(false);
    }
    setPullDistance(0);
    active.current = false;
  }, [pullDistance, onRefresh]);

  return { pulling, pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd };
}

function useRef<T>(initial: T) {
  const ref = { current: initial };
  return ref;
}

/* ─── Swipe Detection ─── */
export function useSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void, threshold = 60) {
  const startX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(delta) >= threshold) {
      if (delta > 0) onSwipeRight?.();
      else onSwipeLeft?.();
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { handleTouchStart, handleTouchEnd };
}
