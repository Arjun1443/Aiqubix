import type { Course } from "./course-catalogue";
import { getDatabase } from "./mongodb";

export async function getCourses() {
  return getDatabase()
    .collection<Course>("courses")
    .find<Course>({}, {
      projection: {
        _id: 0,
        title: 1,
        category: 1,
        level: 1,
        duration: 1,
        lessons: 1,
        accent: 1,
        text: 1,
      },
    })
    .sort({ position: 1, title: 1 })
    .toArray();
}
