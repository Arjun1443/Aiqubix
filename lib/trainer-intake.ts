import { randomInt } from "node:crypto";
import { MongoServerError } from "mongodb";
import { getDatabase } from "./mongodb";
import { trainerBatches, type TrainerBatch } from "./trainer-workspace";

export type IntakeForm = {
  _id: string;
  trainer: string;
  title: string;
  course: string;
  questions: string[];
  createdAt: Date;
};
export type IntakeResponse = {
  _id: string;
  form: string;
  student: string;
  name: string;
  phone: string;
  education: string;
  answers: string[];
  submittedAt: Date;
};

export const intakeForms = () => getDatabase().collection<IntakeForm>("intakeForms");
export const intakeResponses = () => getDatabase().collection<IntakeResponse>("intakeResponses");

export function intakeReturnPath(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value)
    ? `/intake/${value}`
    : undefined;
}

const codeSpace = 36 ** 3;

export async function insertCodedBatch(batch: Omit<TrainerBatch, "_id">) {
  const collection = trainerBatches();
  const start = randomInt(codeSpace);
  let taken: Set<string> | undefined;
  for (let offset = 0; offset < codeSpace; offset++) {
    const suffix = ((start + offset) % codeSpace).toString(36).toUpperCase().padStart(3, "0");
    const code = `AIQ_B_${suffix}`;
    if (taken?.has(code)) continue;
    try {
      // MongoDB's collection-wide unique _id index arbitrates concurrent inserts.
      await collection.insertOne({ ...batch, _id: code });
      return code;
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
      if (!taken && offset >= 7) {
        const used = await collection.find({ _id: /^AIQ_B_/ }, { projection: { _id: 1 } }).toArray();
        taken = new Set(used.map((item) => item._id));
      }
    }
  }
  return null;
}
