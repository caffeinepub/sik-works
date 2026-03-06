import { useState, useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ChevronLeft,
  Sun,
  Moon,
  Loader2,
  Phone,
  MapPin,
  IndianRupee,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  useGetWorker,
  useGetAttendanceByWorker,
  useCreateAttendance,
  useUpdateAttendance,
  useGetAdvancesByWorker,
  useCreateAdvance,
  useDeleteAdvance,
} from "../hooks/useQueries";
import type { Attendance } from "../backend.d";
import {
  getTodayString,
  getCurrentWeek,
  getDatesInWeek,
  isDateInWeek,
  formatDate,
  formatCurrency,
} from "../utils/dateUtils";

export default function WorkerDetailPage() {
  const { workerId } = useParams({ from: "/layout/workers/$workerId" });
  const navigate = useNavigate();
  const workerIdBigInt = BigInt(workerId);

  const { data: worker, isLoading: workerLoading } = useGetWorker(workerIdBigInt);
  const { data: attendances = [], isLoading: attLoading } =
    useGetAttendanceByWorker(workerIdBigInt);
  const { data: advances = [], isLoading: advLoading } =
    useGetAdvancesByWorker(workerIdBigInt);

  const createAtt = useCreateAttendance();
  const updateAtt = useUpdateAttendance();
  const createAdv = useCreateAdvance();
  const deleteAdv = useDeleteAdvance();

  const today = getTodayString();
  const currentWeek = getCurrentWeek();

  const [selectedDate, setSelectedDate] = useState(today);
  const [morningPresent, setMorningPresent] = useState(true);
  const [afternoonPresent, setAfternoonPresent] = useState(true);

  // Advance form
  const [advAmount, setAdvAmount] = useState("");
  const [advDate, setAdvDate] = useState(today);
  const [advNote, setAdvNote] = useState("");

  // Pre-fill attendance from existing record when date changes
  const existingAtt = attendances.find((a: Attendance) => a.date === selectedDate);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    const att = attendances.find((a: Attendance) => a.date === date);
    if (att) {
      setMorningPresent(att.morningPresent);
      setAfternoonPresent(att.afternoonPresent);
    } else {
      setMorningPresent(true);
      setAfternoonPresent(true);
    }
  };

  const handleSaveAttendance = async () => {
    if (!worker) return;
    try {
      if (existingAtt) {
        await updateAtt.mutateAsync({
          workerId: workerIdBigInt,
          date: selectedDate,
          morningPresent,
          afternoonPresent,
        });
        toast.success("Attendance updated");
      } else {
        await createAtt.mutateAsync({
          workerId: workerIdBigInt,
          date: selectedDate,
          morningPresent,
          afternoonPresent,
        });
        toast.success("Attendance saved");
      }
    } catch {
      toast.error("Failed to save attendance");
    }
  };

  const handleAddAdvance = async () => {
    if (!advAmount || Number(advAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await createAdv.mutateAsync({
        workerId: workerIdBigInt,
        amount: BigInt(Math.round(Number(advAmount))),
        date: advDate,
        note: advNote,
      });
      setAdvAmount("");
      setAdvNote("");
      toast.success("Advance added");
    } catch {
      toast.error("Failed to add advance");
    }
  };

  const handleDeleteAdvance = async (date: string) => {
    try {
      await deleteAdv.mutateAsync({ workerId: workerIdBigInt, date });
      toast.success("Advance deleted");
    } catch {
      toast.error("Failed to delete advance");
    }
  };

  // Salary calculations for current week
  const weekSalary = useMemo(() => {
    if (!worker) return 0;
    const dailyRate = Number(worker.dailyRate);
    const weekDates = getDatesInWeek(currentWeek);
    let total = 0;
    weekDates.forEach((date) => {
      const att = attendances.find((a: Attendance) => a.date === date);
      if (att) {
        if (att.morningPresent && att.afternoonPresent) total += dailyRate;
        else if (att.morningPresent || att.afternoonPresent) total += dailyRate / 2;
      }
    });
    return total;
  }, [worker, attendances, currentWeek]);

  const weekAdvances = useMemo(() => {
    return advances
      .filter((a) => isDateInWeek(a.date, currentWeek))
      .reduce((sum, a) => sum + Number(a.amount), 0);
  }, [advances, currentWeek]);

  const balancedSalary = weekSalary - weekAdvances;

  // Last 7 days attendance
  const last7Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  }, [today]);

  if (workerLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </main>
    );
  }

  if (!worker) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Worker not found.</p>
        <Button type="button" onClick={() => navigate({ to: "/workers" })} className="mt-4">
          Back to Workers
        </Button>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/workers" })}
          className="text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2
          className="font-display text-3xl font-black uppercase tracking-wide"
          style={{ color: "oklch(0.84 0.165 89.2)" }}
        >
          Worker Details
        </h2>
      </div>

      {/* Worker info card */}
      <Card className="border-border bg-card overflow-hidden">
        <div
          className="h-1"
          style={{ backgroundColor: "oklch(0.84 0.165 89.2)" }}
        />
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-2xl font-black shrink-0"
              style={{
                backgroundColor: "oklch(0.84 0.165 89.2 / 0.15)",
                color: "oklch(0.84 0.165 89.2)",
              }}
            >
              {worker.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-display text-2xl font-black text-foreground">
                {worker.name}
              </h3>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {worker.mobile}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {worker.site}
                </span>
                <span
                  className="flex items-center gap-1 font-semibold"
                  style={{ color: "oklch(0.84 0.165 89.2)" }}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  {Number(worker.dailyRate).toLocaleString("en-IN")}/day
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="attendance">
        <TabsList className="w-full grid grid-cols-2 bg-muted">
          <TabsTrigger value="attendance" className="font-display font-bold uppercase tracking-wide text-sm">
            Attendance
          </TabsTrigger>
          <TabsTrigger value="salary" className="font-display font-bold uppercase tracking-wide text-sm">
            Salary
          </TabsTrigger>
        </TabsList>

        {/* ── Attendance tab ── */}
        <TabsContent value="attendance" className="space-y-4 mt-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="font-display text-base font-black uppercase tracking-wide text-muted-foreground">
                Mark Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {/* Date picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={today}
                />
              </div>

              {/* Morning / Afternoon toggles */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Morning", value: morningPresent, set: setMorningPresent, icon: <Sun className="w-4 h-4" /> },
                  { label: "Afternoon", value: afternoonPresent, set: setAfternoonPresent, icon: <Moon className="w-4 h-4" /> },
                ].map(({ label, value, set, icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => set(!value)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200"
                    style={{
                      backgroundColor: value
                        ? "oklch(0.84 0.165 89.2 / 0.15)"
                        : "oklch(0.15 0 0 / 0.5)",
                      borderColor: value
                        ? "oklch(0.84 0.165 89.2 / 0.6)"
                        : "oklch(0.28 0 0)",
                      color: value
                        ? "oklch(0.84 0.165 89.2)"
                        : "oklch(0.5 0 0)",
                    }}
                  >
                    {icon}
                    <span className="text-sm font-bold font-display uppercase tracking-wide">
                      {label}
                    </span>
                    <span className="text-xs">
                      {value ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </span>
                    <span className="text-xs font-mono-code">
                      {value ? "PRESENT" : "ABSENT"}
                    </span>
                  </button>
                ))}
              </div>

              <Button
                type="button"
                className="w-full font-display font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: "oklch(0.84 0.165 89.2)",
                  color: "oklch(0.10 0 0)",
                }}
                disabled={createAtt.isPending || updateAtt.isPending}
                onClick={handleSaveAttendance}
              >
                {(createAtt.isPending || updateAtt.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {existingAtt ? "Update Attendance" : "Save Attendance"}
              </Button>
            </CardContent>
          </Card>

          {/* Last 7 days attendance history */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="font-display text-base font-black uppercase tracking-wide text-muted-foreground">
                Last 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {attLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {last7Days.map((date) => {
                    const att = attendances.find((a: Attendance) => a.date === date);
                    const isToday = date === today;
                    return (
                      <div
                        key={date}
                        className="flex items-center justify-between py-2 px-3 rounded-lg"
                        style={{
                          backgroundColor: isToday
                            ? "oklch(0.84 0.165 89.2 / 0.08)"
                            : "oklch(0.15 0 0 / 0.3)",
                        }}
                      >
                        <span
                          className="text-sm font-body"
                          style={{ color: isToday ? "oklch(0.84 0.165 89.2)" : undefined }}
                        >
                          {formatDate(date)}
                          {isToday && (
                            <span className="ml-1 text-xs opacity-60">(today)</span>
                          )}
                        </span>
                        {att ? (
                          <div className="flex gap-2 text-xs">
                            <span
                              className="px-1.5 py-0.5 rounded font-mono-code"
                              style={{
                                backgroundColor: att.morningPresent
                                  ? "oklch(0.65 0.17 162.48 / 0.2)"
                                  : "oklch(0.5 0 0 / 0.2)",
                                color: att.morningPresent
                                  ? "oklch(0.65 0.17 162.48)"
                                  : "oklch(0.55 0 0)",
                              }}
                            >
                              AM
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded font-mono-code"
                              style={{
                                backgroundColor: att.afternoonPresent
                                  ? "oklch(0.65 0.17 162.48 / 0.2)"
                                  : "oklch(0.5 0 0 / 0.2)",
                                color: att.afternoonPresent
                                  ? "oklch(0.65 0.17 162.48)"
                                  : "oklch(0.55 0 0)",
                              }}
                            >
                              PM
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono-code">
                            —
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Salary tab ── */}
        <TabsContent value="salary" className="space-y-4 mt-4">
          {/* Weekly summary */}
          <Card className="border-border bg-card overflow-hidden">
            <div
              className="h-1"
              style={{ backgroundColor: "oklch(0.84 0.165 89.2)" }}
            />
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="font-display text-base font-black uppercase tracking-wide text-muted-foreground">
                This Week Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 space-y-3">
              {[
                { label: "Daily Salary", value: Number(worker.dailyRate), color: "oklch(0.6 0 0)" },
                { label: "Week Salary", value: weekSalary, color: "oklch(0.84 0.165 89.2)" },
                { label: "Total Advances", value: weekAdvances, color: "oklch(0.65 0.22 27.325)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span
                    className="font-display text-xl font-black"
                    style={{ color }}
                  >
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
              <div
                className="flex items-center justify-between py-3 px-3 rounded-xl mt-2"
                style={{ backgroundColor: "oklch(0.84 0.165 89.2 / 0.1)" }}
              >
                <span
                  className="font-display font-bold text-sm uppercase tracking-wide"
                  style={{ color: "oklch(0.84 0.165 89.2)" }}
                >
                  Balanced Salary
                </span>
                <span
                  className="font-display text-2xl font-black"
                  style={{
                    color:
                      balancedSalary >= 0
                        ? "oklch(0.84 0.165 89.2)"
                        : "oklch(0.65 0.22 27.325)",
                  }}
                >
                  {formatCurrency(balancedSalary)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Add Advance */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="font-display text-base font-black uppercase tracking-wide text-muted-foreground">
                Add Advance
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Amount (₹)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 500"
                    value={advAmount}
                    onChange={(e) => setAdvAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={advDate}
                    onChange={(e) => setAdvDate(e.target.value)}
                    max={today}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Note (optional)
                </Label>
                <Input
                  placeholder="Reason for advance"
                  value={advNote}
                  onChange={(e) => setAdvNote(e.target.value)}
                />
              </div>
              <Button
                type="button"
                className="w-full font-display font-bold uppercase"
                style={{
                  backgroundColor: "oklch(0.84 0.165 89.2)",
                  color: "oklch(0.10 0 0)",
                }}
                disabled={createAdv.isPending}
                onClick={handleAddAdvance}
              >
                {createAdv.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Plus className="w-4 h-4 mr-1" />
                Add Advance
              </Button>
            </CardContent>
          </Card>

          {/* Advance history */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="font-display text-base font-black uppercase tracking-wide text-muted-foreground">
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {advLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : advances.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No advances recorded
                </p>
              ) : (
                <div className="space-y-2">
                  {[...advances]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((adv) => (
                      <div
                        key={`${adv.workerId}-${adv.date}`}
                        className="flex items-center justify-between py-2 px-3 rounded-lg"
                        style={{ backgroundColor: "oklch(0.15 0 0 / 0.4)" }}
                      >
                        <div>
                          <p className="text-sm font-body text-foreground">
                            {formatDate(adv.date)}
                          </p>
                          {adv.note && (
                            <p className="text-xs text-muted-foreground">{adv.note}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="font-display font-bold text-base"
                            style={{ color: "oklch(0.65 0.22 27.325)" }}
                          >
                            -{formatCurrency(Number(adv.amount))}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteAdvance(adv.date)}
                            disabled={deleteAdv.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
