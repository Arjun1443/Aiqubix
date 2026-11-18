import { courses } from "@/lib/course-catalogue";

export function GET() {
  return Response.json({ courses });
}
