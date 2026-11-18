import { requestAcademyApi } from "@/lib/academy-api";

export function GET() {
  return requestAcademyApi("/health");
}
