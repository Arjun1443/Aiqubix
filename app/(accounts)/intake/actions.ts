"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { accounts, requireAccount, tokenHash } from "@/lib/academy-accounts";
import { getCourses } from "@/lib/academy-courses";
import { insertCodedBatch, intakeForms, intakeResponses } from "@/lib/trainer-intake";
import type { FormResult } from "../actions";

const trainerPath = "/dashboard/trainer";
const unavailable = { message: "Could not save your changes. Try again shortly." };

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function publishIntake(_: FormResult, data: FormData): Promise<FormResult> {
  const trainer = await requireAccount("trainer");
  const title = text(data, "title");
  const course = text(data, "course");
  const questions = text(data, "questions").split(/\r?\n/).map((question) => question.trim()).filter(Boolean);
  if (!title || title.length > 120 || questions.length > 10 || questions.some((question) => question.length > 180)) {
    return { message: "Enter a form title and up to ten questions of 180 characters each." };
  }
  try {
    if (!(await getCourses()).some((item) => item.title === course)) return { message: "Select a valid course." };
    await intakeForms().insertOne({ _id: randomUUID(), trainer: trainer._id, title, course, questions, createdAt: new Date() });
  } catch {
    return unavailable;
  }
  revalidatePath(trainerPath);
  return { message: "Form published. Share its student link from Published forms." };
}

export async function submitIntake(_: FormResult, data: FormData): Promise<FormResult> {
  const student = await requireAccount("student");
  const id = text(data, "form");
  const name = text(data, "name");
  const phone = text(data, "phone");
  const education = text(data, "education");
  if (name.length < 2 || name.length > 100 || !/^[+\d ()-]{7,25}$/.test(phone) || phone.replace(/\D/g, "").length < 7 || !education || education.length > 200) {
    return { message: "Enter your name, a valid phone number, and your education or current institution." };
  }
  try {
    const form = await intakeForms().findOne({ _id: id });
    if (!form) return { message: "This form is unavailable." };
    const answers = form.questions.map((_, index) => text(data, `answer-${index}`));
    if (answers.some((answer) => !answer || answer.length > 1500)) return { message: "Answer every question in 1,500 characters or fewer." };
    const _id = tokenHash(JSON.stringify([id, student._id]));
    await intakeResponses().updateOne({ _id, form: id, student: student._id }, {
      $setOnInsert: { form: id, student: student._id },
      $set: { name, phone, education, answers, submittedAt: new Date() },
    }, { upsert: true });
  } catch {
    return unavailable;
  }
  revalidatePath(`/intake/${id}`);
  revalidatePath(trainerPath);
  return { message: "Details saved and shared with your trainer." };
}

export async function createIntakeBatch(_: FormResult, data: FormData): Promise<FormResult> {
  const trainer = await requireAccount("trainer");
  const id = text(data, "form");
  const name = text(data, "name");
  const selected = [...new Set(data.getAll("students"))];
  if (!name || name.length > 100 || !selected.length || selected.length > 100 || selected.some((key) => typeof key !== "string")) {
    return { message: "Enter a batch name and select between 1 and 100 students." };
  }
  try {
    const form = await intakeForms().findOne({ _id: id, trainer: trainer._id });
    if (!form) return { message: "Choose one of your published forms." };
    const responses = await intakeResponses().find({ _id: { $in: selected as string[] }, form: id }).toArray();
    if (responses.length !== selected.length) return { message: "Select only responses to this form." };
    const students = responses.map((response) => response.student);
    const active = await accounts().countDocuments({ _id: { $in: students }, role: "student", passwordHash: { $exists: true } });
    if (active !== students.length) return { message: "One or more students no longer have an active account." };
    const code = await insertCodedBatch({ trainer: trainer._id, name, course: form.course, students, sourceForm: id });
    if (!code) return { message: "All three-character batch codes are in use." };
    revalidatePath(trainerPath);
    return { message: `Batch created with ${students.length} students. Code: ${code}` };
  } catch {
    return unavailable;
  }
}
