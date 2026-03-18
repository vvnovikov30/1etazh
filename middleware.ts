import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Next.js Middleware для применения rate limiting к API endpoints.
 *
 * Применяется только к маршрутам /api/telegram/* для защиты от спама и DoS.
 * Остальные маршруты проходят без проверки rate limit.
 */
export async function middleware(request: NextRequest) {
  // Применяем rate limit только к /api/telegram/* маршрутам
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/telegram/")) {
    const rateLimitResult = await rateLimit(request);

    // Если запрос заблокирован, возвращаем response с debug header (если dev)
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      const response = rateLimitResult.response;
      
      // В development добавляем debug header ко всем ответам (включая уже добавленный в 429)
      if (process.env.NODE_ENV === "development") {
        const headers = new Headers(response.headers);
        headers.set("X-Debug-Ratelimit-Id", rateLimitResult.identifier);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }
      
      return response;
    }

    // Если запрос разрешен, пропускаем дальше с debug header в dev
    if (rateLimitResult.allowed) {
      const nextResponse = NextResponse.next();
      
      // В development добавляем debug header к успешному ответу
      if (process.env.NODE_ENV === "development") {
        nextResponse.headers.set("X-Debug-Ratelimit-Id", rateLimitResult.identifier);
      }
      
      return nextResponse;
    }
  }

  // Для всех остальных маршрутов просто продолжаем
  return NextResponse.next();
}

/**
 * Конфигурация matcher для middleware.
 * Применяется только к /api/telegram/* маршрутам.
 */
export const config = {
  matcher: ["/api/telegram/:path*"],
};

/**
 * Runtime для middleware: используем Node.js runtime для совместимости с @upstash/redis.
 * Edge Runtime не поддерживает импорт @upstash/redis/nodejs.mjs.
 */
export const runtime = "nodejs";
