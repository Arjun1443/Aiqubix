import { hasAcademyApi, requestAcademyApi } from "@/lib/academy-api";
import { courses } from "@/lib/course-catalogue";

export function GET() {
  if (!hasAcademyApi()) return Response.json({ courses });
  return requestAcademyApi("/courses");
}
