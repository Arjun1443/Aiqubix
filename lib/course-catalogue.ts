export type Course = {
  title: string;
  category: string;
  level: string;
  duration: string;
  lessons: number;
  accent: string;
  text: string;
};

export const courses: Course[] = [
  {
    title: "Generative AI Foundations",
    category: "AI & GenAI",
    level: "Beginner",
    duration: "6 weeks",
    lessons: 32,
    accent: "from-[#0b3977] via-[#286eb2] to-[#f28a1b]",
    text: "Understand prompts, LLMs, agents, and responsible AI.",
  },
  {
    title: "Python for Data Analysis",
    category: "Data & Analytics",
    level: "Beginner",
    duration: "5 weeks",
    lessons: 28,
    accent: "from-[#174a86] via-[#5b98d2] to-[#f28a1b]",
    text: "Build confidence with Python, Pandas, and visualisation.",
  },
  {
    title: "RAG Applications with LangChain",
    category: "AI & GenAI",
    level: "Intermediate",
    duration: "4 weeks",
    lessons: 24,
    accent: "from-[#082e60] via-[#2f72b7] to-[#e57612]",
    text: "Create useful document assistants with retrieval and evaluation.",
  },
  {
    title: "Career-ready Project Studio",
    category: "Career Skills",
    level: "All levels",
    duration: "3 weeks",
    lessons: 15,
    accent: "from-[#245f9f] via-[#2f72b7] to-[#f28a1b]",
    text: "Turn a learning plan into a polished portfolio project.",
  },
];
