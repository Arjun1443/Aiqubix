import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { employeeRoles, recordWorkEvent } from "./workforce";
import { getDatabase } from "./mongodb";

export const roles = ["student", "trainer", "employee", "senior-manager", "admin"] as const;
export type Role = typeof roles[number];
export const roleLabels: Record<Role, string> = {
  student: "Student",
  trainer: "Trainer",
  employee: "Employee",
  "senior-manager": "Senior Manager",
  admin: "Admin",
};

export const profileFields: Record<Role, Record<string, string>> = {
  student: { programme: "Programme", learningGoal: "Learning goal" },
  employee: { bio: "Professional bio" },
  trainer: { specialisation: "Specialisation", bio: "Teaching bio" },
  "senior-manager": { department: "Department", responsibility: "Responsibility" },
  admin: { department: "Department", responsibility: "Responsibility" },
};

export type Account = {
  _id: string;
  name: string;
  role: Role;
  profile: Record<string, string>;
  passwordHash?: string;
  invitationHash?: string;
  invitationExpires?: Date;
  enrolledCourses?: string[];
  employment?: { designation: string; department: string; startDate: string };
  employmentStatus?: "active" | "inactive";
  courseProgress?: Record<string, number>;
};

type Session = { _id: string; email: string; expiresAt: Date; staff?: boolean };

export const accounts = () => getDatabase().collection<Account>("accounts");
const sessions = () => getDatabase().collection<Session>("accountSessions");
const sessionCookie = "aiqubix_session";
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function startSession(email: string, role?: Role) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await sessions().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  const id = tokenHash(token);
  const staff = employeeRoles.some((employeeRole) => employeeRole === role);
  await sessions().insertOne({ _id: id, email, expiresAt, staff });
  if (staff) await recordWorkEvent({ _id: `${id}:in`, employee: email, type: "sign-in", at: new Date() });
  (await cookies()).set(sessionCookie, token, {
    expires: expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(sessionCookie)?.value;
  if (token) {
    const session = await sessions().findOneAndDelete({ _id: tokenHash(token) });
    if (session?.staff) await recordWorkEvent({ _id: `${session._id}:out`, employee: session.email, type: "sign-out", at: new Date() });
  }
  jar.delete(sessionCookie);
}

export async function revokeSessions(email: string) {
  await sessions().deleteMany({ email });
}

export async function currentAccount() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  const session = await sessions().findOne({ _id: tokenHash(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await accounts().findOne(
    { _id: session.email, passwordHash: { $exists: true }, employmentStatus: { $ne: "inactive" } },
    { projection: { passwordHash: 0, invitationHash: 0, invitationExpires: 0 } },
  );
  return user && roles.includes(user.role) ? user : null;
}

export async function requireAccount(...allowed: Role[]) {
  const user = await currentAccount();
  if (!user) redirect("/login");
  if (allowed.length && !allowed.includes(user.role)) redirect(`/dashboard/${user.role}`);
  return user;
}
