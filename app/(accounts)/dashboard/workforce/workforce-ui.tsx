import type { ReactNode } from "react";
import type { Appraisal, Leave, Workday } from "@/lib/workforce";

export function WorkPanel({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return <section id={id} className="academy-panel academy-panel-body trainer-section"><h2>{title}</h2>{children}</section>;
}

export function workTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  }).format(value) + " IST";
}

export function WorkdayList({ rows }: { rows: Workday[] }) {
  return rows.length ? <ul className="academy-course-list">{rows.map((item) => (
    <li key={item._id}><div><p>{item.date}</p><small>In · {workTime(item.clockIn)}</small>
      <small>{item.clockOut ? `Out · ${workTime(item.clockOut)}` : "Shift still open"}</small>
    </div></li>
  ))}</ul> : <p className="academy-empty">No work attendance recorded yet.</p>;
}

export function LeaveList({ rows, action }: { rows: Leave[]; action?: (row: Leave) => ReactNode }) {
  return rows.length ? <ul className="trainer-record-list">{rows.map((item) => (
    <li key={item._id}>
      <header><h3>{item.category} leave</h3><span className="academy-status">{item.status}</span></header>
      <p>{item.start} to {item.end}</p>
      <p className="academy-empty">{item.reason}</p>
      {item.decisionNote && <p className="academy-empty">Decision note · {item.decisionNote}</p>}
      {item.decidedAt && <p className="academy-empty">Decided · {workTime(item.decidedAt)}</p>}
      {action?.(item)}
    </li>
  ))}</ul> : <p className="academy-empty">No leave requests yet.</p>;
}

export function AppraisalList({ rows }: { rows: Appraisal[] }) {
  return rows.length ? <ul className="trainer-record-list">{rows.map((item) => (
    <li key={item._id}>
      <header><h3>{item.period}</h3><span className="academy-status">{item.rating}/5</span></header>
      <dl><div><dt>Feedback</dt><dd>{item.feedback}</dd></div><div><dt>Development goals</dt><dd>{item.goals}</dd></div></dl>
    </li>
  ))}</ul> : <p className="academy-empty">No appraisals have been published yet.</p>;
}
