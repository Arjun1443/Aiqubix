import genai from "./lessons/genai.json";
import python from "./lessons/python.json";
import rag from "./lessons/rag.json";
import studio from "./lessons/studio.json";

export type Lesson = {
  title: string;
  explanation: string;
  example: string;
  steps: string[];
  question: string;
  answer: string;
};

export const curriculum = [
  {
    slug: "generative-ai-foundations",
    title: "Generative AI Foundations",
    image: "/course-illustrations/genai.webp",
    alt: "A prompt with school event facts leads to a draft, then a check of names and dates.",
    description: "Start with prompts and tokens, work through the maths behind predictions, and finish by testing a school notice assistant.",
    lessons: genai,
  },
  {
    slug: "python-for-data-analysis",
    title: "Python for Data Analysis",
    image: "/course-illustrations/python.webp",
    alt: "A bar chart compares 24 robotics members with 12 chess members on a zero baseline.",
    description: "Learn Python and pandas, clean school and sports datasets, and explain what your calculations and charts show.",
    lessons: python,
  },
  {
    slug: "rag-applications-with-langchain",
    title: "RAG Applications with LangChain",
    image: "/course-illustrations/rag.webp",
    alt: "A question about practice time retrieves a school notice, then returns an answer with its source.",
    description: "Build up from document search to embeddings, citations, evaluation, and a school handbook assistant.",
    lessons: rag,
    reference: { name: "LangChain retrieval guide", href: "https://docs.langchain.com/oss/python/langchain/retrieval" },
  },
  {
    slug: "career-ready-project-studio",
    title: "Career-ready Project Studio",
    image: "/course-illustrations/studio.webp",
    alt: "A problem leads to a tested prototype, then a demo that explains the result and its limits.",
    description: "Plan a project, test it with realistic examples, measure the result, and present a demo a classmate can reproduce.",
    lessons: studio,
  },
];

export function getCurriculum(slug: string) {
  return curriculum.find((course) => course.slug === slug);
}
