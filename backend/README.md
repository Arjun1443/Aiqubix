# AIQUBIX FastAPI service

Create a separate Vercel project from this repository. Set its Root Directory to
`backend` and select the FastAPI framework. Set `MONGODB_URI` to the hosted
MongoDB connection string and `MONGODB_DATABASE` to your database name
(default `aiqubix`). Keep these settings in the backend project. The MongoDB
user needs permission to read the course collection, and Atlas network access
must permit connections from the API host. Use an API URL that the frontend
deployment can reach without a Vercel sign-in prompt.

Run these commands from `backend` using Python 3.12 or newer. Set the MongoDB
environment variables in your shell first. Use a MongoDB account with write
permission for the seed command. It inserts missing courses by title.

```sh
python -m pip install -r requirements.txt
python seed.py
python -m uvicorn main:app --reload
```

Verify `/health` and `/courses` on the API host. Then set `FASTAPI_BASE_URL` on
the Next.js Vercel project to the deployed API's base URL and redeploy that
project. For local Next.js development set it to `http://127.0.0.1:8000` in
`.env.local`. The Next.js server fetches the API, so the browser makes no
cross-origin requests.

Verify `/api/health` returns `{"status":"ok","database":"ok"}` and
`/api/courses` shows the MongoDB catalogue. The homepage uses the bundled
catalogue if the API is unavailable. A configured but unavailable backend
returns HTTP 503 from the Next.js API routes.
