import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { curriculum, getCurriculum } from "@/lib/academy-curriculum";
import { codeExamples } from "@/lib/lesson-code";
import { Walkthrough } from "../../walkthrough";

const visualExamples: Record<string, Record<number, { image: string; alt: string }>> = {
  "generative-ai-foundations": {
    10: { image: "/course-illustrations/probability.webp", alt: "Bars show three next-token probabilities: 60%, 30%, and 10%. Together they add to 100%." },
  },
  "python-for-data-analysis": {
    22: { image: "/course-illustrations/python.webp", alt: "With a zero baseline, the bar for 24 robotics members is twice as tall as the bar for 12 chess members." },
  },
  "rag-applications-with-langchain": {
    7: { image: "/course-illustrations/distance.webp", alt: "A right triangle shows a horizontal change of 3 and vertical change of 4. The diagonal distance is 5." },
  },
};

type LessonPage = { params: Promise<{ course: string; lesson: string }> };

export function generateStaticParams() {
  return curriculum.flatMap((course) => course.lessons.map((_, index) => ({
    course: course.slug,
    lesson: String(index + 1),
  })));
}

function getLessonNumber(value: string) {
  return /^[1-9][0-9]*$/.test(value) ? Number(value) : 0;
}

export async function generateMetadata({ params }: LessonPage) {
  const { course, lesson } = await params;
  const item = getCurriculum(course)?.lessons[getLessonNumber(lesson) - 1];
  return { title: item ? `${item.title} | AIQUBIX Academy` : "Lesson | AIQUBIX Academy" };
}

export default async function CourseLesson({ params }: LessonPage) {
  const { course: slug, lesson } = await params;
  const course = getCurriculum(slug);
  const number = getLessonNumber(lesson);
  const item = course?.lessons[number - 1];
  if (!course || !item) notFound();
  const base = `/courses/${course.slug}`;
  const code = codeExamples[course.slug]?.[number];
  const exampleImage = visualExamples[course.slug]?.[number];

  return (
    <>
      <nav className="lesson-breadcrumb" aria-label="Lesson location">
        <Link href="/#catalogue">Courses</Link><span aria-hidden="true">/</span><Link href={base}>{course.title}</Link>
      </nav>
      <article className="academy-panel lesson-article">
        <header className="lesson-heading">
          <p className="academy-kicker">Lesson {number} of {course.lessons.length}</p>
          <h1 className="academy-title">{item.title}</h1>
        </header>
        <div className="lesson-body">
          {number === 1 && <Image src={course.image} alt={course.alt} width={880} height={320} className="lesson-image" />}
          <section className="lesson-reading" aria-labelledby="lesson-idea">
            <h2 id="lesson-idea">The idea</h2><p>{item.explanation}</p>
          </section>
          <Walkthrough steps={item.steps} />
          <section className="lesson-example" aria-labelledby="lesson-example">
            <h2 id="lesson-example">Worked example</h2><p>{item.example}</p>
          </section>
          {exampleImage && <Image src={exampleImage.image} alt={exampleImage.alt} width={880} height={320} className="lesson-image" />}
          {code && <section className="lesson-reading" aria-labelledby="lesson-code">
            <h2 id="lesson-code">Try the code</h2>
            <pre tabIndex={0} aria-label="Python example"><code>{code}</code></pre>
          </section>}
          <section className="lesson-reading" aria-labelledby="lesson-practice">
            <h2 id="lesson-practice">Check your understanding</h2><p>{item.question}</p>
            <details className="lesson-answer"><summary>Reveal answer</summary><p>{item.answer}</p></details>
          </section>
        </div>
      </article>
      <nav className="lesson-navigation" aria-label="Lesson navigation">
        {number > 1 ? <Link className="academy-button academy-button-secondary" href={`${base}/${number - 1}`}>← Previous lesson</Link>
          : <Link className="academy-button academy-button-secondary" href={base}>← Course outline</Link>}
        {number < course.lessons.length ? <Link className="academy-button" href={`${base}/${number + 1}`}>Next lesson →</Link>
          : <Link className="academy-button" href={base}>Back to course outline</Link>}
      </nav>
    </>
  );
}
