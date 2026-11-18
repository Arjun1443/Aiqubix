import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/academy-accounts";

export default async function DashboardPage() {
  const user = await requireAccount();
  redirect(user.role === "employee" ? "/dashboard/workforce" : `/dashboard/${user.role}`);
}
