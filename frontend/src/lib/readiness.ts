export type Readiness = {
  status: "ready" | "unavailable";
  storage: "ready" | "unknown";
};

export async function readReadiness(
  origin: string,
  fetcher: typeof fetch = fetch,
): Promise<Readiness> {
  try {
    const response = await fetcher(`${origin}/api/health/ready`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) {
      const body: unknown = await response.json();
      if (
        body &&
        typeof body === "object" &&
        "status" in body &&
        "storage" in body &&
        body.status === "ready" &&
        body.storage === "ready"
      ) {
        return { status: "ready", storage: "ready" };
      }
    }
  } catch {
    // The browser receives a stable state, never private backend error details.
  }
  return { status: "unavailable", storage: "unknown" };
}
