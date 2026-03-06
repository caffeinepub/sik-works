import { useEffect, useState } from "react";
import { HardHat } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2200);
    const finishTimer = setTimeout(() => onFinish(), 2700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* Construction stripe header */}
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{
          background:
            "repeating-linear-gradient(-45deg, oklch(0.84 0.165 89.2), oklch(0.84 0.165 89.2) 10px, #0a0a0a 10px, #0a0a0a 20px)",
        }}
      />

      {/* Logo container */}
      <div className="flex flex-col items-center gap-6">
        {/* Logo with glow */}
        <div
          className="animate-splash-in relative"
          style={{ animationDuration: "0.8s" }}
        >
          <div
            className="rounded-2xl p-2 animate-pulse-glow"
            style={{ background: "oklch(0.17 0 0)" }}
          >
            <img
              src="/assets/generated/sik-works-logo-transparent.dim_400x400.png"
              alt="SIK Works Logo"
              className="w-28 h-28 object-contain"
              onError={(e) => {
                // Fallback if image not found
                const target = e.currentTarget;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div
              className="w-28 h-28 items-center justify-center hidden"
              style={{ display: "none" }}
            >
              <HardHat
                className="w-16 h-16"
                style={{ color: "oklch(0.84 0.165 89.2)" }}
              />
            </div>
          </div>
        </div>

        {/* App name */}
        <div
          className="animate-slide-up text-center delay-200"
          style={{ animationFillMode: "both" }}
        >
          <h1
            className="font-display text-6xl font-black tracking-widest uppercase"
            style={{ color: "oklch(0.84 0.165 89.2)" }}
          >
            SIK Works
          </h1>
          <p
            className="font-body text-sm tracking-[0.3em] uppercase mt-2"
            style={{ color: "oklch(0.6 0 0)" }}
          >
            Construction Labor Management
          </p>
        </div>

        {/* Loading dots */}
        <div
          className="flex gap-2 animate-slide-up delay-600"
          style={{ animationFillMode: "both" }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: "oklch(0.84 0.165 89.2)",
                animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Construction stripe footer */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2"
        style={{
          background:
            "repeating-linear-gradient(-45deg, oklch(0.84 0.165 89.2), oklch(0.84 0.165 89.2) 10px, #0a0a0a 10px, #0a0a0a 20px)",
        }}
      />
    </div>
  );
}
