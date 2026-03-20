import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
}));

import { middleware } from "@/middleware";
import { rateLimit } from "@/lib/rate-limit";

const mockedRateLimit = vi.mocked(rateLimit);
const ORIGINAL_ENV = process.env;

type FakeRequest = {
  nextUrl: { pathname: string };
  headers: Headers;
};

describe("middleware integration smoke", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "development" };
    mockedRateLimit.mockReset();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("returns blocked response from rate limiter and appends debug header in development", async () => {
    mockedRateLimit.mockResolvedValue({
      allowed: false,
      response: new Response(
        JSON.stringify({
          ok: false,
          error: "Too many requests",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
          },
        }
      ),
      identifier: "ip:1.2.3.4",
    });

    const request = {
      nextUrl: { pathname: "/api/telegram/leads" },
      headers: new Headers(),
    } as FakeRequest;

    const response = await middleware(request as never);

    expect(response.status).toBe(429);
    expect(response.headers.get("X-Debug-Ratelimit-Id")).toBe("ip:1.2.3.4");
    expect(mockedRateLimit).toHaveBeenCalledTimes(1);
  });

  it("skips rateLimit for non-telegram routes", async () => {
    const request = {
      nextUrl: { pathname: "/contacts" },
      headers: new Headers(),
    } as FakeRequest;

    const response = await middleware(request as never);

    expect(response.status).toBe(200);
    expect(mockedRateLimit).not.toHaveBeenCalled();
  });
});
