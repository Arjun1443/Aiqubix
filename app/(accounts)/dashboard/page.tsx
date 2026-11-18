import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/academy-accounts";

export default async function DashboardPage() {
  const user = await requireAccount();
  redirect(`/dashboard/${user.role}`);
}
