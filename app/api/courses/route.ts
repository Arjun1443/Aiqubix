import { getCourses } from "@/lib/academy-courses";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json({ courses: await getCourses() });
  } catch (error) {
    console.error("Course query failed", error instanceof Error ? error.name : "Unknown error");
    return Response.json({ detail: "Course catalogue unavailable" }, { status: 503 });
  }
}
