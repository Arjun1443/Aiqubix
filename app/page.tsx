import { courses } from "@/lib/course-catalogue";
import AcademyHome from "./academy-home";

export default function Home() {
  return <AcademyHome courses={courses} />;
}
