import { getDatabase } from "./mongodb";

export const sections = [
  ["overview", "Dashboard"], ["users", "User"], ["courses", "Course"],
  ["delivery", "Training Delivery"], ["assessment", "Assessment"], ["batches", "Batch Details"],
  ["attendance", "Attendance"], ["reports", "Report"], ["fellowship", "Fellowship SDP Report"],
  ["capstone", "Capstone Project Teams"], ["forms", "Form Builder"], ["queries", "View All Queries"],
  ["profile", "My Profile"],
] as const;

export type ActivityField = {
  key: string;
  label: string;
  type?: "date" | "time" | "url" | "textarea" | "learner";
  options?: readonly string[];
  optional?: boolean;
};

type Activity = { title: string; action: string; fields: ActivityField[] };

export const activities = {
  delivery: { title: "Class plan", action: "Save class plan", fields: [
    { key: "date", label: "Class date", type: "date" }, { key: "time", label: "Start time (IST)", type: "time" },
    { key: "status", label: "Delivery status", options: ["Scheduled", "Delivered", "Cancelled"] },
    { key: "details", label: "Topics, objectives and resources", type: "textarea" },
    { key: "link", label: "Meeting or lesson link (optional)", type: "url", optional: true },
  ] },
  assessment: { title: "Assessment and result", action: "Save assessment", fields: [
    { key: "type", label: "Assessment type", options: ["Assignment", "Quiz", "Practical", "Project"] },
    { key: "date", label: "Due date", type: "date" },
    { key: "learner", label: "Learner (optional for planning)", type: "learner", optional: true },
    { key: "score", label: "Score (optional, 0–100%)", optional: true },
    { key: "details", label: "Instructions or feedback", type: "textarea" },
  ] },
  attendance: { title: "Attendance record", action: "Save attendance", fields: [
    { key: "date", label: "Class date", type: "date" }, { key: "learner", label: "Learner", type: "learner" },
    { key: "status", label: "Attendance", options: ["Present", "Absent", "Late", "Excused"] },
    { key: "details", label: "Notes (optional)", type: "textarea", optional: true },
  ] },
  fellowship: { title: "Fellowship SDP update", action: "Save SDP update", fields: [
    { key: "learner", label: "Learner", type: "learner" }, { key: "date", label: "Review date", type: "date" },
    { key: "status", label: "Progress", options: ["On track", "Needs support", "Completed"] },
    { key: "details", label: "Skills practised, evidence and next steps", type: "textarea" },
  ] },
  capstone: { title: "Capstone team", action: "Save team", fields: [
    { key: "members", label: "Batch member emails (comma-separated)", type: "textarea" },
    { key: "date", label: "Next milestone due", type: "date" },
    { key: "status", label: "Stage", options: ["Planning", "Building", "Review", "Completed"] },
    { key: "details", label: "Project brief and next milestone", type: "textarea" },
  ] },
  forms: { title: "Form template", action: "Save template", fields: [
    { key: "type", label: "Purpose", options: ["Feedback", "Check-in", "Assessment", "Other"] },
    { key: "details", label: "Questions (one per line)", type: "textarea" },
  ] },
  queries: { title: "Learner query", action: "Save query", fields: [
    { key: "learner", label: "Learner", type: "learner" },
    { key: "status", label: "Status", options: ["Open", "In progress", "Resolved"] },
    { key: "details", label: "Question or issue", type: "textarea" },
    { key: "response", label: "Response or follow-up (optional)", type: "textarea", optional: true },
  ] },
} satisfies Record<string, Activity>;

export type ActivityKind = keyof typeof activities;
export type TrainerBatch = { _id: string; trainer: string; name: string; course: string; students: string[]; sourceForm?: string };
export type TrainerRecord = {
  _id: string; trainer: string; batch: string; kind: ActivityKind; title: string;
  values: Record<string, string>; updatedAt: Date;
};

export const trainerBatches = () => getDatabase().collection<TrainerBatch>("trainerBatches");
export const trainerRecords = () => getDatabase().collection<TrainerRecord>("trainerRecords");
