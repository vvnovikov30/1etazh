import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";
import { getEnv, getEnvOptional } from "@/lib/env";

/**
 * Централизованный rate limiting для API endpoints.
 * Использует Upstash Redis для хранения счетчиков запросов.
 *
 * Выбор алгоритма: Sliding Window
 * - Более точный чем Fixed Window (нет резких скачков на границах окон)
 * - Сглаживает распределение запросов во времени
 * - Подходит для production-grade защиты от спама/DoS
 * - Upstash Ratelimit эффективно реализует sliding window на Redis
 *
 * Альтернатива (Fixed Window) проще, но может пропускать всплески запросов
 * на границах временных окон. Sliding Window обеспечивает более равномерное ограничение.
 */

// P0: Fail-fast ENV validation через безопасную обертку
// В production выбрасывает ошибку если отсутствует
// В development возвращает пустую строку (graceful degradation)
let UPSTASH_REDIS_REST_URL: string | undefined;
let UPSTASH_REDIS_REST_TOKEN: string | undefined;

try {
  UPSTASH_REDIS_REST_URL = getEnv("UPSTASH_REDIS_REST_URL");
  UPSTASH_REDIS_REST_TOKEN = getEnv("UPSTASH_REDIS_REST_TOKEN");
} catch (error) {
  // В production getEnv выбрасывает ошибку - это правильно
  // В development getEnv возвращает пустую строку
  if (process.env.NODE_ENV === "production") {
    throw error;
  }
  // NEVER log secrets - только предупреждение без значений
  console.warn(
    "[RATE_LIMIT] Rate limit disabled: missing Redis configuration (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)"
  );
}

// Инициализация Redis клиента (только если ENV настроены)
const redis = UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// P0: Безопасная нормализация RATE_LIMIT_PER_MINUTE
const rawRateLimit = parseInt(
  getEnvOptional("RATE_LIMIT_PER_MINUTE") || "8",
  10
);
const REQUESTS_PER_MINUTE =
  Number.isNaN(rawRateLimit) || rawRateLimit <= 0 || rawRateLimit > 1000
    ? 8
    : rawRateLimit;

// Строгий лимит для unknown IP (fallback identifier)
const UNKNOWN_IP_LIMIT = 2;

// Создаем rate limiter с Sliding Window алгоритмом (только если Redis настроен)
const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(REQUESTS_PER_MINUTE, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/telegram",
    })
  : null;

// Строгий лимит для unknown IP
const unknownIpRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(UNKNOWN_IP_LIMIT, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/telegram-unknown",
    })
  : null;

/**
 * P0.5: Проверяет, является ли IP публичным (не private/reserved).
 * Фильтрует приватные, зарезервированные, CGNAT и test/documentation диапазоны.
 *
 * @param ip - Валидный IP адрес (IPv4 или IPv6)
 * @returns true если IP публичный, false если private/reserved/CGNAT/test
 */
function isPublicIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") {
    return false;
  }

  // IPv4 проверка
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = ip.match(ipv4Regex);
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match;
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    const numC = parseInt(c, 10);
    const numD = parseInt(d, 10);

    // 0.0.0.0/8 (reserved)
    if (numA === 0) {
      return false;
    }

    // 10.0.0.0/8 (private)
    if (numA === 10) {
      return false;
    }

    // 100.64.0.0/10 (CGNAT - Carrier-Grade NAT)
    if (numA === 100 && numB >= 64 && numB <= 127) {
      return false;
    }

    // 127.0.0.0/8 (loopback)
    if (numA === 127) {
      return false;
    }

    // 169.254.0.0/16 (link-local)
    if (numA === 169 && numB === 254) {
      return false;
    }

    // 172.16.0.0/12 (private)
    if (numA === 172 && numB >= 16 && numB <= 31) {
      return false;
    }

    // 192.0.2.0/24 (TEST-NET-1 - documentation/test)
    if (numA === 192 && numB === 0 && numC === 2) {
      return false;
    }

    // 192.168.0.0/16 (private)
    if (numA === 192 && numB === 168) {
      return false;
    }

    // 198.51.100.0/24 (TEST-NET-2 - documentation/test)
    if (numA === 198 && numB === 51 && numC === 100) {
      return false;
    }

    // 203.0.113.0/24 (TEST-NET-3 - documentation/test)
    if (numA === 203 && numB === 0 && numC === 113) {
      return false;
    }

    // 224.0.0.0/4 (multicast)
    if (numA >= 224 && numA <= 239) {
      return false;
    }

    // 240.0.0.0/4 (reserved)
    if (numA >= 240 && numA <= 255) {
      return false;
    }

    // 255.255.255.255 (broadcast)
    if (numA === 255 && numB === 255 && numC === 255 && numD === 255) {
      return false;
    }

    // Все остальные публичные IPv4
    return true;
  }

  // IPv6 проверка
  // ::/128 (unspecified) - точно не публичный
  if (ip === "::" || ip === "::/128" || ip === "::0" || ip === "0:0:0:0:0:0:0:0") {
    return false;
  }

  // ::1 (loopback) - точно не публичный
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") {
    return false;
  }

  // ::ffff:0:0/96 (IPv4-mapped IPv6 addresses)
  // Извлекаем вложенный IPv4 и проверяем его напрямую (без рекурсии)
  if (ip.startsWith("::ffff:") || ip.startsWith("0:0:0:0:0:ffff:")) {
    // Извлекаем IPv4 часть
    const ipv4Part = ip.includes("::ffff:") 
      ? ip.substring(ip.indexOf("::ffff:") + 7)
      : ip.substring(ip.indexOf("0:0:0:0:0:ffff:") + 15);
    
    const ipv4Match = ipv4Part.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b, c, d] = ipv4Match;
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      const numC = parseInt(c, 10);
      const numD = parseInt(d, 10);
      
      // Проверяем валидность IPv4
      if (
        numA >= 0 && numA <= 255 &&
        numB >= 0 && numB <= 255 &&
        numC >= 0 && numC <= 255 &&
        numD >= 0 && numD <= 255
      ) {
        // Проверяем на private/reserved/CGNAT/test ranges
        // Если вложенный IPv4 не публичный - возвращаем false
        if (
          numA === 0 || // 0.0.0.0/8
          numA === 10 || // 10.0.0.0/8
          numA === 127 || // 127.0.0.0/8
          (numA === 100 && numB >= 64 && numB <= 127) || // 100.64.0.0/10 (CGNAT)
          (numA === 169 && numB === 254) || // 169.254.0.0/16
          (numA === 172 && numB >= 16 && numB <= 31) || // 172.16.0.0/12
          (numA === 192 && numB === 0 && numC === 2) || // 192.0.2.0/24 (TEST-NET-1)
          (numA === 192 && numB === 168) || // 192.168.0.0/16
          (numA === 198 && numB === 51 && numC === 100) || // 198.51.100.0/24 (TEST-NET-2)
          (numA === 203 && numB === 0 && numC === 113) || // 203.0.113.0/24 (TEST-NET-3)
          (numA >= 224 && numA <= 255) // 224.0.0.0/4 (multicast/reserved)
        ) {
          return false;
        }
        // Вложенный IPv4 публичный
        return true;
      }
    }
    // Невалидный IPv4-mapped адрес
    return false;
  }

  // 2001:db8::/32 (documentation range) - точно не публичный
  if (ip.startsWith("2001:db8:") || ip.startsWith("2001:0db8:")) {
    return false;
  }

  // fc00::/7 (unique local address - ULA) - точно не публичный
  // fc00::/8 и fd00::/8
  if (ip.startsWith("fc") || ip.startsWith("fd") || 
      ip.startsWith("fc00:") || ip.startsWith("fd00:")) {
    return false;
  }

  // fe80::/10 (link-local) - точно не публичный
  // fe80:: - febf::
  if (ip.startsWith("fe8") || ip.startsWith("fe9") || 
      ip.startsWith("fea") || ip.startsWith("feb") ||
      ip.startsWith("fe80:") || ip.startsWith("fe90:") || 
      ip.startsWith("fea0:") || ip.startsWith("feb0:")) {
    return false;
  }

  // ff00::/8 (multicast) - точно не публичный
  if (ip.startsWith("ff") || ip.startsWith("ff00:")) {
    return false;
  }

  // Все остальные IPv6 считаем публичными (глобальные unicast адреса)
  return true;
}

