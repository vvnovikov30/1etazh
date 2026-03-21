import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Next.js Proxy для применения rate limiting к API endpoints.
 *
 * Применяется только к маршрутам /api/telegram/* для защиты от спама и DoS.
 * Остальные маршруты проходят без проверки rate limit.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/telegram/")) {
    const rateLimitResult = await rateLimit(request);

    if (!rateLimitResult.allowed && rateLimitResult.response) {
      const response = rateLimitResult.response;

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

    if (rateLimitResult.allowed) {
      const nextResponse = NextResponse.next();
      if (process.env.NODE_ENV === "development") {
        nextResponse.headers.set("X-Debug-Ratelimit-Id", rateLimitResult.identifier);
      }
      return nextResponse;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/telegram/:path*"],
};
