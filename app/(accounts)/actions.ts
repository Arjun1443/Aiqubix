"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { MongoServerError } from "mongodb";
import { z } from "zod";
import { accounts, endSession, profileFields, requireAccount, startSession, tokenHash } from "@/lib/academy-accounts";
import { getCourses } from "@/lib/academy-courses";
import { intakeReturnPath } from "@/lib/trainer-intake";
import { getDatabase } from "@/lib/mongodb";
import { hashPassword, verifyPassword } from "@/lib/password.mjs";

export type FormResult = { message: string; invite?: string };
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const nameSchema = z.string().trim().min(2).max(100);
const passwordSchema = z.string().min(12).max(128);
const unavailable = { message: "The service is temporarily unavailable. Try again shortly." };

async function withinAttemptLimit(action: string, email?: string) {
  const source = (await headers()).get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "local";
  const attempts = getDatabase().collection<{ _id: string; count: number; expiresAt: Date }>("authAttempts");
  const window = Math.floor(Date.now() / 600_000);
  await attempts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  const keys = email ? [`ip:${source}`, `email:${email}`] : [`ip:${source}`];
  for (const key of keys) {
    const filter = { _id: tokenHash(`${action}:${window}:${key}`) };
    let count;
    try {
      count = await attempts.findOneAndUpdate(filter, {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date((window + 2) * 600_000) },
      }, { upsert: true, returnDocument: "after" });
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
      count = await attempts.findOneAndUpdate(filter, { $inc: { count: 1 } }, { returnDocument: "after" });
    }
    if (!count || count.count > (key.startsWith("email:") ? 10 : 25)) return false;
  }
  return true;
}

export async function login(_: FormResult, form: FormData): Promise<FormResult> {
  const parsed = z.object({ email: emailSchema, password: z.string().min(1).max(128) }).safeParse(Object.fromEntries(form));
  const invalid = { message: "Email or password is incorrect." };
  if (!parsed.success) return invalid;
  const { email, password } = parsed.data;
  let student = false;
  try {
    if (!(await withinAttemptLimit("login", email))) return { message: "Too many attempts. Try again in 10 minutes." };
    const user = await accounts().findOne({ _id: email });
    const valid = await verifyPassword(password, user?.passwordHash);
    if (!user?.passwordHash || !valid) return invalid;
    await startSession(email);
    student = user.role === "student";
  } catch {
    return unavailable;
  }
  redirect((student && intakeReturnPath(form.get("intake"))) || "/dashboard");
}

export async function register(_: FormResult, form: FormData): Promise<FormResult> {
  const parsed = z.object({ email: emailSchema, name: nameSchema, password: passwordSchema }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: "Enter a name, valid email and a password of 12–128 characters." };
  const { email, name, password } = parsed.data;
  try {
    if (!(await withinAttemptLimit("register"))) return { message: "Too many attempts. Try again in 10 minutes." };
    await accounts().insertOne({ _id: email, name, role: "student", passwordHash: await hashPassword(password), profile: {} });
    await startSession(email);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return { message: "This account could not be registered. Try signing in." };
    return unavailable;
  }
  redirect(intakeReturnPath(form.get("intake")) ?? "/dashboard/student");
}

export async function inviteStaff(_: FormResult, form: FormData): Promise<FormResult> {
  await requireAccount("admin");
  const parsed = z.object({ email: emailSchema, name: nameSchema, role: z.enum(["trainer", "senior-manager"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: "Enter a name, valid email and staff role." };
  const { email, name, role } = parsed.data;
  const token = randomBytes(32).toString("hex");
  try {
    await accounts().updateOne(
      { _id: email, passwordHash: { $exists: false } },
      { $set: { name, role, invitationHash: tokenHash(token), invitationExpires: new Date(Date.now() + 86_400_000) }, $setOnInsert: { profile: {} } },
      { upsert: true },
    );
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return { message: "An active account already uses this email." };
    return unavailable;
  }
  revalidatePath("/dashboard/admin");
  return { message: "Share this one-time activation code privately. It expires in 24 hours.", invite: token };
}

export async function activate(_: FormResult, form: FormData): Promise<FormResult> {
  const parsed = z.object({ email: emailSchema, code: z.string().trim().regex(/^[a-f0-9]{64}$/), password: passwordSchema }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: "Enter your email, activation code and a password of 12–128 characters." };
  const { email, code, password } = parsed.data;
  try {
    if (!(await withinAttemptLimit("activate", email))) return { message: "Too many attempts. Try again in 10 minutes." };
    const filter = { _id: email, passwordHash: { $exists: false }, invitationHash: tokenHash(code), invitationExpires: { $gt: new Date() } };
    if (!(await accounts().findOne(filter, { projection: { _id: 1 } }))) return { message: "Invalid or expired activation code." };
    const result = await accounts().updateOne({ ...filter, invitationExpires: { $gt: new Date() } }, {
      $set: { passwordHash: await hashPassword(password) },
      $unset: { invitationHash: "", invitationExpires: "" },
    });
    if (result.modifiedCount !== 1) return { message: "Invalid or expired activation code." };
    await startSession(email);
  } catch {
    return unavailable;
  }
  redirect("/dashboard");
}

export async function saveProfile(_: FormResult, form: FormData): Promise<FormResult> {
  const user = await requireAccount();
  const name = nameSchema.safeParse(form.get("name"));
  if (!name.success) return { message: "Enter a name between 2 and 100 characters." };
  const profile: Record<string, string> = {};
  for (const field of Object.keys(profileFields[user.role])) {
    const value = form.get(field);
    if (typeof value !== "string" || value.length > 500) return { message: "Keep each profile field under 500 characters." };
    profile[field] = value.trim();
  }
  try {
    await accounts().updateOne({ _id: user._id, role: user.role }, { $set: { name: name.data, profile } });
  } catch {
    return unavailable;
  }
  revalidatePath(`/dashboard/${user.role}`);
  return { message: "Profile saved." };
}

export async function enroll(_: FormResult, form: FormData): Promise<FormResult> {
  const user = await requireAccount("student");
  const course = form.get("course");
  try {
    if (!(await getCourses()).some((item) => item.title === course)) return { message: "Choose an available course." };
    await accounts().updateOne({ _id: user._id, role: "student" }, { $addToSet: { enrolledCourses: course as string } });
  } catch {
    return unavailable;
  }
  revalidatePath("/dashboard/student");
  return { message: "Enrollment saved." };
}

export async function signOut() {
  await endSession();
  redirect("/login");
}

export async function updateProgress(_: FormResult, form: FormData): Promise<FormResult> {
  const user = await requireAccount("student");
  const title = form.get("course");
  const rawCount = form.get("completed");
  if (typeof title !== "string" || typeof rawCount !== "string" || !/^\d+$/.test(rawCount)) {
    return { message: "Enter a valid number of completed lessons." };
  }
  const completed = Number(rawCount);
  try {
    const course = (await getCourses()).find((item) => item.title === title);
    if (!course || !user.enrolledCourses?.includes(title) || !Number.isSafeInteger(completed) || completed > course.lessons) {
      return { message: "Enter a count within the enrolled course’s lesson total." };
    }
    const result = await accounts().updateOne(
      { _id: user._id, role: "student", enrolledCourses: title },
      { $set: { [`courseProgress.${tokenHash(title)}`]: completed } },
    );
    if (!result.matchedCount) return { message: "You must be enrolled in this course." };
  } catch {
    return unavailable;
  }
  revalidatePath("/dashboard/student");
  return { message: "Progress saved." };
}