/**
 * Валидирует IP адрес используя строгую проверку формата.
 * Поддерживает IPv4 и IPv6.
 *
 * @param ip - Строка с IP адресом
 * @returns true если IP валидный, false иначе
 */
function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") {
    return false;
  }

  // Защита от слишком длинных строк
  if (ip.length > 64) {
    return false;
  }

  // Защита от пробелов и спецсимволов (кроме двоеточия и точек для IPv6/IPv4)
  if (/[\s<>"']/.test(ip)) {
    return false;
  }

  // Простая валидация IPv4: 4 октета, каждый 0-255
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = ip.match(ipv4Regex);
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match;
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    const numC = parseInt(c, 10);
    const numD = parseInt(d, 10);
    if (
      numA >= 0 &&
      numA <= 255 &&
      numB >= 0 &&
      numB <= 255 &&
      numC >= 0 &&
      numC <= 255 &&
      numD >= 0 &&
      numD <= 255
    ) {
      return true;
    }
  }

  // Простая валидация IPv6 (упрощенная, но достаточная для защиты)
  // IPv6: группы hex цифр, разделенные двоеточиями, возможны :: для сжатия
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$|^::1$|^::$/;
  if (ipv6Regex.test(ip)) {
    // Дополнительная проверка: не более 8 групп
    const groups = ip.split("::");
    if (groups.length <= 2) {
      return true;
    }
  }

  return false;
}

/**
 * Безопасный доступ к req.ip (может отсутствовать в типах Next 16, но доступен в runtime).
 * @param req - Next.js request объект
 * @returns IP адрес или undefined
 */
function getReqIp(req: NextRequest): string | undefined {
  return (req as unknown as { ip?: string }).ip;
}

/**
 * Извлекает и валидирует IP адрес клиента из запроса.
 * P0.5: Trusted IP strategy - req.ip имеет приоритет, XFF только если нет req.ip и IP публичный.
 *
 * @param req - Next.js request объект
 * @returns Объект с primary IP (req.ip) и fallback IP (XFF), или "unknown"
 */
function getClientIp(req: NextRequest): { primary: string | null; fallback: string | null } {
  // P0.5: Приоритет 1 - req.ip (если доступен и валиден)
  let primaryIp: string | null = null;
  const reqIp = getReqIp(req);
  if (reqIp && isValidIp(reqIp) && isPublicIp(reqIp)) {
    primaryIp = reqIp;
  }

  // P0.5: Приоритет 2 - x-forwarded-for (только если нет req.ip)
  let fallbackIp: string | null = null;
  if (!primaryIp) {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor && forwardedFor.length <= 200) {
      const firstIp = forwardedFor.split(",")[0]?.trim();
      if (firstIp && isValidIp(firstIp) && isPublicIp(firstIp)) {
        fallbackIp = firstIp;
      }
    }
  }

  // P0.5: x-real-ip как дополнительный fallback (только если нет primary и fallback)
  if (!primaryIp && !fallbackIp) {
    const realIp = req.headers.get("x-real-ip");
    if (realIp && realIp.length <= 64 && isValidIp(realIp) && isPublicIp(realIp)) {
      fallbackIp = realIp;
    }
  }

  return { primary: primaryIp, fallback: fallbackIp };
}

/**
 * Создает fallback identifier для unknown IP на основе заголовков запроса.
 * P0: Использует hash для предотвращения обхода лимита через удаление заголовков.
 * Поддерживает как Node.js crypto, так и Web Crypto API (Edge Runtime).
 *
 * @param req - Next.js request объект
 * @returns Хеш-идентификатор длиной 32 символа
 */
