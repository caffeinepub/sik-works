import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HardHat, Building2, Users, Wallet, TrendingUp } from "lucide-react";
import { useGetDashboard } from "../hooks/useQueries";
import { formatCurrency } from "../utils/dateUtils";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useGetDashboard();

  const stats = [
    {
      label: "Active Workers",
      value: isLoading ? null : Number(dashboard?.activeWorkers ?? 0),
      icon: <Users className="w-5 h-5" />,
      format: (v: number) => v.toString(),
      color: "oklch(0.84 0.165 89.2)",
    },
    {
      label: "Pending Balance",
      value: isLoading ? null : Number(dashboard?.totalPendingBalance ?? 0),
      icon: <Wallet className="w-5 h-5" />,
      format: (v: number) => formatCurrency(v),
      color: "oklch(0.65 0.17 162.48)",
    },
    {
      label: "Total Sites",
      value: null,
      icon: <TrendingUp className="w-5 h-5" />,
      format: () => "—",
      color: "oklch(0.72 0.20 27.325)",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Page heading */}
      <div className="mb-8">
        <h2
          className="font-display text-4xl font-black uppercase tracking-wider"
          style={{ color: "oklch(0.84 0.165 89.2)" }}
        >
          Dashboard
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Overview of your construction labor operations
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-border bg-card overflow-hidden"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono-code uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                >
                  {stat.icon}
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p
                  className="font-display text-3xl font-black"
                  style={{ color: stat.color }}
                >
                  {stat.value !== null ? stat.format(stat.value) : "—"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workers Card */}
        <button
          type="button"
          onClick={() => navigate({ to: "/workers" })}
          className="group text-left"
        >
          <Card
            className="border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: "oklch(0.17 0 0)",
              borderColor: "oklch(0.28 0 0)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
          >
            {/* Yellow accent bar */}
            <div
              className="h-1.5 w-full transition-all duration-300 group-hover:h-2"
              style={{ backgroundColor: "oklch(0.84 0.165 89.2)" }}
            />

            <CardContent className="p-7">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: "oklch(0.84 0.165 89.2 / 0.15)",
                    border: "2px solid oklch(0.84 0.165 89.2 / 0.3)",
                  }}
                >
                  <HardHat
                    className="w-8 h-8"
                    style={{ color: "oklch(0.84 0.165 89.2)" }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    className="font-display text-3xl font-black uppercase tracking-wide transition-colors duration-300 group-hover:text-primary"
                    style={{ color: "oklch(0.96 0 0)" }}
                  >
                    Workers
                  </h3>
                  <p className="text-sm mt-1.5" style={{ color: "oklch(0.55 0 0)" }}>
                    Manage worker attendance & salary
                  </p>

                  {/* Stats chips */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {isLoading ? (
                      <Skeleton className="h-6 w-24" />
                    ) : (
                      <span
                        className="px-2.5 py-1 rounded-md text-xs font-mono-code font-semibold"
                        style={{
                          backgroundColor: "oklch(0.84 0.165 89.2 / 0.15)",
                          color: "oklch(0.84 0.165 89.2)",
                        }}
                      >
                        {Number(dashboard?.activeWorkers ?? 0)} Active Workers
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1"
                  style={{
                    backgroundColor: "oklch(0.84 0.165 89.2 / 0.15)",
                    color: "oklch(0.84 0.165 89.2)",
                  }}
                >
                  →
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        {/* Owner/Builder Card */}
        <button
          type="button"
          onClick={() => navigate({ to: "/owners" })}
          className="group text-left"
        >
          <Card
            className="border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: "oklch(0.17 0 0)",
              borderColor: "oklch(0.28 0 0)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
          >
            {/* Yellow accent bar */}
            <div
              className="h-1.5 w-full transition-all duration-300 group-hover:h-2"
              style={{ backgroundColor: "oklch(0.84 0.165 89.2)" }}
            />

            <CardContent className="p-7">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: "oklch(0.84 0.165 89.2 / 0.15)",
                    border: "2px solid oklch(0.84 0.165 89.2 / 0.3)",
                  }}
                >
                  <Building2
                    className="w-8 h-8"
                    style={{ color: "oklch(0.84 0.165 89.2)" }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    className="font-display text-3xl font-black uppercase tracking-wide transition-colors duration-300 group-hover:text-primary"
                    style={{ color: "oklch(0.96 0 0)" }}
                  >
                    Owner / Builder
                  </h3>
                  <p className="text-sm mt-1.5" style={{ color: "oklch(0.55 0 0)" }}>
                    Manage labor categories & invoices
                  </p>

                  {/* Stats chips */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {isLoading ? (
                      <Skeleton className="h-6 w-24" />
                    ) : (
                      <span
                        className="px-2.5 py-1 rounded-md text-xs font-mono-code font-semibold"
                        style={{
                          backgroundColor: "oklch(0.84 0.165 89.2 / 0.15)",
                          color: "oklch(0.84 0.165 89.2)",
                        }}
                      >
                        ₹{Number(dashboard?.totalPendingBalance ?? 0).toLocaleString("en-IN")} Pending
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1"
                  style={{
                    backgroundColor: "oklch(0.84 0.165 89.2 / 0.15)",
                    color: "oklch(0.84 0.165 89.2)",
                  }}
                >
                  →
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 SIK Works. Built with ❤️ using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </main>
  );
}
