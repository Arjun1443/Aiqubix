import type { ReactNode } from "react";
import "./lessons.css";

export default function CoursesLayout({ children }: { children: ReactNode }) {
  return <div className="curriculum-shell">{children}</div>;
}
