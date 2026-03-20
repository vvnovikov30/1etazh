/**
 * Константы ссылок и контактов.
 * 
 * P0: Для переопределения через ENV используйте NEXT_PUBLIC_ префикс
 * (эти переменные не секреты, они публичные URL).
 */
function getTelegramDiscussionUrl(): string {
  // NEXT_PUBLIC_ переменные доступны на клиенте, но это не секреты
  return process.env.NEXT_PUBLIC_TELEGRAM_DISCUSSION_URL || "https://t.me/lesnye_polyany";
}

function getTelegramChannelUrl(): string {
  // NEXT_PUBLIC_ переменные доступны на клиенте, но это не секреты
  return process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL || "https://t.me/CodeofEnvironment";
}

export const LINKS = {
  telegramChat: getTelegramDiscussionUrl(),
  telegramChannel: getTelegramChannelUrl(),
  phoneE164: "+79850961086",
  phoneDisplay: "+7 (985) 096-10-86",
  tel: "tel:+79850961086",
  email: "vvnovikov30@yandex.ru",
};
