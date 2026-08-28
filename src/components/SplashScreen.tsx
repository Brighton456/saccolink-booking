import { useEffect, useState } from "react";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"logo" | "text" | "exit">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 1800);
    const t3 = setTimeout(onComplete, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a0a] via-[#2d2a14] to-[#1a1a0a] transition-opacity duration-500 ${phase === "exit" ? "opacity-0" : "opacity-100"}`}>
      {/* Decorative rings */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 animate-pulse-soft" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" style={{ animationDelay: "0.5s" }} />
        <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
      </div>

      {/* Logo */}
      <div className={`relative z-10 mb-6 transition-all duration-700 ${phase === "logo" ? "scale-100 opacity-100" : "scale-110 opacity-100"}`}>
        <img src="/kangaroo-logo.png" alt="Kangaroo Shuttle" className="h-28 w-auto drop-shadow-2xl" style={{ animation: "splashPulse 2s ease-in-out infinite" }} />
      </div>

      {/* Text */}
      <div className={`relative z-10 text-center transition-all duration-500 ${phase === "logo" ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"}`}>
        <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-white">
          Kangaroo <span className="text-[#B8A94E]">Shuttle</span>
        </h1>
        <p className="text-sm font-medium tracking-widest text-white/60 uppercase">Book. Ride. Arrive.</p>
      </div>

      {/* Loading dots */}
      <div className={`relative z-10 mt-12 flex gap-2 transition-opacity duration-300 ${phase === "exit" ? "opacity-0" : "opacity-100"}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-white/50"
            style={{
              animation: "pulseSoft 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
