import "server-only";

/**
 * P0: Безопасный доступ к переменным окружения.
 * 
 * Правила:
 * - В production: выбрасывает Error если переменная отсутствует
 * - В development: console.warn + возвращает пустую строку
 * - НИКОГДА не логирует значения секретов
 * 
 * Использование:
 *   const token = getEnv("TELEGRAM_LEADS_BOT_TOKEN");
 *   const url = getEnv("UPSTASH_REDIS_REST_URL");
 */
export function getEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${name}`);
    } else {
      // NEVER log secrets - только имя переменной
      console.warn(`[ENV] Missing environment variable: ${name}`);
      return "";
    }
  }

  return value.trim();
}

/**
 * Опциональная переменная окружения (не выбрасывает ошибку в production).
 * Используется для необязательных конфигураций.
 */
export function getEnvOptional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : undefined;
}
