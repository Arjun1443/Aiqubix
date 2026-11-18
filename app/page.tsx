"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  CirclePlay,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  GraduationCap,
  LibraryBig,
  LockKeyhole,
  MessageCircleQuestion,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Tool = { title: string; text: string; icon: LucideIcon };
type Course = {
  title: string;
  category: string;
  level: string;
  duration: string;
  lessons: number;
  accent: string;
  text: string;
};

const courses: Course[] = [
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

const studentTools: Tool[] = [
  { title: "Course library", text: "Browse guided learning paths", icon: LibraryBig },
  { title: "Live classes", text: "See upcoming mentor sessions", icon: Video },
  { title: "Quizzes", text: "Check understanding instantly", icon: ClipboardCheck },
  { title: "Project studio", text: "Submit practical work", icon: BrainCircuit },
  { title: "Certificates", text: "View completed credentials", icon: Award },
  { title: "Mentor support", text: "Ask questions when stuck", icon: MessageCircleQuestion },
];

const instructorTools: Tool[] = [
  { title: "Course builder", text: "Organise modules and lessons", icon: BookOpen },
  { title: "Quiz studio", text: "Create knowledge checks", icon: ClipboardCheck },
  { title: "Project review", text: "Give learner feedback", icon: FileCheck2 },
  { title: "Live calendar", text: "Plan mentor-led sessions", icon: CalendarDays },
];

const adminTools: Tool[] = [
  { title: "Users & roles", text: "Set secure account access", icon: UserRoundCheck },
  { title: "Batches", text: "Group learners by programme", icon: UsersRound },
  { title: "Reports", text: "Track enrolment and outcomes", icon: BarChart3 },
  { title: "Platform settings", text: "Manage content and notices", icon: Settings2 },
];

const categories = ["All", "AI & GenAI", "Data & Analytics", "Career Skills"];
const selectableItems = [
  "Sign in",
  "Student workspace",
  "Access setup",
  ...courses.map((course) => course.title),
  ...studentTools.map((tool) => tool.title),
  ...instructorTools.map((tool) => tool.title),
  ...adminTools.map((tool) => tool.title),
];

type WebMCPTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: unknown) => unknown;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
};

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: WebMCPTool,
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

function readTextInput(input: unknown, key: string) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("A valid input object is required.");
  }
  const value = (input as Record<string, unknown>)[key];
  if (typeof value !== "string" || value.length > 100) {
    throw new Error("Provide a short text value.");
  }
  return value.trim();
}

