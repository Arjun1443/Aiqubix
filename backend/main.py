import logging
import os
from functools import lru_cache

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from pymongo.errors import PyMongoError

app = FastAPI(title="AIQUBIX API")
logger = logging.getLogger(__name__)


class Course(BaseModel):
    title: str
    category: str
    level: str
    duration: str
    lessons: int
    accent: str
    text: str


class Catalogue(BaseModel):
    courses: list[Course]


@lru_cache
def database():
    uri = os.getenv("MONGODB_URI")
    if not uri:
        raise RuntimeError("MONGODB_URI is missing")
    client = MongoClient(uri, timeoutMS=4000)
    return client[os.getenv("MONGODB_DATABASE", "aiqubix")]


@app.get("/health")
def health():
    try:
        database().command("ping")
    except (PyMongoError, RuntimeError, ValueError) as error:
        logger.error("MongoDB health check failed (%s)", type(error).__name__)
        raise HTTPException(503, "MongoDB unavailable") from None
    return {"status": "ok", "database": "ok"}


@app.get("/courses", response_model=Catalogue)
def courses():
    projection = dict.fromkeys(Course.model_fields, 1)
    projection["_id"] = 0
    try:
        documents = list(database().courses.find({}, projection).sort("position", 1))
    except (PyMongoError, RuntimeError, ValueError) as error:
        logger.error("MongoDB course query failed (%s)", type(error).__name__)
        raise HTTPException(503, "Course catalogue unavailable") from None
    return {"courses": documents}
