import { MongoClient } from "mongodb";
import { courses } from "../lib/course-catalogue.ts";

const uri = process.env.MONGODB_URI?.trim();
if (!uri) throw new Error("MONGODB_URI is missing");

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, socketTimeoutMS: 10000 });
try {
  const collection = client.db(process.env.MONGODB_DATABASE?.trim() || "aiqubix").collection("courses");
  const result = await collection.bulkWrite(
    courses.map((course, position) => ({
      updateOne: {
        filter: { title: course.title },
        update: { $setOnInsert: { ...course, position } },
        upsert: true,
      },
    })),
  );
  console.log(`Inserted ${result.upsertedCount} courses. Matched ${result.matchedCount} existing courses.`);
} catch (error) {
  console.error("Unable to seed courses", error instanceof Error ? error.name : "Unknown error");
  process.exitCode = 1;
} finally {
  await client.close();
}
