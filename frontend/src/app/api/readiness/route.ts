import { readReadiness } from "../../../lib/readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readReadiness(
    process.env.ORCHESTRATOR_URL ?? "http://127.0.0.1:8080",
  );
  return Response.json(state, {
    status: state.status === "ready" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
