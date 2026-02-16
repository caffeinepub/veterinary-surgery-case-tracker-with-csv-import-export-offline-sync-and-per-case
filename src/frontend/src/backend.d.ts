import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface SurgeryCaseUpdate {
    arrivalDate?: Time;
    medicalRecordNumber?: string;
    tasksChecklist?: TasksChecklist;
    patientDemographics?: PatientDemographics;
}
export interface TaskItem {
    checked: boolean;
    required: boolean;
}
export interface SurgeryCase {
    arrivalDate: Time;
    medicalRecordNumber: string;
    isSynchronized: boolean;
    lastSyncTimestamp: Time;
    caseId: bigint;
    tasksChecklist: TasksChecklist;
    patientDemographics: PatientDemographics;
}
export interface PatientDemographics {
    age: bigint;
    name: string;
    breed: string;
    species: string;
}
export interface TasksChecklist {
    pdvmNotified: TaskItem;
    histo: TaskItem;
    labs: TaskItem;
    culture: TaskItem;
    surgeryReport: TaskItem;
    imaging: TaskItem;
    dischargeNotes: TaskItem;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSurgeryCase(medicalRecordNumber: string, patientDemographics: PatientDemographics, arrivalDate: Time, tasksChecklist: TasksChecklist): Promise<bigint>;
    getAllSurgeryCases(): Promise<Array<SurgeryCase>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUpdatedCases(since: Time): Promise<Array<SurgeryCase>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasUnsyncedChanges(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    syncLocalChanges(localCases: Array<SurgeryCase>): Promise<void>;
    updateSurgeryCase(caseId: bigint, updates: SurgeryCaseUpdate): Promise<boolean>;
}
