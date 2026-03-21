import "server-only";
import { getEnv, getEnvOptional } from "@/lib/env";

type TelegramGroup = "LEADS" | "DISCUSSION";

type TelegramConfig = {
  token: string;
  chatId: string;
  messageThreadId?: number;
};

const TELEGRAM_REQUEST_TIMEOUT_MS = (() => {
  const raw = Number.parseInt(getEnvOptional("TELEGRAM_REQUEST_TIMEOUT_MS") || "5000", 10);
  return Number.isNaN(raw) || raw < 1000 || raw > 30000 ? 5000 : raw;
})();

const TELEGRAM_MAX_RETRIES = (() => {
  const raw = Number.parseInt(getEnvOptional("TELEGRAM_MAX_RETRIES") || "2", 10);
  return Number.isNaN(raw) || raw < 0 || raw > 5 ? 2 : raw;
})();

const TELEGRAM_ENV_KEYS: Record<TelegramGroup, { token: string; chatId: string; threadId: string }> = {
  LEADS: {
    token: "TELEGRAM_LEADS_BOT_TOKEN",
    chatId: "TELEGRAM_LEADS_CHAT_ID",
    threadId: "TELEGRAM_LEADS_MESSAGE_THREAD_ID",
  },
  DISCUSSION: {
    token: "TELEGRAM_DISCUSSION_BOT_TOKEN",
    chatId: "TELEGRAM_DISCUSSION_CHAT_ID",
    threadId: "TELEGRAM_DISCUSSION_MESSAGE_THREAD_ID",
  },
};

function getTelegramConfig(group: TelegramGroup): TelegramConfig | null {
  const envKeys = TELEGRAM_ENV_KEYS[group];

  // getEnv fail-fast в production при отсутствии обязательных переменных.
  // В development getEnv возвращает пустую строку, ниже сработает graceful return null.
  const token = getEnv(envKeys.token);
  const chatId = getEnv(envKeys.chatId);

  if (!token || !chatId) return null;

  // Опциональный threadId
  const threadIdRaw = getEnvOptional(envKeys.threadId);
  const messageThreadId = threadIdRaw ? Number(threadIdRaw) : undefined;

  return {
    token,
    chatId,
    messageThreadId: Number.isFinite(messageThreadId) ? messageThreadId : undefined,
  };
}

function shouldRetryStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function shouldRetryError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  // fetch network errors in Node are typically TypeError
  return error instanceof TypeError;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendTelegramMessage(group: TelegramGroup, text: string): Promise<boolean> {
  const config = getTelegramConfig(group);
  if (!config) return false;

  for (let attempt = 0; attempt <= TELEGRAM_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TELEGRAM_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: config.chatId,
          text,
          ...(config.messageThreadId ? { message_thread_id: config.messageThreadId } : {}),
          disable_web_page_preview: true,
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        if (attempt < TELEGRAM_MAX_RETRIES && shouldRetryStatus(response.status)) {
          console.warn(
            `[TELEGRAM] Retryable HTTP status for group=${group}, status=${response.status}, attempt=${attempt + 1}`
          );
          await sleep(150 * (attempt + 1));
          continue;
        }
        return false;
      }

      const payload = (await response.json()) as { ok?: boolean };
      return payload.ok === true;
    } catch (error) {
      if (attempt < TELEGRAM_MAX_RETRIES && shouldRetryError(error)) {
        const reason =
          error instanceof DOMException && error.name === "AbortError" ? "timeout" : "network";
        console.warn(`[TELEGRAM] Retryable ${reason} error for group=${group}, attempt=${attempt + 1}`);
        await sleep(150 * (attempt + 1));
        continue;
      }
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  return false;
}
