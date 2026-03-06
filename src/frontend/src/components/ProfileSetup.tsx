import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserCircle2 } from "lucide-react";
import { useSaveCallerUserProfile } from "../hooks/useQueries";
import { toast } from "sonner";

interface ProfileSetupProps {
  onComplete: () => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success("Profile saved!");
      onComplete();
    } catch {
      toast.error("Failed to save profile");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "oklch(0.10 0 0 / 0.95)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border overflow-hidden"
        style={{
          backgroundColor: "oklch(0.15 0 0)",
          borderColor: "oklch(0.28 0 0)",
          boxShadow: "0 0 60px oklch(0.84 0.165 89.2 / 0.1), 0 24px 48px rgba(0,0,0,0.6)",
        }}
      >
        <div className="h-1.5" style={{ backgroundColor: "oklch(0.84 0.165 89.2)" }} />

        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "oklch(0.84 0.165 89.2 / 0.15)" }}
            >
              <UserCircle2 className="w-6 h-6" style={{ color: "oklch(0.84 0.165 89.2)" }} />
            </div>
            <div>
              <h2
                className="font-display text-2xl font-black uppercase tracking-wide"
                style={{ color: "oklch(0.84 0.165 89.2)" }}
              >
                Setup Profile
              </h2>
              <p className="text-xs text-muted-foreground">Enter your name to get started</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Name
            </Label>
            <Input
              placeholder="e.g. Rajesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>

          <Button
            type="button"
            className="w-full font-display font-bold uppercase tracking-wide"
            style={{
              backgroundColor: "oklch(0.84 0.165 89.2)",
              color: "oklch(0.10 0 0)",
            }}
            disabled={saveProfile.isPending}
            onClick={handleSave}
          >
            {saveProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Continue to SIK Works
          </Button>
        </div>
      </div>
    </div>
  );
}
