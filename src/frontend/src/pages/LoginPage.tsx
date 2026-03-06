import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, HardHat, Shield } from "lucide-react";

export default function LoginPage() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Login error:", err);
        if (err.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "oklch(0.10 0 0)" }}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.84 0.165 89.2) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.84 0.165 89.2) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Corner stripes */}
      <div
        className="absolute top-0 left-0 w-32 h-2"
        style={{
          background:
            "repeating-linear-gradient(-45deg, oklch(0.84 0.165 89.2), oklch(0.84 0.165 89.2) 8px, transparent 8px, transparent 16px)",
        }}
      />
      <div
        className="absolute top-0 right-0 w-32 h-2"
        style={{
          background:
            "repeating-linear-gradient(-45deg, oklch(0.84 0.165 89.2), oklch(0.84 0.165 89.2) 8px, transparent 8px, transparent 16px)",
        }}
      />

      {/* Login Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border overflow-hidden"
        style={{
          backgroundColor: "oklch(0.15 0 0)",
          borderColor: "oklch(0.28 0 0)",
          boxShadow: "0 0 60px oklch(0.84 0.165 89.2 / 0.1), 0 24px 48px rgba(0,0,0,0.6)",
        }}
      >
        {/* Yellow accent top bar */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: "oklch(0.84 0.165 89.2)" }}
        />

        <div className="p-8 flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                backgroundColor: "oklch(0.20 0 0)",
                boxShadow: "0 0 20px oklch(0.84 0.165 89.2 / 0.2)",
              }}
            >
              <img
                src="/assets/generated/sik-works-logo-transparent.dim_400x400.png"
                alt="SIK Works Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const next = e.currentTarget.nextElementSibling as HTMLElement;
                  if (next) next.style.display = "flex";
                }}
              />
              <div className="w-full h-full items-center justify-center" style={{ display: "none" }}>
                <HardHat className="w-10 h-10" style={{ color: "oklch(0.84 0.165 89.2)" }} />
              </div>
            </div>

            <div className="text-center">
              <h1
                className="font-display text-4xl font-black tracking-widest uppercase"
                style={{ color: "oklch(0.84 0.165 89.2)" }}
              >
                SIK Works
              </h1>
              <p className="text-sm font-body mt-1" style={{ color: "oklch(0.5 0 0)" }}>
                Construction Labor Management
              </p>
            </div>
          </div>

          {/* Divider */}
          <div
            className="w-full h-px"
            style={{ backgroundColor: "oklch(0.28 0 0)" }}
          />

          {/* Auth section */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center gap-2 text-center justify-center">
              <Shield className="w-4 h-4" style={{ color: "oklch(0.84 0.165 89.2)" }} />
              <p className="text-sm" style={{ color: "oklch(0.6 0 0)" }}>
                Secure login with Internet Identity
              </p>
            </div>

            <Button
              onClick={handleAuth}
              disabled={isLoggingIn}
              size="lg"
              className="w-full font-display text-lg font-bold tracking-wider uppercase transition-all duration-200"
              style={{
                backgroundColor: isLoggingIn ? "oklch(0.70 0.13 89.2)" : "oklch(0.84 0.165 89.2)",
                color: "oklch(0.10 0 0)",
                boxShadow: isLoggingIn ? "none" : "0 0 20px oklch(0.84 0.165 89.2 / 0.3)",
              }}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : isAuthenticated ? (
                "Logout"
              ) : (
                "Login to SIK Works"
              )}
            </Button>
          </div>

          {loginStatus === "loginError" && (
            <p className="text-sm text-destructive text-center">
              Login failed. Please try again.
            </p>
          )}
        </div>

        {/* Bottom stripe */}
        <div
          className="h-1 w-full"
          style={{
            background:
              "repeating-linear-gradient(-45deg, oklch(0.84 0.165 89.2), oklch(0.84 0.165 89.2) 8px, oklch(0.10 0 0) 8px, oklch(0.10 0 0) 16px)",
          }}
        />
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs relative z-10" style={{ color: "oklch(0.35 0 0)" }}>
        © 2026 SIK Works. Built with ❤️ using{" "}
        <a href="https://caffeine.ai" className="hover:underline" style={{ color: "oklch(0.55 0 0)" }}>
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
