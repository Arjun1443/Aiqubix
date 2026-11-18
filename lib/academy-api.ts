export function hasAcademyApi() {
  return Boolean(process.env.FASTAPI_BASE_URL?.trim());
}

export async function requestAcademyApi(path: "/courses" | "/health") {
  const baseUrl = process.env.FASTAPI_BASE_URL?.trim();

  try {
    if (!baseUrl) throw new Error("FASTAPI_BASE_URL is missing");

    const response = await fetch(new URL(baseUrl.replace(/\/+$/, "") + path), {
      cache: "no-store",
      signal: AbortSignal.timeout(6500),
    });

    if (!response.ok) {
      console.error("FastAPI request failed", path, response.status);
      return Response.json({ detail: "Academy API unavailable" }, { status: 503 });
    }

    return Response.json(await response.json());
  } catch {
    console.error("FastAPI request unavailable", path);
    return Response.json({ detail: "Academy API unavailable" }, { status: 503 });
  }
}
