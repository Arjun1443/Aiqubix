import { getDatabase } from "./mongodb";

export const employeeRoles = ["employee", "trainer"] as const;

export type WorkEvent = { _id: string; employee: string; type: "sign-in" | "sign-out" | "sessions-revoked" | "access-suspended" | "access-restored"; at: Date; manager?: string };
export type Workday = { _id: string; employee: string; date: string; clockIn: Date; clockOut?: Date; open?: boolean };
export type Leave = {
  _id: string; employee: string; category: string; start: string; end: string;
  reason: string; status: "Pending" | "Approved" | "Declined"; createdAt: Date;
  decidedBy?: string; decidedAt?: Date; decisionNote?: string;
};
export type Appraisal = {
  _id: string; employee: string; reviewer: string; period: string;
  rating: number; feedback: string; goals: string; createdAt: Date;
};

export const workEvents = () => getDatabase().collection<WorkEvent>("workAuthEvents");
export const workdays = () => getDatabase().collection<Workday>("workdays");
export const leaves = () => getDatabase().collection<Leave>("employeeLeaves");
export const appraisals = () => getDatabase().collection<Appraisal>("employeeAppraisals");

export function indiaDate(date = new Date()) {
  return new Date(date.valueOf() + 330 * 60_000).toISOString().slice(0, 10);
}

export async function recordWorkEvent(event: WorkEvent) {
  try {
    await workEvents().updateOne({ _id: event._id }, { $setOnInsert: event }, { upsert: true });
  } catch (error) {
    console.error("Could not record employee account activity", error instanceof Error ? error.name : "Unknown error");
  }
}
