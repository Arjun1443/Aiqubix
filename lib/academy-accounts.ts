import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase } from "./mongodb";

export const roles = ["student", "trainer", "senior-manager", "admin"] as const;
export type Role = typeof roles[number];
export const roleLabels: Record<Role, string> = {
  student: "Student",
  trainer: "Trainer",
  "senior-manager": "Senior Manager",
  admin: "Admin",
};

export const profileFields: Record<Role, Record<string, string>> = {
  student: { programme: "Programme", learningGoal: "Learning goal" },
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
};

type Session = { _id: string; email: string; expiresAt: Date };

export const accounts = () => getDatabase().collection<Account>("accounts");
const sessions = () => getDatabase().collection<Session>("accountSessions");
const sessionCookie = "aiqubix_session";
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function startSession(email: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await sessions().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await sessions().insertOne({ _id: tokenHash(token), email, expiresAt });
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
  if (token) await sessions().deleteOne({ _id: tokenHash(token) });
  jar.delete(sessionCookie);
}

export async function currentAccount() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  const session = await sessions().findOne({ _id: tokenHash(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await accounts().findOne(
    { _id: session.email, passwordHash: { $exists: true } },
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
