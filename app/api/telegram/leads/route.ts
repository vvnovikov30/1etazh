import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { normalizePhone, isValidRuPhoneDigits } from "@/lib/phone";

type LeadsPayload = {
  name?: string;
  phone?: string;
  phoneFormatted?: string;
  email?: string;
  comment?: string;
  pageUrl?: string;
};

function cleanValue(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  const body = (await request.json()) as LeadsPayload;

  const name = cleanValue(body.name, 120);
  let phone = cleanValue(body.phone, 60);
  const phoneFormatted = cleanValue(body.phoneFormatted, 60);
  const email = cleanValue(body.email, 120);
  const comment = cleanValue(body.comment, 1200);
  const pageUrl = cleanValue(body.pageUrl, 300);

  // Нормализация и валидация телефона
  if (phone) {
    const normalized = normalizePhone(phone);
    const digits10 = normalized.digits;
    
    if (digits10.length > 0 && !isValidRuPhoneDigits(digits10)) {
      return NextResponse.json(
        { ok: false, error: "Введите номер в формате +7(XXX) XXX-XX-XX" },
        { status: 400 }
      );
    }
    
    // Сохраняем нормализованный номер (10 цифр или полный с +7)
    if (digits10.length === 10) {
      phone = `+7${digits10}`;
    } else if (phone && !phone.startsWith("+7")) {
      phone = `+7${digits10}`;
    }
  }

  if (!phone && !email) {
    return NextResponse.json({ ok: false, error: "Укажите телефон или email." }, { status: 400 });
  }

  // Если телефон указан, но невалиден (меньше 10 цифр)
  if (phone) {
    const normalized = normalizePhone(phone);
    if (normalized.digits.length > 0 && normalized.digits.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Введите номер в формате +7(XXX) XXX-XX-XX" },
        { status: 400 }
      );
    }
  }

  const text = [
    "Новая заявка с сайта",
    `Имя: ${name || "—"}`,
    `Телефон: ${phoneFormatted || phone || "—"}`,
    `Email: ${email || "—"}`,
    `Комментарий: ${comment || "—"}`,
    `Страница: ${pageUrl || "—"}`,
  ].join("\n");

  const sent = await sendTelegramMessage("LEADS", text);
  if (!sent) {
    return NextResponse.json({ ok: false, error: "Telegram не настроен или временно недоступен." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
