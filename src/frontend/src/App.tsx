import { useState, useEffect, useCallback } from "react";
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import SplashScreen from "./components/SplashScreen";
import ProfileSetup from "./components/ProfileSetup";
import AppHeader from "./components/AppHeader";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import WorkersPage from "./pages/WorkersPage";
import WorkerDetailPage from "./pages/WorkerDetailPage";
import OwnersPage from "./pages/OwnersPage";
import OwnerDetailPage from "./pages/OwnerDetailPage";

// ─── Theme ────────────────────────────────────────────────────────────────────

function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("sikworks-theme");
    return stored ? stored === "dark" : true; // default dark
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("sikworks-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((d) => !d), []);

  return { isDark, toggle };
}

// ─── Layout with Auth Guard ───────────────────────────────────────────────────

function AuthenticatedLayout({
  isDark,
  onToggleTheme,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    isFetched &&
    userProfile === null;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "oklch(0.84 0.165 89.2)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showProfileSetup && <ProfileSetup onComplete={() => {}} />}
      <AppHeader isDark={isDark} onToggleTheme={onToggleTheme} />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// We need to pass theme props down; use a wrapper pattern
let globalIsDark = true;
let globalToggleTheme = () => {};

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: () => (
    <AuthenticatedLayout isDark={globalIsDark} onToggleTheme={globalToggleTheme} />
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: DashboardPage,
});

const workersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/workers",
  component: WorkersPage,
});

const workerDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/workers/$workerId",
  component: WorkerDetailPage,
});

const ownersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/owners",
  component: OwnersPage,
});

const ownerDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/owners/$ownerId",
  component: OwnerDetailPage,
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    indexRoute,
    workersRoute,
    workerDetailRoute,
    ownersRoute,
    ownerDetailRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { isDark, toggle } = useTheme();

  // Inject theme into global so route components can access it
  globalIsDark = isDark;
  globalToggleTheme = toggle;

  return (
    <>
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}
      {!showSplash && (
        <RouterProvider router={router} />
      )}
      <Toaster
        theme={isDark ? "dark" : "light"}
        toastOptions={{
          style: {
            background: "oklch(0.17 0 0)",
            border: "1px solid oklch(0.28 0 0)",
            color: "oklch(0.96 0 0)",
          },
        }}
      />
    </>
  );
}
