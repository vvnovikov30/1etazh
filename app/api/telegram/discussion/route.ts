import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

type DiscussionPayload = {
  slug?: string;
  title?: string;
  url?: string;
};

function cleanValue(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  const body = (await request.json()) as DiscussionPayload;

  const slug = cleanValue(body.slug, 120);
  const title = cleanValue(body.title, 200);
  const url = cleanValue(body.url, 500);

  if (!slug || !title) {
    return NextResponse.json({ ok: false, error: "Недостаточно данных для обсуждения." }, { status: 400 });
  }

  const text = [
    "Запрос на обсуждение статьи",
    `Статья: ${title}`,
    `Slug: ${slug}`,
    `Ссылка: ${url || "—"}`,
  ].join("\n");

  const sent = await sendTelegramMessage("DISCUSSION", text);
  if (!sent) {
    return NextResponse.json({ ok: false, error: "Telegram не настроен или временно недоступен." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
