import { connection } from "next/server";
import { getCourses } from "@/lib/academy-courses";
import { courses } from "@/lib/course-catalogue";
import AcademyHome from "./academy-home";

export const runtime = "nodejs";

export default async function Home() {
  await connection();

  if (process.env.MONGODB_URI?.trim()) {
    try {
      return <AcademyHome courses={await getCourses()} />;
    } catch (error) {
      console.error("Could not load academy catalogue", error instanceof Error ? error.name : "Unknown error");
    }
  }

  return <AcademyHome courses={courses} />;
}
