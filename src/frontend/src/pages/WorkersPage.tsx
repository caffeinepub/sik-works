import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Search,
  HardHat,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  ChevronLeft,
  Loader2,
  IndianRupee,
} from "lucide-react";
import {
  useListWorkers,
  useCreateWorker,
  useUpdateWorker,
  useDeleteWorker,
  useListSites,
  useCreateSite,
} from "../hooks/useQueries";
import type { Worker } from "../backend.d";

interface WorkerFormData {
  name: string;
  mobile: string;
  site: string;
  dailyRate: string;
  active: boolean;
  newSite?: string;
}

const DEFAULT_FORM: WorkerFormData = {
  name: "",
  mobile: "",
  site: "",
  dailyRate: "",
  active: true,
  newSite: "",
};

export default function WorkersPage() {
  const navigate = useNavigate();
  const { data: workers = [], isLoading } = useListWorkers();
  const { data: sites = [] } = useListSites();
  const createWorker = useCreateWorker();
  const updateWorker = useUpdateWorker();
  const deleteWorker = useDeleteWorker();
  const createSite = useCreateSite();

  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [form, setForm] = useState<WorkerFormData>(DEFAULT_FORM);
  const [addingNewSite, setAddingNewSite] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<bigint | null>(null);

  const filtered = workers.filter((w) => {
    const matchSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.mobile.includes(search) ||
      w.site.toLowerCase().includes(search.toLowerCase());
    const matchSite = siteFilter === "all" || w.site === siteFilter;
    return matchSearch && matchSite;
  });

  const openAdd = () => {
    setEditingWorker(null);
    setForm(DEFAULT_FORM);
    setAddingNewSite(false);
    setDialogOpen(true);
  };

  const openEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setForm({
      name: worker.name,
      mobile: worker.mobile,
      site: worker.site,
      dailyRate: Number(worker.dailyRate).toString(),
      active: worker.active,
    });
    setAddingNewSite(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.mobile.trim() || !form.dailyRate) {
      toast.error("Please fill all required fields");
      return;
    }

    let siteToUse = form.site;

    // If adding new site
    if (addingNewSite && form.newSite?.trim()) {
      try {
        await createSite.mutateAsync(form.newSite.trim());
        siteToUse = form.newSite.trim();
      } catch {
        toast.error("Failed to create site");
        return;
      }
    }

    if (!siteToUse) {
      toast.error("Please select or add a site");
      return;
    }

    const dailyRateBigInt = BigInt(Math.round(Number(form.dailyRate)));

    try {
      if (editingWorker) {
        await updateWorker.mutateAsync({
          id: editingWorker.id,
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          site: siteToUse,
          dailyRate: dailyRateBigInt,
          active: form.active,
        });
        toast.success("Worker updated successfully");
      } else {
        await createWorker.mutateAsync({
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          site: siteToUse,
          dailyRate: dailyRateBigInt,
        });
        toast.success("Worker added successfully");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save worker");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteWorker.mutateAsync(id);
      toast.success("Worker deleted");
      setConfirmDeleteId(null);
    } catch {
      toast.error("Failed to delete worker");
    }
  };

  const isSaving = createWorker.isPending || updateWorker.isPending || createSite.isPending;

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      {/* Back + heading */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/" })}
          className="text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2
            className="font-display text-3xl font-black uppercase tracking-wide"
            style={{ color: "oklch(0.84 0.165 89.2)" }}
          >
            Workers
          </h2>
          <p className="text-xs text-muted-foreground">
            {workers.length} total · {workers.filter((w) => w.active).length} active
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search workers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Worker list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <HardHat className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground font-body">
            {search || siteFilter !== "all"
              ? "No workers match your search"
              : "No workers yet. Add your first worker!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((worker) => (
            <div
              key={worker.id.toString()}
              className="rounded-lg border border-border bg-card group hover:border-primary/50 transition-all duration-200 overflow-hidden"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Avatar + clickable info area */}
                <button
                  type="button"
                  className="flex items-center gap-4 flex-1 min-w-0 text-left"
                  onClick={() =>
                    navigate({
                      to: "/workers/$workerId",
                      params: { workerId: worker.id.toString() },
                    })
                  }
                >
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-display text-lg font-black"
                    style={{
                      backgroundColor: "oklch(0.84 0.165 89.2 / 0.15)",
                      color: "oklch(0.84 0.165 89.2)",
                    }}
                  >
                    {worker.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {worker.name}
                      </span>
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: worker.active
                            ? "oklch(0.65 0.17 162.48 / 0.2)"
                            : "oklch(0.5 0 0 / 0.2)",
                          color: worker.active
                            ? "oklch(0.65 0.17 162.48)"
                            : "oklch(0.6 0 0)",
                          border: "none",
                        }}
                      >
                        {worker.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {worker.mobile}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {worker.site}
                      </span>
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {Number(worker.dailyRate).toLocaleString("en-IN")}/day
                      </span>
                    </div>
                  </div>
                </button>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-primary"
                    onClick={() => openEdit(worker)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmDeleteId(worker.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={openAdd}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center font-bold text-2xl transition-all duration-200 hover:scale-110 z-30 cursor-pointer border-0"
        style={{
          backgroundColor: "oklch(0.84 0.165 89.2)",
          color: "oklch(0.10 0 0)",
          boxShadow: "0 0 20px oklch(0.84 0.165 89.2 / 0.4), 0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-black uppercase text-primary">
              {editingWorker ? "Edit Worker" : "Add Worker"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Worker Name *
              </Label>
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mobile Number *
              </Label>
              <Input
                placeholder="10-digit number"
                value={form.mobile}
                onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Site Location *
              </Label>
              {!addingNewSite ? (
                <div className="flex gap-2">
                  <Select
                    value={form.site}
                    onValueChange={(v) => setForm((p) => ({ ...p, site: v }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary/50 hover:bg-primary/10"
                    onClick={() => setAddingNewSite(true)}
                  >
                    + New
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="New site name"
                    value={form.newSite}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, newSite: e.target.value }))
                    }
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddingNewSite(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Daily Rate (₹) *
              </Label>
              <Input
                type="number"
                placeholder="e.g. 600"
                value={form.dailyRate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dailyRate: e.target.value }))
                }
              />
            </div>

            {editingWorker && (
              <div className="flex items-center justify-between py-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Status
                </Label>
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                backgroundColor: "oklch(0.84 0.165 89.2)",
                color: "oklch(0.10 0 0)",
              }}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {isSaving ? "Saving..." : "Save Worker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={() => setConfirmDeleteId(null)}
      >
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-black uppercase text-destructive">
              Delete Worker?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will permanently delete the worker and all their attendance and
            advance records.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteWorker.isPending}
              onClick={() =>
                confirmDeleteId && handleDelete(confirmDeleteId)
              }
            >
              {deleteWorker.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
