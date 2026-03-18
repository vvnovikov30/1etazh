import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { normalizePhoneToE164, isValidRuPhoneE164 } from "@/lib/phone";

type LeadsPayload = {
  name?: string;
  phone?: string;
  phoneFormatted?: string;
  email?: string;
  comment?: string;
  pageUrl?: string;
  type?: string;
  preferredDay?: "today" | "weekend" | "weekday" | "custom";
  preferredTime?: "morning" | "day" | "evening";
  preferredDate?: string | null;
  sourcePath?: string;
  sourceBlock?: string;
  hp?: string;
  website?: string;
};

// Allowlists для строгой валидации
const TYPE_ALLOWLIST = ["showroom_visit"] as const;
const PREFERRED_DAY_ALLOWLIST = ["today", "weekend", "weekday", "custom"] as const;
const PREFERRED_TIME_ALLOWLIST = ["morning", "day", "evening"] as const;

type SafeReadJsonError = "UNSUPPORTED_CONTENT_TYPE" | "PAYLOAD_TOO_LARGE" | "INVALID_JSON";

async function safeReadJson<T>(request: Request): Promise<{ data: T } | { error: SafeReadJsonError }> {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return { error: "UNSUPPORTED_CONTENT_TYPE" };
  }

  const text = await request.text();
  const sizeBytes = new TextEncoder().encode(text).length;

  if (sizeBytes > 20000) {
    return { error: "PAYLOAD_TOO_LARGE" };
  }

  try {
    const data = JSON.parse(text) as T;
    return { data };
  } catch {
    return { error: "INVALID_JSON" };
  }
}

