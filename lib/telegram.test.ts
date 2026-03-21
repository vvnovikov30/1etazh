import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;

async function loadSendTelegramMessage() {
  vi.resetModules();
  const mod = await import("@/lib/telegram");
  return mod.sendTelegramMessage;
}

describe("lib/telegram.ts retry/timeout hardening", () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      TELEGRAM_LEADS_BOT_TOKEN: "secret-leads-token",
      TELEGRAM_LEADS_CHAT_ID: "12345",
      TELEGRAM_MAX_RETRIES: "2",
    };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  it("retries on abort/timeout-like errors and succeeds within retry budget", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockRejectedValueOnce(new DOMException("The operation was aborted.", "AbortError"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const sendTelegramMessage = await loadSendTelegramMessage();

    const result = await sendTelegramMessage("LEADS", "hello");

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("retries on transient network failure and succeeds", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const sendTelegramMessage = await loadSendTelegramMessage();
    const result = await sendTelegramMessage("LEADS", "hello");

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries on HTTP 429 and 5xx, then stops at retry ceiling", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: false }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      })
    );

    const sendTelegramMessage = await loadSendTelegramMessage();
    const result = await sendTelegramMessage("LEADS", "hello");

    expect(result).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("retries on HTTP 429 and can recover", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: false }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const sendTelegramMessage = await loadSendTelegramMessage();
    const result = await sendTelegramMessage("LEADS", "hello");

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry on non-retryable 4xx (except 429)", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: false }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );

    const sendTelegramMessage = await loadSendTelegramMessage();
    const result = await sendTelegramMessage("LEADS", "hello");

    expect(result).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not leak secret token values in logs", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const sendTelegramMessage = await loadSendTelegramMessage();
    const result = await sendTelegramMessage("LEADS", "hello");

    expect(result).toBe(false);
    const logged = warnSpy.mock.calls.flat().map(String).join(" ");
    expect(logged).not.toContain("secret-leads-token");
  });
});
