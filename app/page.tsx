import { connection } from "next/server";
import { hasAcademyApi, requestAcademyApi } from "@/lib/academy-api";
import { courses, type Course } from "@/lib/course-catalogue";
import AcademyHome from "./academy-home";

export default async function Home() {
  await connection();

  if (hasAcademyApi()) {
    const response = await requestAcademyApi("/courses");
    if (response.ok) {
      const catalogue: { courses: Course[] } = await response.json();
      return <AcademyHome courses={catalogue.courses} />;
    }
  }

  return <AcademyHome courses={courses} />;
}
