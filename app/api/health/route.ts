import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    await getDatabase().command({ ping: 1 });
    return Response.json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("MongoDB health check failed", error instanceof Error ? error.name : "Unknown error");
    return Response.json({ status: "unavailable", database: "unavailable" }, { status: 503 });
  }
}
