import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut, Sun, Moon, HardHat, Menu, X } from "lucide-react";
import { useState } from "react";

interface AppHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function AppHeader({ isDark, onToggleTheme }: AppHeaderProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      {/* Construction stripe accent */}
      <div
        className="h-1 w-full"
        style={{
          background:
            "repeating-linear-gradient(-45deg, oklch(0.84 0.165 89.2), oklch(0.84 0.165 89.2) 8px, transparent 8px, transparent 16px)",
          backgroundColor: "oklch(0.12 0 0)",
        }}
      />

      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            <img
              src="/assets/generated/sik-works-logo-transparent.dim_400x400.png"
              alt="SIK Works"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.parentElement?.querySelector(".fallback-icon") as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div className="fallback-icon hidden items-center justify-center w-full h-full">
              <HardHat className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-xl font-black tracking-wider text-primary uppercase leading-none">
              SIK Works
            </h1>
            <p className="text-xs text-muted-foreground font-mono-code hidden sm:block">
              Labor Management
            </p>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {identity && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground border-border hover:border-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Logout
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className="justify-start text-muted-foreground"
          >
            {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            {isDark ? "Light Mode" : "Dark Mode"}
          </Button>
          {identity && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="justify-start text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
