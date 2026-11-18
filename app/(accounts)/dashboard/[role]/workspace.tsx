import {
  Award, BookOpen, CalendarDays, ClipboardList, GraduationCap, Headphones,
  LayoutDashboard, ListChecks, Settings2, UserPlus, UserRound, UsersRound,
} from "lucide-react";
import type { Role } from "@/lib/academy-accounts";

const sections = {
  overview: { label: "Overview", icon: LayoutDashboard },
  courses: { label: "Courses", icon: BookOpen },
  progress: { label: "Learning progress", icon: ListChecks },
  schedule: { label: "Schedule", icon: CalendarDays },
  assignments: { label: "Assignments & quizzes", icon: ClipboardList },
  certificates: { label: "Certificates", icon: Award },
  support: { label: "Support", icon: Headphones },
  batches: { label: "Batches", icon: GraduationCap },
  directory: { label: "Directory", icon: UsersRound },
  reporting: { label: "Reports", icon: ListChecks },
  invitations: { label: "Staff invitations", icon: UserPlus },
  settings: { label: "Platform status", icon: Settings2 },
  profile: { label: "My profile", icon: UserRound },
};

type Section = keyof typeof sections;
const navigation: Record<Exclude<Role, "trainer">, Section[]> = {
  student: ["overview", "courses", "progress", "schedule", "assignments", "certificates", "support", "profile"],
  "senior-manager": ["overview", "directory", "batches", "reporting", "profile"],
  admin: ["overview", "invitations", "directory", "courses", "settings", "profile"],
};

export function WorkspaceNav({ role }: { role: Exclude<Role, "trainer"> }) {
  return (
    <nav className="academy-panel academy-workspace-nav" aria-label="Dashboard sections">
      {navigation[role].map((section) => {
        const { label, icon: Icon } = sections[section];
        return <a key={section} href={`#${section}`}><Icon size={17} aria-hidden="true" />{label}</a>;
      })}
    </nav>
  );
}

export function WorkspaceSummary({ items }: { items: { label: string; value: number | string; href: string }[] }) {
  return (
    <div className="academy-workspace-summary">
      {items.map(({ label, value, href }) => (
        <a key={label} href={href} className="academy-panel academy-workspace-stat">
          <span>{label}</span><strong>{value}</strong>
        </a>
      ))}
    </div>
  );
}

export function WorkspaceEmpty({ section, description }: { section: Section; description: string }) {
  const { label, icon: Icon } = sections[section];
  return (
    <section id={section} className="academy-panel">
      <div className="academy-panel-heading">
        <span className="academy-icon" aria-hidden="true"><Icon size={20} /></span>
        <h2>{label}</h2>
      </div>
      <p className="academy-panel-body academy-empty">{description}</p>
    </section>
  );
}
