import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import {
  Building2,
  ChevronLeft,
  Edit2,
  Loader2,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useListOwners,
  useCreateOwner,
  useUpdateOwner,
  useDeleteOwner,
  useListSites,
  useCreateSite,
} from "../hooks/useQueries";
import type { Owner } from "../backend.d";

interface OwnerFormData {
  name: string;
  site: string;
  newSite?: string;
}

const DEFAULT_FORM: OwnerFormData = { name: "", site: "", newSite: "" };

export default function OwnersPage() {
  const navigate = useNavigate();
  const { data: owners = [], isLoading } = useListOwners();
  const { data: sites = [] } = useListSites();
  const createOwner = useCreateOwner();
  const updateOwner = useUpdateOwner();
  const deleteOwner = useDeleteOwner();
  const createSite = useCreateSite();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [form, setForm] = useState<OwnerFormData>(DEFAULT_FORM);
  const [addingNewSite, setAddingNewSite] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<bigint | null>(null);

  const openAdd = () => {
    setEditingOwner(null);
    setForm(DEFAULT_FORM);
    setAddingNewSite(false);
    setDialogOpen(true);
  };

  const openEdit = (owner: Owner) => {
    setEditingOwner(owner);
    setForm({ name: owner.name, site: owner.site });
    setAddingNewSite(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter owner name");
      return;
    }

    let siteToUse = form.site;

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

    try {
      if (editingOwner) {
        await updateOwner.mutateAsync({
          id: editingOwner.id,
          name: form.name.trim(),
          site: siteToUse,
        });
        toast.success("Owner updated");
      } else {
        await createOwner.mutateAsync({
          name: form.name.trim(),
          site: siteToUse,
        });
        toast.success("Owner/Builder added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save owner");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteOwner.mutateAsync(id);
      toast.success("Owner deleted");
      setConfirmDeleteId(null);
    } catch {
      toast.error("Failed to delete owner");
    }
  };

  const isSaving =
    createOwner.isPending || updateOwner.isPending || createSite.isPending;

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
            Owner / Builder
          </h2>
          <p className="text-xs text-muted-foreground">
            {owners.length} records
          </p>
        </div>
        <Button
          type="button"
          className="ml-auto font-display font-bold uppercase tracking-wide"
          style={{
            backgroundColor: "oklch(0.84 0.165 89.2)",
            color: "oklch(0.10 0 0)",
          }}
          onClick={openAdd}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Owner
        </Button>
      </div>

      {/* Owner list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : owners.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground font-body">
            No owners yet. Add your first owner/builder!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {owners.map((owner) => (
            <div
              key={owner.id.toString()}
              className="rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-200 overflow-hidden"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}
            >
              <div className="p-4 flex items-center gap-4">
                <button
                  type="button"
                  className="flex items-center gap-4 flex-1 min-w-0 text-left"
                  onClick={() =>
                    navigate({
                      to: "/owners/$ownerId",
                      params: { ownerId: owner.id.toString() },
                    })
                  }
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-display text-lg font-black"
                    style={{
                      backgroundColor: "oklch(0.84 0.165 89.2 / 0.15)",
                      color: "oklch(0.84 0.165 89.2)",
                    }}
                  >
                    <Building2 className="w-6 h-6" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-lg text-foreground hover:text-primary transition-colors">
                      {owner.name}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {owner.site}
                    </p>
                  </div>
                </button>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-primary"
                    onClick={() => openEdit(owner)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmDeleteId(owner.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-black uppercase text-primary">
              {editingOwner ? "Edit Owner" : "Add Owner / Builder"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Owner / Builder Name *
              </Label>
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={() => setConfirmDeleteId(null)}
      >
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-black uppercase text-destructive">
              Delete Owner?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will permanently delete the owner and all their labor records.
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
              disabled={deleteOwner.isPending}
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              {deleteOwner.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