async function createUnknownIpIdentifier(req: NextRequest): Promise<string> {
  const userAgent = req.headers.get("user-agent") || "";
  const acceptLanguage = req.headers.get("accept-language") || "";
  const accept = req.headers.get("accept") || "";
  const contentType = req.headers.get("content-type") || "";
  const secChUa = req.headers.get("sec-ch-ua") || "";
  const secChUaPlatform = req.headers.get("sec-ch-ua-platform") || "";
  const secChUaMobile = req.headers.get("sec-ch-ua-mobile") || "";
  const secFetchSite = req.headers.get("sec-fetch-site") || "";
  const method = req.method || "";
  const pathname = req.nextUrl.pathname.slice(0, 50); // Ограничиваем длину pathname

  // Добавляем умеренную entropy для разделения клиентов за NAT/private proxy.
  // Используем только request traits без секретов и без долговременных идентификаторов.
  const input = [
    userAgent.slice(0, 200),
    acceptLanguage.slice(0, 120),
    accept.slice(0, 120),
    contentType.slice(0, 80),
    secChUa.slice(0, 160),
    secChUaPlatform.slice(0, 40),
    secChUaMobile.slice(0, 10),
    secFetchSite.slice(0, 20),
    method.slice(0, 10),
    pathname,
  ].join("|");

  // Используем Web Crypto API (работает в Edge Runtime)
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Обрезаем до 32 символов
  return hashHex.slice(0, 32);
}

/**
 * Результат проверки rate limit.
 */
export type RateLimitResult = {
  allowed: boolean;
  response?: Response;
  identifier: string;
};

/**
 * Проверяет rate limit для запроса.
 * P0.5: Spoofing protection - req.ip имеет приоритет, XFF игнорируется если есть req.ip.
 *
 * @param req - Next.js request объект
 * @returns RateLimitResult с allowed, response (если заблокирован) и identifier
 */
export async function rateLimit(req: NextRequest): Promise<RateLimitResult> {
  // P0: Если Redis не настроен (dev режим), пропускаем запрос
  if (!ratelimit || !redis) {
    return {
      allowed: true,
      identifier: "disabled",
    };
  }

  // P0.5: Извлекаем IP с trusted strategy (req.ip приоритетен)
  const { primary, fallback } = getClientIp(req);

  // P0.5: Spoofing protection - используем primary (req.ip) как identifier
  // Если req.ip существует, XFF полностью игнорируется
  let identifier: string;
  let limiter: Ratelimit;

  if (primary) {
    // PRIMARY: req.ip используется как основной identifier (не зависит от XFF)
    // Это предотвращает обход лимита через подмену XFF
    identifier = `ip:${primary}`;
    limiter = ratelimit;
  } else if (fallback) {
    // FALLBACK: XFF используется только если нет req.ip (публичный IP)
    identifier = `fallback:${fallback}`;
    limiter = ratelimit;
  } else {
    // UNKNOWN: hash-based fallback для случаев без IP (private IP отфильтрованы)
    const fallbackId = await createUnknownIpIdentifier(req);
    identifier = `unknown:${fallbackId}`;
    limiter = unknownIpRatelimit!;
  }

  try {
    // Проверяем rate limit
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      // Вычисляем retry_after в секундах (защита от отрицательных значений)
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));

      // P0.5: Dev-only debug header
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
      };

      // Добавляем debug header только в development
      if (process.env.NODE_ENV === "development") {
        headers["X-Debug-Ratelimit-Id"] = identifier;
      }

      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            ok: false,
            error: "Too many requests",
            retry_after: retryAfter,
          }),
          {
            status: 429,
            headers,
          }
        ),
        identifier,
      };
    }

    // Запрос разрешен
    return {
      allowed: true,
      identifier,
    };
  } catch (error) {
    // Если Redis недоступен, логируем ошибку
    // В production лучше отклонить запрос для безопасности
    // В dev можно пропустить для удобства разработки
    console.error("[RATE_LIMIT] Redis error:", error);

    if (process.env.NODE_ENV === "production") {
      // В production отклоняем при ошибке Redis (fail-closed)
      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            ok: false,
            error: "Rate limit service unavailable",
          }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json",
            },
          }
        ),
        identifier: "error",
      };
    }

    // В dev пропускаем запрос при ошибке Redis (fail-open для удобства)
    console.warn("[RATE_LIMIT] Allowing request in dev mode due to Redis error");
    return {
      allowed: true,
      identifier: "error-fallback",
    };
  }
}
