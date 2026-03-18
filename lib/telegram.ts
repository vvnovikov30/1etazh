import "server-only";
import { getEnv, getEnvOptional } from "@/lib/env";

type TelegramGroup = "LEADS" | "DISCUSSION";

type TelegramConfig = {
  token: string;
  chatId: string;
  messageThreadId?: number;
};

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
  
  // P0: Используем безопасный доступ к ENV
  // В production выбрасывает ошибку если отсутствует
  // В development возвращает null (graceful degradation)
  let token: string;
  let chatId: string;
  
  try {
    token = getEnv(envKeys.token);
    chatId = getEnv(envKeys.chatId);
  } catch {
    // В production getEnv выбрасывает ошибку - это правильно
    // В development возвращает пустую строку
    return null;
  }

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

export async function sendTelegramMessage(group: TelegramGroup, text: string): Promise<boolean> {
  const config = getTelegramConfig(group);
  if (!config) return false;

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
  });

  if (!response.ok) return false;

  const payload = (await response.json()) as { ok?: boolean };
  return payload.ok === true;
}
