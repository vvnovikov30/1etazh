import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/telegram", () => ({
  sendTelegramMessage: vi.fn(),
}));

import { POST } from "@/app/api/telegram/leads/route";
import { sendTelegramMessage } from "@/lib/telegram";

const mockedSendTelegramMessage = vi.mocked(sendTelegramMessage);
const ORIGINAL_ENV = process.env;

function createJsonRequest(body: string, contentType = "application/json"): Request {
  return new Request("http://localhost/api/telegram/leads", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });
}

describe("leads API integration (route.ts)", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "test" };
    mockedSendTelegramMessage.mockReset();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("returns success for valid payload", async () => {
    mockedSendTelegramMessage.mockResolvedValue(true);

    const request = createJsonRequest(
      JSON.stringify({
        name: "Иван",
        phone: "+79850961086",
        type: "showroom_visit",
      })
    );

    const response = await POST(request);
    const payload = (await response.json()) as { ok: boolean };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mockedSendTelegramMessage).toHaveBeenCalledTimes(1);
    expect(mockedSendTelegramMessage).toHaveBeenCalledWith(
      "LEADS",
      expect.stringContaining("Новая заявка с сайта")
    );
  });

  it("returns 400 for invalid JSON", async () => {
    const request = createJsonRequest("{invalid-json");

    const response = await POST(request);
    const payload = (await response.json()) as { ok: boolean; error: string };

    expect(response.status).toBe(400);
    expect(payload).toEqual({ ok: false, error: "Invalid JSON" });
    expect(mockedSendTelegramMessage).not.toHaveBeenCalled();
  });

  it("returns 415 for unsupported content-type", async () => {
    const request = createJsonRequest(JSON.stringify({ phone: "+79850961086" }), "text/plain");

    const response = await POST(request);
    const payload = (await response.json()) as { ok: boolean; error: string };

    expect(response.status).toBe(415);
    expect(payload).toEqual({ ok: false, error: "Unsupported Media Type" });
    expect(mockedSendTelegramMessage).not.toHaveBeenCalled();
  });

  it("silently accepts honeypot payload and does not send to Telegram", async () => {
    const request = createJsonRequest(
      JSON.stringify({
        name: "Spam Bot",
        phone: "+79850961086",
        hp: "filled",
      })
    );

    const response = await POST(request);
    const payload = (await response.json()) as { ok: boolean };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(mockedSendTelegramMessage).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid phone", async () => {
    const request = createJsonRequest(
      JSON.stringify({
        name: "Иван",
        phone: "123",
      })
    );

    const response = await POST(request);
    const payload = (await response.json()) as { ok: boolean; error: string };

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: "Введите номер в формате +7(XXX) XXX-XX-XX",
    });
    expect(mockedSendTelegramMessage).not.toHaveBeenCalled();
  });

  it("returns 500 when Telegram send returns false", async () => {
    mockedSendTelegramMessage.mockResolvedValue(false);
    process.env.NODE_ENV = "development";
    process.env.TELEGRAM_LEADS_BOT_TOKEN = "super-secret-token";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const request = createJsonRequest(
      JSON.stringify({
        name: "Иван",
        phone: "+79850961086",
      })
    );

    const response = await POST(request);
    const payload = (await response.json()) as { ok: boolean; error: string };

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Telegram не настроен или временно недоступен.",
    });
    expect(mockedSendTelegramMessage).toHaveBeenCalledTimes(1);

    const logged = errorSpy.mock.calls.flat().map(String).join(" ");
    expect(logged).not.toContain("super-secret-token");
  });

  it("returns 413 when payload exceeds size limit", async () => {
    const request = createJsonRequest(
      JSON.stringify({
        phone: "+79850961086",
        comment: "a".repeat(21000),
      })
    );

    const response = await POST(request);
    const payload = (await response.json()) as { ok: boolean; error: string };

    expect(response.status).toBe(413);
    expect(payload).toEqual({ ok: false, error: "Payload Too Large" });
    expect(mockedSendTelegramMessage).not.toHaveBeenCalled();
  });
});
