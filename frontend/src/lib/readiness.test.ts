import { describe, expect, it, vi } from "vitest";
import { readReadiness } from "./readiness";

describe("readReadiness", () => {
  it("accepts only an explicitly ready backend and storage", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ status: "ready", storage: "ready" }));
    expect(await readReadiness("http://127.0.0.1:8080", fetcher)).toEqual({ status: "ready", storage: "ready" });
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8080/api/health/ready", expect.objectContaining({ cache: "no-store", signal: expect.any(AbortSignal) }));
  });

  it.each([
    [503, { status: "unavailable", storage: "unavailable" }],
    [200, { status: "ready" }],
    [200, { status: "ready", storage: "unavailable" }],
    [200, null],
    [500, { error: "private filesystem path" }],
  ])("maps HTTP %s or invalid payloads to unavailable", async (code, body) => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(body, { status: code }));
    expect(await readReadiness("http://127.0.0.1:8080", fetcher)).toEqual({ status: "unavailable", storage: "unknown" });
  });

  it("contains network failures and malformed JSON", async () => {
    for (const fetcher of [vi.fn().mockRejectedValue(new Error("private detail")), vi.fn().mockResolvedValue(new Response("not json"))]) {
      expect(await readReadiness("http://127.0.0.1:8080", fetcher)).toEqual({ status: "unavailable", storage: "unknown" });
    }
  });

  it("sets a bounded request timeout", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetcher = vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    expect((await readReadiness("http://127.0.0.1:8080", fetcher)).status).toBe("unavailable");
    expect(timeout).toHaveBeenCalledWith(2000);
    timeout.mockRestore();
  });
});
