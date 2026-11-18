"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { MongoServerError } from "mongodb";
import { accounts, requireAccount, revokeSessions, tokenHash } from "@/lib/academy-accounts";
import { appraisals, employeeRoles, indiaDate, leaves, recordWorkEvent, workdays } from "@/lib/workforce";
import type { FormResult } from "../../actions";

const managerRoute = "/dashboard/senior-manager/employees";
const staffRoute = "/dashboard/workforce";
const unavailable = { message: "Could not save the change. Try again shortly." };
const staffFilter = { role: { $in: [...employeeRoles] } };

function read(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isDate(value: string) {
  const date = new Date(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function refresh(message: string) {
  revalidatePath(managerRoute);
  revalidatePath(staffRoute);
  return { message };
}

export async function clockIn(_: FormResult, __: FormData): Promise<FormResult> {
  const employee = await requireAccount(...employeeRoles);
  const clockIn = new Date();
  const date = indiaDate(clockIn);
  const _id = tokenHash(JSON.stringify([employee._id, date]));
  try {
    await workdays().createIndex({ employee: 1 }, { unique: true, partialFilterExpression: { open: true } });
    const open = await workdays().findOne({ employee: employee._id, clockOut: { $exists: false } });
    if (open) return { message: "Clock out of your open shift first." };
    await workdays().insertOne({ _id, employee: employee._id, date, clockIn, open: true });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return { message: "A workday already exists for today, or a shift is still open." };
    return unavailable;
  }
  return refresh("Clock-in recorded.");
}

export async function clockOut(_: FormResult, __: FormData): Promise<FormResult> {
  const employee = await requireAccount(...employeeRoles);
  try {
    const open = await workdays().findOne({ employee: employee._id, clockOut: { $exists: false } }, { sort: { clockIn: -1 } });
    if (!open) return { message: "There is no open shift to clock out of." };
    const saved = await workdays().updateOne({ _id: open._id, employee: employee._id, clockOut: { $exists: false } }, { $set: { clockOut: new Date(), open: false } });
    if (!saved.modifiedCount) return { message: "Clock-out was already recorded." };
  } catch {
    return unavailable;
  }
  return refresh("Clock-out recorded.");
}

export async function requestLeave(_: FormResult, form: FormData): Promise<FormResult> {
  const employee = await requireAccount(...employeeRoles);
  const category = read(form, "category"), start = read(form, "start"), end = read(form, "end"), reason = read(form, "reason");
  if (!["Casual", "Sick", "Earned", "Unpaid", "Other"].includes(category) || !isDate(start) || !isDate(end) || end < start || !reason || reason.length > 1000) {
    return { message: "Choose a leave type, a valid date range, and a short reason." };
  }
  try {
    const overlap = await leaves().findOne({ employee: employee._id, status: { $in: ["Pending", "Approved"] }, start: { $lte: end }, end: { $gte: start } });
    if (overlap) return { message: "An open or approved request already overlaps these dates." };
    const _id = tokenHash(JSON.stringify([employee._id, start, end, category]));
    await leaves().insertOne({ _id, employee: employee._id, category, start, end, reason, status: "Pending", createdAt: new Date() });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return { message: "A request for these dates and leave type already exists." };
    return unavailable;
  }
  return refresh("Leave request submitted.");
}

export async function decideLeave(_: FormResult, form: FormData): Promise<FormResult> {
  const manager = await requireAccount("senior-manager");
  const id = read(form, "leave"), decision = read(form, "decision"), decisionNote = read(form, "note");
  if ((decision !== "Approved" && decision !== "Declined") || decisionNote.length > 1000) return { message: "Choose a decision and keep the note under 1,000 characters." };
  try {
    const saved = await leaves().updateOne({ _id: id, status: "Pending" }, {
      $set: { status: decision, decisionNote, decidedBy: manager._id, decidedAt: new Date() },
    });
    if (!saved.modifiedCount) return { message: "This request is no longer pending." };
  } catch {
    return unavailable;
  }
  return refresh("Leave decision recorded.");
}

export async function saveEmployment(_: FormResult, form: FormData): Promise<FormResult> {
  await requireAccount("senior-manager");
  const employee = read(form, "employee"), designation = read(form, "designation");
  const department = read(form, "department"), startDate = read(form, "startDate");
  if (!designation || designation.length > 100 || !department || department.length > 100 || !isDate(startDate)) {
    return { message: "Enter a designation, department, and valid joining date." };
  }
  try {
    const result = await accounts().updateOne({ _id: employee, ...staffFilter }, { $set: { employment: { designation, department, startDate } } });
    if (!result.matchedCount) return { message: "Employee account unavailable." };
  } catch {
    return unavailable;
  }
  return refresh("Employee details saved.");
}

export async function setWorkAccess(_: FormResult, form: FormData): Promise<FormResult> {
  const manager = await requireAccount("senior-manager");
  const employee = read(form, "employee"), access = read(form, "access");
  if (access !== "active" && access !== "inactive" && access !== "revoke") return { message: "Choose a valid account action." };
  try {
    if (!(await accounts().findOne({ _id: employee, ...staffFilter }, { projection: { _id: 1 } }))) return { message: "Employee account unavailable." };
    if (access === "active") {
      await revokeSessions(employee);
      await accounts().updateOne({ _id: employee, ...staffFilter }, { $set: { employmentStatus: access } });
    } else {
      if (access === "inactive") await accounts().updateOne({ _id: employee, ...staffFilter }, { $set: { employmentStatus: access } });
      await revokeSessions(employee);
    }
  } catch {
    return unavailable;
  }
  await recordWorkEvent({ _id: randomUUID(), employee, manager: manager._id, at: new Date(),
    type: access === "revoke" ? "sessions-revoked" : access === "active" ? "access-restored" : "access-suspended",
  });
  return refresh(access === "revoke" ? "Employee sessions revoked." : access === "active" ? "Sign-in access enabled." : "Sign-in access suspended.");
}

export async function publishAppraisal(_: FormResult, form: FormData): Promise<FormResult> {
  const manager = await requireAccount("senior-manager");
  const employee = read(form, "employee"), period = read(form, "period"), rating = Number(read(form, "rating"));
  const feedback = read(form, "feedback"), goals = read(form, "goals");
  if (!period || period.length > 100 || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
    !feedback || feedback.length > 2000 || !goals || goals.length > 2000) {
    return { message: "Enter a review period, rating from 1 to 5, feedback, and goals." };
  }
  try {
    if (!(await accounts().findOne({ _id: employee, ...staffFilter }, { projection: { _id: 1 } }))) return { message: "Employee account unavailable." };
    await appraisals().insertOne({ _id: randomUUID(), employee, reviewer: manager._id, period, rating, feedback, goals, createdAt: new Date() });
  } catch {
    return unavailable;
  }
  return refresh("Appraisal published to the employee workspace.");
}
