const courseSlugs: Record<string, string> = {
  "Generative AI Foundations": "generative-ai-foundations",
  "Python for Data Analysis": "python-for-data-analysis",
  "RAG Applications with LangChain": "rag-applications-with-langchain",
  "Career-ready Project Studio": "career-ready-project-studio",
};

export function courseLessonPath(title: string) {
  return Object.hasOwn(courseSlugs, title) ? `/courses/${courseSlugs[title]}` : undefined;
}
