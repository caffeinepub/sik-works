import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Share2,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useGetOwner,
  useGetLaborRecordsByOwner,
  useCreateLaborRecord,
  useUpdateLaborRecord,
  useDeleteLaborRecord,
  useGetWeeklyBalance,
  useCreateWeeklyBalance,
  useUpdateWeeklyBalance,
} from "../hooks/useQueries";
import type { LaborRecord } from "../backend.d";
import {
  getCurrentWeek,
  adjustWeek,
  formatWeekLabel,
  isDateInWeek,
  getDatesInWeek,
  formatDate,
  formatCurrency,
  getTodayString,
} from "../utils/dateUtils";

type LaborCategory = "Skilled" | "Semi-Skilled" | "Technician";

const CATEGORIES: LaborCategory[] = ["Skilled", "Semi-Skilled", "Technician"];

interface LaborFormData {
  date: string;
  morningCount: string;
  afternoonCount: string;
  dailyRate: string;
}

const DEFAULT_LABOR_FORM: LaborFormData = {
  date: getTodayString(),
  morningCount: "",
  afternoonCount: "",
  dailyRate: "",
};

export default function OwnerDetailPage() {
  const { ownerId } = useParams({ from: "/layout/owners/$ownerId" });
  const navigate = useNavigate();
  const ownerIdBigInt = BigInt(ownerId);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: owner, isLoading: ownerLoading } = useGetOwner(ownerIdBigInt);
  const { data: allRecords = [], isLoading: recordsLoading } =
    useGetLaborRecordsByOwner(ownerIdBigInt);

  const createRecord = useCreateLaborRecord();
  const updateRecord = useUpdateLaborRecord();
  const deleteRecord = useDeleteLaborRecord();
  const createBalance = useCreateWeeklyBalance();
  const updateBalance = useUpdateWeeklyBalance();

  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [activeTab, setActiveTab] = useState<LaborCategory>("Skilled");

  // Labor form state
  const [laborDialogOpen, setLaborDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LaborRecord | null>(null);
  const [laborForm, setLaborForm] = useState<LaborFormData>(DEFAULT_LABOR_FORM);

  // Weekly balance form
  const [prevBalance, setPrevBalance] = useState("0");
  const [advanceDeduction, setAdvanceDeduction] = useState("0");

  const weeklyBalanceKey = `${ownerId}-${selectedWeek}`;
  const { data: weeklyBalance } = useGetWeeklyBalance(weeklyBalanceKey);

  // Week records filtered
  const weekRecords = useMemo(
    () => allRecords.filter((r) => isDateInWeek(r.date, selectedWeek)),
    [allRecords, selectedWeek]
  );

  const recordsByCategory = useMemo(
    () => ({
      Skilled: weekRecords.filter((r) => r.category === "Skilled"),
      "Semi-Skilled": weekRecords.filter((r) => r.category === "Semi-Skilled"),
      Technician: weekRecords.filter((r) => r.category === "Technician"),
    }),
    [weekRecords]
  );

  const thisWeekTotal = useMemo(
    () =>
      weekRecords.reduce((sum, r) => sum + Number(r.totalAmount), 0),
    [weekRecords]
  );

  const prevBal = Number(prevBalance) || 0;
  const advDed = Number(advanceDeduction) || 0;
  const finalPayable = thisWeekTotal + prevBal - advDed;

  // Initialize balance form from fetched data
  useMemo(() => {
    if (weeklyBalance) {
      setPrevBalance(Number(weeklyBalance.prevBalance).toString());
      setAdvanceDeduction(Number(weeklyBalance.advanceDeduction).toString());
    } else {
      setPrevBalance("0");
      setAdvanceDeduction("0");
    }
  }, [weeklyBalance]);

  const openAddRecord = (category: LaborCategory) => {
    setEditingRecord(null);
    setLaborForm({
      ...DEFAULT_LABOR_FORM,
      date: getDatesInWeek(selectedWeek)[0] || getTodayString(),
    });
    setActiveTab(category);
    setLaborDialogOpen(true);
  };

  const openEditRecord = (record: LaborRecord) => {
    setEditingRecord(record);
    setLaborForm({
      date: record.date,
      morningCount: Number(record.morningCount).toString(),
      afternoonCount: Number(record.afternoonCount).toString(),
      dailyRate: Number(record.dailyRate).toString(),
    });
    setLaborDialogOpen(true);
  };

  const handleSaveRecord = async () => {
    const mc = BigInt(Math.round(Number(laborForm.morningCount) || 0));
    const ac = BigInt(Math.round(Number(laborForm.afternoonCount) || 0));
    const dr = BigInt(Math.round(Number(laborForm.dailyRate) || 0));

    if (dr === BigInt(0)) {
      toast.error("Daily rate is required");
      return;
    }

    try {
      if (editingRecord) {
        await updateRecord.mutateAsync({
          id: editingRecord.id,
          ownerId: ownerIdBigInt,
          category: editingRecord.category,
          date: laborForm.date,
          morningCount: mc,
          afternoonCount: ac,
          dailyRate: dr,
        });
        toast.success("Record updated");
      } else {
        await createRecord.mutateAsync({
          ownerId: ownerIdBigInt,
          category: activeTab,
          date: laborForm.date,
          morningCount: mc,
          afternoonCount: ac,
          dailyRate: dr,
        });
        toast.success("Record added");
      }
      setLaborDialogOpen(false);
    } catch {
      toast.error("Failed to save record");
    }
  };

  const handleDeleteRecord = async (record: LaborRecord) => {
    try {
      await deleteRecord.mutateAsync({ id: record.id, ownerId: ownerIdBigInt });
      toast.success("Record deleted");
    } catch {
      toast.error("Failed to delete record");
    }
  };

  const handleSaveSummary = async () => {
    const data = {
      ownerId: ownerIdBigInt,
      week: weeklyBalanceKey,
      prevBalance: BigInt(Math.round(prevBal)),
      advanceDeduction: BigInt(Math.round(advDed)),
      thisWeekTotal: BigInt(Math.round(thisWeekTotal)),
    };
    try {
      if (weeklyBalance) {
        await updateBalance.mutateAsync(data);
      } else {
        await createBalance.mutateAsync(data);
      }
      toast.success("Summary saved");
    } catch {
      toast.error("Failed to save summary");
    }
  };

  const handleShareWhatsApp = () => {
    if (!owner) return;
    const text = encodeURIComponent(
      `*SIK Works - Weekly Invoice*\n` +
        `Owner: ${owner.name}\n` +
        `Site: ${owner.site}\n` +
        `Week: ${formatWeekLabel(selectedWeek)}\n\n` +
        `This Week Total: ${formatCurrency(thisWeekTotal)}\n` +
        `Previous Balance: ${formatCurrency(prevBal)}\n` +
        `Advance/Deduction: ${formatCurrency(advDed)}\n` +
        `*Final Payable: ${formatCurrency(finalPayable)}*`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  const isSavingRecord = createRecord.isPending || updateRecord.isPending;
  const isSavingBalance = createBalance.isPending || updateBalance.isPending;

  if (ownerLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!owner) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Owner not found.</p>
        <Button type="button" onClick={() => navigate({ to: "/owners" })} className="mt-4">
          Back to Owners
        </Button>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-5 pb-24 no-print">
      {/* Back + heading */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/owners" })}
          className="text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2
          className="font-display text-3xl font-black uppercase tracking-wide"
          style={{ color: "oklch(0.84 0.165 89.2)" }}
        >
          {owner.name}
        </h2>
      </div>

      {/* Owner info */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="h-1" style={{ backgroundColor: "oklch(0.84 0.165 89.2)" }} />
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{owner.site}</span>
          </div>
        </CardContent>
      </Card>

      {/* Week selector */}
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setSelectedWeek((w) => adjustWeek(w, -1))}
          className="border-border hover:border-primary/50"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 text-center">
          <p className="font-display font-bold text-base text-foreground">
            {formatWeekLabel(selectedWeek)}
          </p>
          <p className="text-xs text-muted-foreground font-mono-code">
            {selectedWeek}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setSelectedWeek((w) => adjustWeek(w, 1))}
          className="border-border hover:border-primary/50"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Labor tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LaborCategory)}>
        <TabsList className="w-full grid grid-cols-3 bg-muted">
          {CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="font-display font-bold uppercase tracking-wide text-xs"
            >
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => {
          const records = recordsByCategory[cat];
          const catTotal = records.reduce(
            (sum, r) => sum + Number(r.totalAmount),
            0
          );

          return (
            <TabsContent key={cat} value={cat} className="space-y-3 mt-4">
              {/* Category total */}
              {records.length > 0 && (
                <div
                  className="flex justify-between items-center px-4 py-2 rounded-lg"
                  style={{ backgroundColor: "oklch(0.84 0.165 89.2 / 0.1)" }}
                >
                  <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {cat} Total
                  </span>
                  <span
                    className="font-display text-xl font-black"
                    style={{ color: "oklch(0.84 0.165 89.2)" }}
                  >
                    {formatCurrency(catTotal)}
                  </span>
                </div>
              )}

              {/* Records list */}
              {recordsLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : records.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No {cat} labor entries for this week
                </div>
              ) : (
                <div className="space-y-2">
                  {records.map((record) => (
                    <div
                      key={record.id.toString()}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-body font-semibold text-foreground">
                          {formatDate(record.date)}
                        </p>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>AM: {Number(record.morningCount)}</span>
                          <span>PM: {Number(record.afternoonCount)}</span>
                          <span>
                            Rate: {formatCurrency(Number(record.dailyRate))}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-display font-bold text-base"
                          style={{ color: "oklch(0.84 0.165 89.2)" }}
                        >
                          {formatCurrency(Number(record.totalAmount))}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-primary"
                          onClick={() => openEditRecord(record)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteRecord(record)}
                          disabled={deleteRecord.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add record button */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/10 font-display font-bold uppercase"
                onClick={() => openAddRecord(cat)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add {cat} Entry
              </Button>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Salary Summary */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="h-1" style={{ backgroundColor: "oklch(0.84 0.165 89.2)" }} />
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="font-display text-lg font-black uppercase tracking-wide text-primary">
            Salary Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Previous Balance (₹)
              </Label>
              <Input
                type="number"
                value={prevBalance}
                onChange={(e) => setPrevBalance(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Advance / Deduction (₹)
              </Label>
              <Input
                type="number"
                value={advanceDeduction}
                onChange={(e) => setAdvanceDeduction(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Summary display */}
          <div className="space-y-2">
            {[
              { label: "This Week Total", value: thisWeekTotal, color: "oklch(0.84 0.165 89.2)" },
              { label: "Previous Balance", value: prevBal, color: "oklch(0.6 0 0)" },
              { label: "Advance / Deduction", value: advDed, color: "oklch(0.65 0.22 27.325)", prefix: "-" },
            ].map(({ label, value, color, prefix }) => (
              <div key={label} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-display font-bold text-base" style={{ color }}>
                  {prefix}{formatCurrency(value)}
                </span>
              </div>
            ))}
            <Separator />
            <div
              className="flex items-center justify-between py-3 px-4 rounded-xl"
              style={{ backgroundColor: "oklch(0.84 0.165 89.2 / 0.12)" }}
            >
              <span
                className="font-display font-bold text-base uppercase tracking-wide"
                style={{ color: "oklch(0.84 0.165 89.2)" }}
              >
                Final Payable
              </span>
              <span
                className="font-display text-2xl font-black"
                style={{
                  color:
                    finalPayable >= 0
                      ? "oklch(0.84 0.165 89.2)"
                      : "oklch(0.65 0.22 27.325)",
                }}
              >
                {formatCurrency(finalPayable)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            <Button
              type="button"
              className="font-display font-bold uppercase"
              style={{
                backgroundColor: "oklch(0.84 0.165 89.2)",
                color: "oklch(0.10 0 0)",
              }}
              onClick={handleSaveSummary}
              disabled={isSavingBalance}
            >
              {isSavingBalance ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1.5" />
              )}
              Save
            </Button>

            <Button
              type="button"
              variant="outline"
              className="font-display font-bold uppercase border-border"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print PDF
            </Button>

            <Button
              type="button"
              variant="outline"
              className="font-display font-bold uppercase border-border text-green-600 hover:bg-green-600/10"
              onClick={handleShareWhatsApp}
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Print-only invoice view ── */}
      <div ref={printRef} className="print-only">
        <InvoicePrint
          owner={owner}
          week={selectedWeek}
          records={weekRecords}
          thisWeekTotal={thisWeekTotal}
          prevBalance={prevBal}
          advanceDeduction={advDed}
          finalPayable={finalPayable}
        />
      </div>

      {/* Labor entry Dialog */}
      <Dialog open={laborDialogOpen} onOpenChange={setLaborDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-black uppercase text-primary">
              {editingRecord ? `Edit ${editingRecord.category}` : `Add ${activeTab}`} Entry
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date *
              </Label>
              <Input
                type="date"
                value={laborForm.date}
                onChange={(e) =>
                  setLaborForm((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Morning Count
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={laborForm.morningCount}
                  onChange={(e) =>
                    setLaborForm((p) => ({ ...p, morningCount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Afternoon Count
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={laborForm.afternoonCount}
                  onChange={(e) =>
                    setLaborForm((p) => ({ ...p, afternoonCount: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Daily Rate (₹) per person *
              </Label>
              <Input
                type="number"
                placeholder="e.g. 800"
                value={laborForm.dailyRate}
                onChange={(e) =>
                  setLaborForm((p) => ({ ...p, dailyRate: e.target.value }))
                }
              />
            </div>

            {/* Preview total */}
            {laborForm.dailyRate && (
              <div
                className="flex justify-between items-center px-3 py-2 rounded-lg"
                style={{ backgroundColor: "oklch(0.84 0.165 89.2 / 0.1)" }}
              >
                <span className="text-sm text-muted-foreground">Preview Total</span>
                <span
                  className="font-display font-bold text-lg"
                  style={{ color: "oklch(0.84 0.165 89.2)" }}
                >
                  {formatCurrency(
                    ((Number(laborForm.morningCount) || 0) +
                      (Number(laborForm.afternoonCount) || 0)) *
                      (Number(laborForm.dailyRate) || 0) /
                      2
                  )}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLaborDialogOpen(false)}
              disabled={isSavingRecord}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveRecord}
              disabled={isSavingRecord}
              style={{
                backgroundColor: "oklch(0.84 0.165 89.2)",
                color: "oklch(0.10 0 0)",
              }}
            >
              {isSavingRecord && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSavingRecord ? "Saving..." : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// ── Print-only Invoice ────────────────────────────────────────────────────────

interface InvoicePrintProps {
  owner: { name: string; site: string };
  week: string;
  records: LaborRecord[];
  thisWeekTotal: number;
  prevBalance: number;
  advanceDeduction: number;
  finalPayable: number;
}

function InvoicePrint({
  owner,
  week,
  records,
  thisWeekTotal,
  prevBalance,
  advanceDeduction,
  finalPayable,
}: InvoicePrintProps) {
  const catGroups: Record<string, LaborRecord[]> = {
    Skilled: records.filter((r) => r.category === "Skilled"),
    "Semi-Skilled": records.filter((r) => r.category === "Semi-Skilled"),
    Technician: records.filter((r) => r.category === "Technician"),
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", color: "#000", background: "#fff" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #FACC15", paddingBottom: "12px", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "900", margin: 0, letterSpacing: "2px" }}>SIK Works</h1>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>Construction Labor Management</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>WEEKLY INVOICE</p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#555" }}>{formatWeekLabel(week)}</p>
        </div>
      </div>

      {/* Owner info */}
      <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>
        <p style={{ margin: 0, fontWeight: "bold", fontSize: "16px" }}>{owner.name}</p>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#555" }}>Site: {owner.site}</p>
      </div>

      {/* Labor tables per category */}
      {Object.entries(catGroups).map(([cat, recs]) =>
        recs.length > 0 ? (
          <div key={cat} style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "700", borderLeft: "4px solid #FACC15", paddingLeft: "8px" }}>
              {cat} Labor
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#111", color: "#fff" }}>
                  <th style={{ padding: "6px 10px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "6px 10px", textAlign: "center" }}>AM</th>
                  <th style={{ padding: "6px 10px", textAlign: "center" }}>PM</th>
                  <th style={{ padding: "6px 10px", textAlign: "right" }}>Rate</th>
                  <th style={{ padding: "6px 10px", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recs.map((r) => (
                  <tr key={r.id.toString()} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "6px 10px" }}>{formatDate(r.date)}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>{Number(r.morningCount)}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>{Number(r.afternoonCount)}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right" }}>{formatCurrency(Number(r.dailyRate))}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "bold" }}>{formatCurrency(Number(r.totalAmount))}</td>
                  </tr>
                ))}
                <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
                  <td colSpan={4} style={{ padding: "6px 10px" }}>Subtotal</td>
                  <td style={{ padding: "6px 10px", textAlign: "right" }}>
                    {formatCurrency(recs.reduce((s, r) => s + Number(r.totalAmount), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null
      )}

      {/* Summary */}
      <div style={{ borderTop: "2px solid #111", paddingTop: "16px", marginTop: "20px" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "700" }}>Payment Summary</h3>
        {[
          { label: "This Week Total", value: thisWeekTotal },
          { label: "Previous Balance", value: prevBalance },
          { label: "Advance / Deduction", value: -advanceDeduction },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
            <span>{label}</span>
            <span>{formatCurrency(value)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #FACC15", paddingTop: "10px", marginTop: "10px", fontWeight: "bold", fontSize: "16px" }}>
          <span>FINAL PAYABLE</span>
          <span>{formatCurrency(finalPayable)}</span>
        </div>
      </div>

      <p style={{ marginTop: "40px", fontSize: "11px", color: "#999", textAlign: "center" }}>
        Generated by SIK Works · caffeine.ai
      </p>
    </div>
  );
}
