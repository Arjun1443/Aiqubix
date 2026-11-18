"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { FormResult } from "../../actions";
import { accounts, requireAccount, tokenHash } from "@/lib/academy-accounts";
import { getCourses } from "@/lib/academy-courses";
import { activities, trainerBatches, trainerRecords, type ActivityKind, type ActivityField } from "@/lib/trainer-workspace";

const route = "/dashboard/trainer";
const unavailable = { message: "The record could not be saved. Try again shortly." };

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createBatch(_: FormResult, form: FormData): Promise<FormResult> {
  const trainer = await requireAccount("trainer");
  const name = field(form, "name");
  const course = field(form, "course");
  if (!name || name.length > 100) return { message: "Enter a batch name of up to 100 characters." };
  try {
    if (!(await getCourses()).some((item) => item.title === course)) return { message: "Select a course in the catalogue." };
    await trainerBatches().insertOne({ _id: randomUUID(), trainer: trainer._id, name, course, students: [] });
  } catch {
    return unavailable;
  }
  revalidatePath(route);
  return { message: "Batch created. Select it from the batch list to manage it." };
}

export async function addLearner(_: FormResult, form: FormData): Promise<FormResult> {
  const trainer = await requireAccount("trainer");
  const batch = field(form, "batch");
  const email = field(form, "email").toLowerCase();
  if (!email || email.length > 254) return { message: "Enter the learner’s academy email." };
  try {
    const target = await trainerBatches().findOne({ _id: batch, trainer: trainer._id });
    if (!target) return { message: "Choose one of your batches." };
    const learner = await accounts().findOne(
      { _id: email, role: "student", enrolledCourses: target.course },
      { projection: { _id: 1 } },
    );
    if (!learner) return { message: "Use the email of a student already enrolled in this course." };
    await trainerBatches().updateOne({ _id: batch, trainer: trainer._id }, { $addToSet: { students: email } });
  } catch {
    return unavailable;
  }
  revalidatePath(route);
  return { message: "Learner is on the batch roster." };
}

function validDate(value: string) {
  const date = new Date(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function saveTrainerRecord(_: FormResult, form: FormData): Promise<FormResult> {
  const trainer = await requireAccount("trainer");
  const batch = field(form, "batch");
  const key = field(form, "kind");
  const recordId = field(form, "record");
  const title = field(form, "title");
  if (!Object.hasOwn(activities, key) || !title || title.length > 120) return { message: "Enter a valid record title." };
  const kind = key as ActivityKind;
  try {
    const target = await trainerBatches().findOne({ _id: batch, trainer: trainer._id });
    if (!target) return { message: "Choose one of your batches." };
    const values: Record<string, string> = {};
    for (const input of activities[kind].fields as ActivityField[]) {
      const value = field(form, input.key);
      if (!value && input.optional) continue;
      if (!value || value.length > 3000
        || (input.options && !input.options.includes(value))
        || (input.type === "learner" && !target.students.includes(value))
        || (input.type === "date" && !validDate(value))
        || (input.type === "time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
        || (input.type === "url" && URL.parse(value)?.protocol !== "https:")) {
        return { message: `Check the value for ${input.label}.` };
      }
      values[input.key] = value;
    }
    if (values.score && (!values.learner || !/^\d{1,3}(\.\d{1,2})?$/.test(values.score) || Number(values.score) > 100)) {
      return { message: "Select a learner and enter a score between 0 and 100." };
    }
    if (values.members) {
      const members = [...new Set(values.members.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean))];
      if (!members.length || members.some((email) => !target.students.includes(email))) return { message: "Use emails from this batch’s roster." };
      values.members = members.join(", ");
    }
    const records = trainerRecords();
    const scope = { trainer: trainer._id, batch, kind };
    const update = { title, values, updatedAt: new Date() };
    if (kind === "attendance") {
      const _id = tokenHash(JSON.stringify([batch, kind, title.toLowerCase(), values.date, values.learner]));
      await records.updateOne({ _id, ...scope }, { $set: update, $setOnInsert: scope }, { upsert: true });
    } else if (recordId) {
      const result = await records.updateOne({ _id: recordId, ...scope }, { $set: update });
      if (!result.matchedCount) return { message: "This record is unavailable in the selected batch." };
    } else {
      await records.insertOne({ _id: randomUUID(), ...scope, ...update });
    }
  } catch {
    return unavailable;
  }
  revalidatePath(route);
  return { message: "Record saved." };
}