function cleanValue(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function validateType(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return TYPE_ALLOWLIST.includes(value as (typeof TYPE_ALLOWLIST)[number]) ? value : null;
}

function validatePreferredDay(value: unknown): LeadsPayload["preferredDay"] | null {
  if (typeof value !== "string") return null;
  return PREFERRED_DAY_ALLOWLIST.includes(value as (typeof PREFERRED_DAY_ALLOWLIST)[number])
    ? (value as LeadsPayload["preferredDay"])
    : null;
}

function validatePreferredTime(value: unknown): LeadsPayload["preferredTime"] | null {
  if (typeof value !== "string") return null;
  return PREFERRED_TIME_ALLOWLIST.includes(value as (typeof PREFERRED_TIME_ALLOWLIST)[number])
    ? (value as LeadsPayload["preferredTime"])
    : null;
}

export async function POST(request: Request) {
  // Rate limiting обрабатывается в middleware.ts
  // Safe JSON parsing
  const jsonResult = await safeReadJson<LeadsPayload>(request);
  if ("error" in jsonResult) {
    switch (jsonResult.error) {
      case "UNSUPPORTED_CONTENT_TYPE":
        return NextResponse.json(
          { ok: false, error: "Unsupported Media Type" },
          { status: 415 }
        );
      case "PAYLOAD_TOO_LARGE":
        return NextResponse.json(
          { ok: false, error: "Payload Too Large" },
          { status: 413 }
        );
      case "INVALID_JSON":
        return NextResponse.json(
          { ok: false, error: "Invalid JSON" },
          { status: 400 }
        );
    }
  }

  const body = jsonResult.data;

  // Honeypot check
  if (body.hp || body.website) {
    // Spam detected - silently return success
    return NextResponse.json({ ok: true });
  }

  const name = cleanValue(body.name, 120);
  let phone = cleanValue(body.phone, 60);
  const phoneFormatted = cleanValue(body.phoneFormatted, 60);
  const email = cleanValue(body.email, 120);
  const comment = cleanValue(body.comment, 1200);
  const pageUrl = cleanValue(body.pageUrl, 300);
  const type = validateType(body.type);
  const preferredDay = validatePreferredDay(body.preferredDay);
  const preferredTime = validatePreferredTime(body.preferredTime);
  const preferredDate = body.preferredDate ? cleanValue(String(body.preferredDate), 20) : null;
  const sourcePath = cleanValue(body.sourcePath, 300);
  const sourceBlock = cleanValue(body.sourceBlock, 50);

  // Диагностическое логирование (только в dev)
  if (process.env.NODE_ENV !== "production") {
    // Маскируем телефон: показываем только последние 4 цифры
    const phoneMasked = phone
      ? `***${phone.slice(-4)}`
      : phoneFormatted
      ? `***${phoneFormatted.slice(-4)}`
      : null;

    console.info("[LEADS_API_START]", {
      type,
      preferredDay,
      preferredTime,
      preferredDate,
      sourcePath,
      hasPhone: Boolean(phone || phoneFormatted),
      phoneMasked,
    });
  }

  // Нормализация и валидация телефона
  if (phone) {
    const normalized = normalizePhoneToE164(phone);
    
    // Валидация: строго 11 цифр, начинается с +7
    if (normalized && !isValidRuPhoneE164(normalized)) {
      return NextResponse.json(
        { ok: false, error: "Введите номер в формате +7(XXX) XXX-XX-XX" },
        { status: 400 }
      );
    }
    
    // Если нормализованный номер пустой, но phone был передан - значит неполный номер
    if (!normalized && phone.trim()) {
      return NextResponse.json(
        { ok: false, error: "Введите номер в формате +7(XXX) XXX-XX-XX" },
        { status: 400 }
      );
    }
    
    // Используем нормализованный номер
    phone = normalized;
  }

  if (!phone && !email) {
    return NextResponse.json({ ok: false, error: "Укажите телефон или email." }, { status: 400 });
  }

  // Формируем текст заявки
  const lines = ["Новая заявка с сайта"];
  
  if (name) lines.push(`Имя: ${name}`);
  if (phoneFormatted || phone) lines.push(`Телефон: ${phoneFormatted || phone}`);
  if (email) lines.push(`Email: ${email}`);
  if (comment) lines.push(`Комментарий: ${comment}`);
  
  // Добавляем информацию о бронировании шоурума
  if (type === "showroom_visit") {
    if (preferredDay) {
      const dayLabels: Record<string, string> = {
        today: "Сегодня",
        weekend: "Ближайшие выходные",
        weekday: "На неделе",
        custom: "Другая дата",
      };
      lines.push(`📅 День: ${dayLabels[preferredDay] || preferredDay}`);
      
      if (preferredDay === "custom" && preferredDate) {
        // Улучшенная валидация даты
        const date = new Date(preferredDate);
        if (!Number.isNaN(date.getTime())) {
          const formattedDate = date.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          lines.push(`📆 Дата: ${formattedDate}`);
        } else {
          lines.push(`📆 Дата: ${preferredDate}`);
        }
      }
    }
    
    if (preferredTime) {
      const timeLabels: Record<string, string> = {
        morning: "Утро 10–13",
        day: "День 13–17",
        evening: "Вечер 17–20",
      };
      lines.push(`🕒 Время: ${timeLabels[preferredTime] || preferredTime}`);
    }
  }
  
  if (sourcePath || pageUrl) {
    lines.push(`Страница: ${sourcePath || pageUrl}`);
  }
  if (sourceBlock) {
    lines.push(`Блок: ${sourceBlock}`);
  }
  
  const text = lines.join("\n");

  // Диагностическое логирование перед отправкой в Telegram
  // NEVER log secrets - только статус конфигурации без значений
  if (process.env.NODE_ENV !== "production") {
    // Используем getEnvOptional для безопасной проверки (не логируем значения)
    const { getEnvOptional } = await import("@/lib/env");
    console.info("[TELEGRAM_SEND_ATTEMPT]", {
      chatIdConfigured: Boolean(getEnvOptional("TELEGRAM_LEADS_CHAT_ID")),
      hasThread: Boolean(getEnvOptional("TELEGRAM_LEADS_MESSAGE_THREAD_ID")),
    });
  }

  try {
    const sent = await sendTelegramMessage("LEADS", text);
    
    if (!sent) {
      // NEVER log secrets
      if (process.env.NODE_ENV !== "production") {
        console.error("[TELEGRAM_SEND_ERROR]", {
          message: "sendTelegramMessage returned false",
        });
      }
      return NextResponse.json(
        { ok: false, error: "Telegram не настроен или временно недоступен." },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[TELEGRAM_SEND_SUCCESS]");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // NEVER log secrets - логируем только ошибку без контекста секретов
    if (process.env.NODE_ENV !== "production") {
      console.error("[TELEGRAM_SEND_ERROR]", err instanceof Error ? err.message : "Unknown error");
    }
    return NextResponse.json(
      { ok: false, error: "Telegram send failed" },
      { status: 500 }
    );
  }
}