function ToolGrid({
  tools,
  onOpen,
}: {
  tools: Tool[];
  onOpen: (name: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tools.map(({ title, text, icon: Icon }) => (
        <Button
          key={title}
          type="button"
          variant="ghost"
          onClick={() => onOpen(title)}
          className="h-auto min-h-28 justify-start rounded-2xl border border-white/10 bg-[#0b1a2b]/80 p-4 text-left text-slate-100 shadow-none transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-[#10263c] hover:text-white"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{title}</span>
            <span className="mt-1 block whitespace-normal text-xs leading-5 text-slate-400">
              {text}
            </span>
          </span>
        </Button>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#091827]/85 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{helper}</p>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);

  const visibleCourses = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter((course) => {
      const categoryMatches = category === "All" || course.category === category;
      const source = course.title + " " + course.category + " " + course.text;
      return categoryMatches && (!needle || source.toLowerCase().includes(needle));
    });
  }, [category, query]);

  const open = (name: string) => setSelected(name);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();

    const registerTools = async () => {
      await context.registerTool(
        {
          name: "filter_course_catalogue",
          title: "Filter course catalogue",
          description:
            "Filter the visible AIQUBIX Academy course catalogue by a search phrase.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Course search phrase" },
            },
            required: ["query"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const term = readTextInput(input, "query");
            setQuery(term);
            setCategory("All");
            const matches = courses
              .filter((course) =>
                (course.title + " " + course.category + " " + course.text)
                  .toLowerCase()
                  .includes(term.toLowerCase()),
              )
              .map((course) => course.title);
            return { query: term, count: matches.length, courses: matches };
          },
        },
        { signal: lifecycle.signal },
      );

      await context.registerTool(
        {
          name: "open_workspace_item",
          title: "Open a workspace item",
          description:
            "Select a visible course or available workspace tool in the AIQUBIX Academy interface.",
          inputSchema: {
            type: "object",
            properties: {
              item: {
                type: "string",
                enum: selectableItems,
                description: "Visible course or tool to select",
              },
            },
            required: ["item"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const item = readTextInput(input, "item");
            if (!selectableItems.includes(item)) {
              throw new Error("That workspace item is not available.");
            }
            setSelected(item);
            return { item, status: "selected" };
          },
        },
        { signal: lifecycle.signal },
      );
    };

    void registerTools().catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <main className="site-shell min-h-screen overflow-x-hidden text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06101ddd]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a
            href="#workspace"
            className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span className="brand-logo-mark grid h-10 w-10 place-items-center rounded-xl font-black text-white">
              A
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-[0.14em] text-white">
                AIQUBIX
              </span>
              <span className="block text-[10px] font-medium tracking-[0.18em] text-cyan-200">
                ACADEMY
              </span>
            </span>
          </a>

          <nav aria-label="Main navigation" className="hidden gap-6 text-sm text-slate-300 md:flex">
            <a className="transition hover:text-cyan-200" href="#workspace">Workspace</a>
            <a className="transition hover:text-cyan-200" href="#catalogue">Courses</a>
            <a className="transition hover:text-cyan-200" href="#access">Access</a>
          </nav>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => open("Sign in")}
            className="border-cyan-200/30 bg-cyan-200/5 text-cyan-100 hover:bg-cyan-200/15 hover:text-white"
          >
            Sign in <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <section id="workspace" className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="pt-3 lg:pt-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-300/8 px-3 py-1.5 text-xs font-medium text-cyan-100">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Learning, mentoring, and outcomes in one place
            </div>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Build skills for a smarter tomorrow.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              AIQUBIX Academy brings courses, live guidance, practical projects,
              assessments, and certificates into a clear learning workflow.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-cyan-200 text-[#05101d] hover:bg-cyan-100"
              >
                Explore courses <ArrowRight aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => open("Student workspace")}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                Open workspace
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-300">
              <span className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="h-4 w-4 text-cyan-200" />Role-based access</span>
              <span className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="h-4 w-4 text-cyan-200" />Project-first learning</span>
              <span className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="h-4 w-4 text-cyan-200" />Mentor support</span>
            </div>
          </div>

          <Card className="overflow-hidden border-white/10 bg-[#0a1a2b]/85 py-0 shadow-[0_30px_90px_rgba(0,0,0,0.24)] backdrop-blur">
            <CardHeader className="border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <CardTitle className="text-base text-white">Today&apos;s learning</CardTitle>
                <CardDescription className="mt-1 text-sm text-slate-400">Pick up exactly where you left off.</CardDescription>
              </div>
              <div data-slot="card-action" className="rounded-full bg-[#e7f5e9] px-3 py-1 text-xs font-medium text-[#397a48]">3 active courses</div>
            </CardHeader>
            <CardContent className="space-y-5 px-5 py-5 sm:px-6">
              <div className="rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-[#e8f4ff] via-white to-[#fff1df] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-cyan-200">Continue learning</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Generative AI Foundations</h2>
                    <p className="mt-1 text-sm text-slate-300">Module 4 · Building useful prompts</p>
                  </div>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-200 text-[#06111f]"><CirclePlay aria-hidden="true" className="h-5 w-5" /></span>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-300"><span>62% complete</span><span>12 lessons left</span></div>
                  <Progress value={62} className="h-2 bg-cyan-100/15 [&>[data-slot=progress-indicator]]:bg-cyan-200" />
                </div>
                <Button type="button" size="sm" onClick={() => open("Generative AI Foundations")} className="mt-5 bg-cyan-200 text-[#06111f] hover:bg-cyan-100">
                  Resume lesson <ArrowRight aria-hidden="true" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Live class" value="Thu, 6 PM" helper="RAG office hours" />
                <Metric label="Quiz due" value="2 days" helper="Prompting checkpoint" />
                <Metric label="Current streak" value="4 days" helper="Keep momentum going" />
              </div>
            </CardContent>
          </Card>
        </section>

        {selected ? (
          <div aria-live="polite" className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-200/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
            <span className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="h-4 w-4 text-cyan-200" /><strong className="font-semibold">{selected}</strong> is selected in this workspace.</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)} className="h-7 text-cyan-100 hover:bg-cyan-200/10 hover:text-white">Dismiss</Button>
          </div>
        ) : null}

        <section className="mt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Role workspaces</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">One platform, the right tools for each person.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400">Accounts show only the tools permitted by registration and assigned role.</p>
          </div>

          <Tabs defaultValue="student" className="gap-5">
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-white/10 bg-[#0a1a2b]/80 p-1.5 sm:w-[430px]">
              <TabsTrigger value="student" className="h-10 rounded-xl text-xs text-slate-400 data-[state=active]:bg-cyan-200 data-[state=active]:text-[#06111f] sm:text-sm">Student</TabsTrigger>
              <TabsTrigger value="instructor" className="h-10 rounded-xl text-xs text-slate-400 data-[state=active]:bg-cyan-200 data-[state=active]:text-[#06111f] sm:text-sm">Instructor</TabsTrigger>
              <TabsTrigger value="admin" className="h-10 rounded-xl text-xs text-slate-400 data-[state=active]:bg-cyan-200 data-[state=active]:text-[#06111f] sm:text-sm">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="mt-0">
              <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
                <Card className="border-white/10 bg-[#0a1a2b]/80 py-0">
                  <CardHeader className="px-5 pb-0 pt-5">
                    <CardTitle className="text-lg text-white">Student dashboard</CardTitle>
                    <CardDescription className="text-slate-400">Learn, practise, submit, and track your outcomes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-5 pb-5 pt-5">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#071524] p-4">
                      <div><p className="text-sm font-semibold text-white">Upcoming live class</p><p className="mt-1 text-sm text-slate-400">RAG office hours · Thursday, 6:00 PM</p></div>
                      <CalendarDays aria-hidden="true" className="h-5 w-5 text-cyan-200" />
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#071524] p-4">
                      <div><p className="text-sm font-semibold text-white">Next task</p><p className="mt-1 text-sm text-slate-400">Submit your chatbot project brief.</p></div>
                      <FileCheck2 aria-hidden="true" className="h-5 w-5 text-cyan-200" />
                    </div>
                  </CardContent>
                </Card>
                <div><h3 className="mb-3 text-sm font-semibold text-white">Learning tools</h3><ToolGrid tools={studentTools} onOpen={open} /></div>
              </div>
            </TabsContent>

            <TabsContent value="instructor" className="mt-0">
              <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
                <Card className="border-white/10 bg-[#0a1a2b]/80 py-0">
                  <CardHeader className="px-5 pb-0 pt-5">
                    <CardTitle className="text-lg text-white">Teaching overview</CardTitle>
                    <CardDescription className="text-slate-400">Keep cohorts supported without losing the bigger picture.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 px-5 pb-5 pt-5 sm:grid-cols-3 lg:grid-cols-1">
                    <Metric label="Assigned learners" value="128" helper="Across 3 active cohorts" />
                    <Metric label="Project reviews" value="14" helper="Waiting for feedback" />
                    <Metric label="Attendance" value="87%" helper="This week so far" />
                  </CardContent>
                </Card>
                <div><h3 className="mb-3 text-sm font-semibold text-white">Teaching tools</h3><ToolGrid tools={instructorTools} onOpen={open} /></div>
              </div>
            </TabsContent>

            <TabsContent value="admin" className="mt-0">
              <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
                <Card className="border-white/10 bg-[#0a1a2b]/80 py-0">
                  <CardHeader className="px-5 pb-0 pt-5">
                    <CardTitle className="text-lg text-white">Platform overview</CardTitle>
                    <CardDescription className="text-slate-400">Run learning operations with clear access control.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-5 pb-5 pt-5">
                    <div className="grid grid-cols-2 gap-3"><Metric label="Active learners" value="1,248" helper="+12% this month" /><Metric label="Completion" value="74%" helper="Across active courses" /></div>
                    <div className="flex gap-3 rounded-xl border border-emerald-300/15 bg-emerald-300/7 p-4">
                      <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#397a48]" />
                      <p className="text-sm leading-6 text-[#245f38]">Student self-registration is separate from invitation-only instructor and admin access.</p>
                    </div>
                  </CardContent>
                </Card>
                <div><h3 className="mb-3 text-sm font-semibold text-white">Operations tools</h3><ToolGrid tools={adminTools} onOpen={open} /></div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <section id="catalogue" className="mt-16 scroll-mt-28">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Course catalogue</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Start with the skill you need next.</h2>
            </div>
            <label className="relative block w-full md:w-80">
              <span className="sr-only">Search courses</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a course" className="h-11 border-white/10 bg-[#0a1a2b] pl-10 text-base text-white placeholder:text-slate-500 focus-visible:border-cyan-300 focus-visible:ring-cyan-300/20" />
            </label>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {categories.map((item) => (
              <Button key={item} type="button" size="sm" variant={category === item ? "default" : "ghost"} onClick={() => setCategory(item)} className={category === item ? "bg-cyan-200 text-[#06111f] hover:bg-cyan-100" : "border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white"}>
                {item}
              </Button>
            ))}
          </div>

          {visibleCourses.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {visibleCourses.map((course) => (
                <Card key={course.title} className="overflow-hidden border-white/10 bg-[#0a1a2b]/80 py-0 shadow-none transition duration-200 hover:-translate-y-1 hover:border-cyan-200/35">
                  <div className={"h-2 w-full bg-gradient-to-r " + course.accent} />
                  <CardHeader className="px-5 pb-0 pt-5">
                    <div className="flex items-center justify-between gap-3 text-xs"><span className="rounded-full bg-white/8 px-2.5 py-1 text-slate-300">{course.category}</span><span className="text-slate-500">{course.level}</span></div>
                    <CardTitle className="pt-1 text-lg leading-6 text-white">{course.title}</CardTitle>
                    <CardDescription className="min-h-12 text-sm leading-5 text-slate-400">{course.text}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-5">
                    <div className="flex items-center justify-between text-xs text-slate-400"><span className="flex items-center gap-1.5"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" />{course.duration}</span><span>{course.lessons} lessons</span></div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => open(course.title)} className="mt-5 w-full border border-white/10 bg-white/[0.03] text-slate-100 hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-white">
                      View course <ArrowRight aria-hidden="true" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Empty className="border-white/10 bg-[#0a1a2b]/50">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-cyan-200/10 text-cyan-200"><Search aria-hidden="true" /></EmptyMedia>
                <EmptyTitle className="text-white">No courses found</EmptyTitle>
                <EmptyDescription className="text-slate-400">Try another search word or category.</EmptyDescription>
              </EmptyHeader>
              <Button type="button" variant="outline" size="sm" onClick={() => { setQuery(""); setCategory("All"); }} className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">Reset catalogue</Button>
            </Empty>
          )}
        </section>

        <section id="access" className="mt-16 scroll-mt-28">
          <div className="grid gap-6 rounded-3xl border border-white/10 bg-[#0a1a2b]/85 p-6 sm:p-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200"><LockKeyhole aria-hidden="true" className="h-4 w-4" />Registration-based access</div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">Keep every workspace appropriate and secure.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">A simple registration flow guides students into learning, while teaching and administration access stays controlled through invitations and approvals.</p>
              <Button type="button" onClick={() => open("Access setup")} className="mt-5 bg-cyan-200 text-[#06111f] hover:bg-cyan-100">View access setup <ArrowRight aria-hidden="true" /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#071524] p-4"><GraduationCap aria-hidden="true" className="h-5 w-5 text-cyan-200" /><h3 className="mt-4 text-sm font-semibold text-white">Student</h3><p className="mt-2 text-sm leading-6 text-slate-400">Self-register, verify the account, and access enrolled courses.</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#071524] p-4"><UsersRound aria-hidden="true" className="h-5 w-5 text-violet-200" /><h3 className="mt-4 text-sm font-semibold text-white">Instructor</h3><p className="mt-2 text-sm leading-6 text-slate-400">Invitation-only access to assigned learners and courses.</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#071524] p-4"><ShieldCheck aria-hidden="true" className="h-5 w-5 text-emerald-200" /><h3 className="mt-4 text-sm font-semibold text-white">Admin</h3><p className="mt-2 text-sm leading-6 text-slate-400">Restricted operations access for users, batches, and reports.</p></div>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-white/10 bg-[#050d17]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:px-8">
          <p>© 2026 AIQUBIX Academy · Learning · Innovation · Social Impact</p>
          <div className="flex items-center gap-4"><a className="transition hover:text-cyan-200" href="#workspace">Workspace</a><a className="transition hover:text-cyan-200" href="#catalogue">Courses</a><a className="transition hover:text-cyan-200" href="#access">Access</a></div>
        </div>
      </footer>
    </main>
  );
}
