import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type LaborRecordId = bigint;
export interface WeeklyBalance {
    ownerId: OwnerId;
    week: string;
    finalPayable: bigint;
    prevBalance: bigint;
    thisWeekTotal: bigint;
    advanceDeduction: bigint;
}
export interface LaborRecord {
    id: LaborRecordId;
    afternoonCount: bigint;
    dailyRate: bigint;
    ownerId: OwnerId;
    date: string;
    morningCount: bigint;
    totalAmount: bigint;
    category: string;
}
export interface Advance {
    workerId: WorkerId;
    date: string;
    note: string;
    amount: bigint;
}
export interface Attendance {
    workerId: WorkerId;
    date: string;
    morningPresent: boolean;
    afternoonPresent: boolean;
}
export type WorkerId = bigint;
export interface Owner {
    id: OwnerId;
    name: string;
    site: string;
}
export interface Worker {
    id: WorkerId;
    active: boolean;
    dailyRate: bigint;
    name: string;
    site: string;
    mobile: string;
}
export interface UserProfile {
    name: string;
}
export type OwnerId = bigint;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAdvance(workerId: WorkerId, amount: bigint, date: string, note: string): Promise<Advance>;
    createAttendance(workerId: WorkerId, date: string, morningPresent: boolean, afternoonPresent: boolean): Promise<Attendance>;
    createLaborRecord(ownerId: OwnerId, category: string, date: string, morningCount: bigint, afternoonCount: bigint, dailyRate: bigint): Promise<LaborRecord>;
    createOwner(name: string, site: string): Promise<Owner>;
    createSite(site: string): Promise<void>;
    createWeeklyBalance(ownerId: OwnerId, week: string, prevBalance: bigint, advanceDeduction: bigint, thisWeekTotal: bigint): Promise<WeeklyBalance>;
    createWorker(name: string, mobile: string, site: string, dailyRate: bigint): Promise<Worker>;
    deleteAdvance(workerId: WorkerId, date: string): Promise<void>;
    deleteAttendance(workerId: WorkerId, date: string): Promise<void>;
    deleteLaborRecord(id: LaborRecordId): Promise<void>;
    deleteOwner(id: OwnerId): Promise<void>;
    deleteSite(site: string): Promise<void>;
    deleteWorker(id: WorkerId): Promise<void>;
    getAdvancesByWorker(workerId: WorkerId): Promise<Array<Advance>>;
    getAttendanceByDate(date: string): Promise<Array<Attendance>>;
    getAttendanceByWorker(workerId: WorkerId): Promise<Array<Attendance>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboard(): Promise<{
        totalPendingBalance: bigint;
        activeWorkers: bigint;
    }>;
    getLaborRecordsByOwner(ownerId: OwnerId): Promise<Array<LaborRecord>>;
    getOwner(id: OwnerId): Promise<Owner | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeeklyBalance(week: string): Promise<WeeklyBalance | null>;
    getWorker(id: WorkerId): Promise<Worker | null>;
    isCallerAdmin(): Promise<boolean>;
    listOwners(): Promise<Array<Owner>>;
    listSites(): Promise<Array<string>>;
    listWorkers(): Promise<Array<Worker>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateAttendance(workerId: WorkerId, date: string, morningPresent: boolean, afternoonPresent: boolean): Promise<void>;
    updateLaborRecord(id: LaborRecordId, category: string, date: string, morningCount: bigint, afternoonCount: bigint, dailyRate: bigint): Promise<LaborRecord>;
    updateOwner(id: OwnerId, name: string, site: string): Promise<Owner>;
    updateWeeklyBalance(ownerId: OwnerId, week: string, prevBalance: bigint, advanceDeduction: bigint, thisWeekTotal: bigint): Promise<WeeklyBalance>;
    updateWorker(id: WorkerId, name: string, mobile: string, site: string, dailyRate: bigint, active: boolean): Promise<Worker>;
}
