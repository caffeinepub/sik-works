import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import {
  type Worker,
  type Owner,
  type Attendance,
  type Advance,
  type LaborRecord,
  type WeeklyBalance,
  type UserProfile,
} from "../backend.d";

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function useGetDashboard() {
  const { actor, isFetching } = useActor();
  return useQuery<{ totalPendingBalance: bigint; activeWorkers: bigint }>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      if (!actor) return { totalPendingBalance: BigInt(0), activeWorkers: BigInt(0) };
      return actor.getDashboard();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Sites ────────────────────────────────────────────────────────────────────

export function useListSites() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["sites"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSites();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (site: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createSite(site);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

export function useDeleteSite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (site: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteSite(site);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

// ─── Workers ──────────────────────────────────────────────────────────────────

export function useListWorkers() {
  const { actor, isFetching } = useActor();
  return useQuery<Worker[]>({
    queryKey: ["workers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listWorkers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetWorker(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Worker | null>({
    queryKey: ["worker", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getWorker(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateWorker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      mobile: string;
      site: string;
      dailyRate: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createWorker(data.name, data.mobile, data.site, data.dailyRate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateWorker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      mobile: string;
      site: string;
      dailyRate: bigint;
      active: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateWorker(data.id, data.name, data.mobile, data.site, data.dailyRate, data.active);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      queryClient.invalidateQueries({ queryKey: ["worker", variables.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteWorker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteWorker(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Attendance ────────────────────────────────────────────────────────────────

export function useGetAttendanceByWorker(workerId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Attendance[]>({
    queryKey: ["attendance", "worker", workerId?.toString()],
    queryFn: async () => {
      if (!actor || workerId === null) return [];
      return actor.getAttendanceByWorker(workerId);
    },
    enabled: !!actor && !isFetching && workerId !== null,
  });
}

export function useCreateAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      workerId: bigint;
      date: string;
      morningPresent: boolean;
      afternoonPresent: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createAttendance(data.workerId, data.date, data.morningPresent, data.afternoonPresent);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "worker", variables.workerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      workerId: bigint;
      date: string;
      morningPresent: boolean;
      afternoonPresent: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateAttendance(data.workerId, data.date, data.morningPresent, data.afternoonPresent);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "worker", variables.workerId.toString()] });
    },
  });
}

export function useDeleteAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { workerId: bigint; date: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteAttendance(data.workerId, data.date);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "worker", variables.workerId.toString()] });
    },
  });
}

// ─── Advances ─────────────────────────────────────────────────────────────────

export function useGetAdvancesByWorker(workerId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Advance[]>({
    queryKey: ["advances", "worker", workerId?.toString()],
    queryFn: async () => {
      if (!actor || workerId === null) return [];
      return actor.getAdvancesByWorker(workerId);
    },
    enabled: !!actor && !isFetching && workerId !== null,
  });
}

export function useCreateAdvance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      workerId: bigint;
      amount: bigint;
      date: string;
      note: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createAdvance(data.workerId, data.amount, data.date, data.note);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["advances", "worker", variables.workerId.toString()] });
    },
  });
}

export function useDeleteAdvance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { workerId: bigint; date: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteAdvance(data.workerId, data.date);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["advances", "worker", variables.workerId.toString()] });
    },
  });
}

// ─── Owners ───────────────────────────────────────────────────────────────────

export function useListOwners() {
  const { actor, isFetching } = useActor();
  return useQuery<Owner[]>({
    queryKey: ["owners"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listOwners();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOwner(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Owner | null>({
    queryKey: ["owner", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getOwner(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateOwner() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; site: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createOwner(data.name, data.site);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });
}

export function useUpdateOwner() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; name: string; site: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateOwner(data.id, data.name, data.site);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      queryClient.invalidateQueries({ queryKey: ["owner", variables.id.toString()] });
    },
  });
}

export function useDeleteOwner() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteOwner(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });
}

// ─── Labor Records ────────────────────────────────────────────────────────────

export function useGetLaborRecordsByOwner(ownerId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<LaborRecord[]>({
    queryKey: ["laborRecords", "owner", ownerId?.toString()],
    queryFn: async () => {
      if (!actor || ownerId === null) return [];
      return actor.getLaborRecordsByOwner(ownerId);
    },
    enabled: !!actor && !isFetching && ownerId !== null,
  });
}

export function useCreateLaborRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      ownerId: bigint;
      category: string;
      date: string;
      morningCount: bigint;
      afternoonCount: bigint;
      dailyRate: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createLaborRecord(
        data.ownerId,
        data.category,
        data.date,
        data.morningCount,
        data.afternoonCount,
        data.dailyRate
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["laborRecords", "owner", variables.ownerId.toString()] });
    },
  });
}

export function useUpdateLaborRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      ownerId: bigint;
      category: string;
      date: string;
      morningCount: bigint;
      afternoonCount: bigint;
      dailyRate: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateLaborRecord(
        data.id,
        data.category,
        data.date,
        data.morningCount,
        data.afternoonCount,
        data.dailyRate
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["laborRecords", "owner", variables.ownerId.toString()] });
    },
  });
}

export function useDeleteLaborRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; ownerId: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteLaborRecord(data.id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["laborRecords", "owner", variables.ownerId.toString()] });
    },
  });
}

// ─── Weekly Balance ───────────────────────────────────────────────────────────

export function useGetWeeklyBalance(week: string) {
  const { actor, isFetching } = useActor();
  return useQuery<WeeklyBalance | null>({
    queryKey: ["weeklyBalance", week],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getWeeklyBalance(week);
    },
    enabled: !!actor && !isFetching && !!week,
  });
}

export function useCreateWeeklyBalance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      ownerId: bigint;
      week: string;
      prevBalance: bigint;
      advanceDeduction: bigint;
      thisWeekTotal: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createWeeklyBalance(
        data.ownerId,
        data.week,
        data.prevBalance,
        data.advanceDeduction,
        data.thisWeekTotal
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["weeklyBalance", variables.week] });
    },
  });
}

export function useUpdateWeeklyBalance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      ownerId: bigint;
      week: string;
      prevBalance: bigint;
      advanceDeduction: bigint;
      thisWeekTotal: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateWeeklyBalance(
        data.ownerId,
        data.week,
        data.prevBalance,
        data.advanceDeduction,
        data.thisWeekTotal
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["weeklyBalance", variables.week] });
    },
  });
}
