import json
from pathlib import Path

from main import Course, database


def seed_courses():
    collection = database().courses
    records = json.loads(Path(__file__).with_name("courses.json").read_text(encoding="utf-8"))
    for position, record in enumerate(records):
        course = Course.model_validate(record)
        collection.update_one(
            {"title": course.title},
            {"$setOnInsert": {**course.model_dump(), "position": position}},
            upsert=True,
        )


if __name__ == "__main__":
    seed_courses()
