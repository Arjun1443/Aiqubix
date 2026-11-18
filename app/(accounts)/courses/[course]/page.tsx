import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { curriculum, getCurriculum } from "@/lib/academy-curriculum";

type CoursePage = { params: Promise<{ course: string }> };

export function generateStaticParams() {
  return curriculum.map(({ slug }) => ({ course: slug }));
}

export async function generateMetadata({ params }: CoursePage) {
  const course = getCurriculum((await params).course);
  return { title: course ? `${course.title} | AIQUBIX Academy` : "Course | AIQUBIX Academy" };
}

export default async function CourseOverview({ params }: CoursePage) {
  const course = getCurriculum((await params).course);
  if (!course) notFound();
  const base = `/courses/${course.slug}`;

  return (
    <>
      <nav className="lesson-breadcrumb" aria-label="Course location">
        <Link href="/#catalogue">Course catalogue</Link><span aria-hidden="true">/</span><span>{course.title}</span>
      </nav>
      <header className="academy-panel curriculum-hero">
        <div>
          <p className="academy-kicker">{course.lessons.length} lessons · Class 10 reading level</p>
          <h1 className="academy-title">{course.title}</h1>
          <p className="academy-description">{course.description}</p>
          <Link className="academy-button" href={`${base}/1`}>Start lesson 1</Link>
        </div>
        <Image src={course.image} alt={course.alt} width={880} height={320} priority />
      </header>
      <section className="academy-panel lesson-outline" aria-labelledby="lesson-list">
        <header className="academy-panel-body"><h2 id="lesson-list">Course lessons</h2></header>
        <ol>
          {course.lessons.map((lesson, index) => (
            <li key={lesson.title}><Link href={`${base}/${index + 1}`}>
              <span className="lesson-index">{index + 1}</span><span>{lesson.title}</span><span className="lesson-forward" aria-hidden="true">→</span>
            </Link></li>
          ))}
        </ol>
        {course.reference && <p className="academy-panel-body"><a href={course.reference.href}>{course.reference.name}</a></p>}
      </section>
    </>
  );
}
