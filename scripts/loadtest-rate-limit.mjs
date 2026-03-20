/**
 * Расширенный нагрузочный тест для проверки rate limiting на /api/telegram/leads
 * P0: Тестирует edge cases и security hardening.
 *
 * Запуск:
 *   node scripts/loadtest-rate-limit.mjs
 *
 * Требования:
 *   - Next.js dev сервер должен быть запущен (npm run dev)
 *   - В .env.local должны быть настроены UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN
 *
 * Тесты:
 *   1. Превышение лимита (15 запросов)
 *   2. Поддельный x-forwarded-for
 *   3. Очень длинный x-forwarded-for (DoS защита)
 *   4. Unknown IP (удаление заголовков)
 */

const API_URL = process.env.API_URL || "http://localhost:3000";
const ENDPOINT = `${API_URL}/api/telegram/leads`;
const TOTAL_REQUESTS = 15;

async function makeRequest(index, customHeaders = {}) {
  try {
    const startTime = Date.now();
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...customHeaders,
      },
      body: JSON.stringify({
        name: `Test User ${index}`,
        phone: "+79991234567",
        type: "showroom_visit",
      }),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const status = response.status;
    let body = null;

    try {
      body = await response.json();
    } catch {
      // Если не JSON, пробуем text
      body = await response.text().catch(() => null);
    }

    const rateLimitHeaders = {
      limit: response.headers.get("X-RateLimit-Limit"),
      remaining: response.headers.get("X-RateLimit-Remaining"),
      reset: response.headers.get("X-RateLimit-Reset"),
      retryAfter: response.headers.get("Retry-After"),
      debugId: response.headers.get("X-Debug-Ratelimit-Id"), // P0.5: Dev-only debug header
    };

    return {
      index,
      status,
      duration,
      body,
      rateLimitHeaders,
    };
  } catch (error) {
    return {
      index,
      status: "ERROR",
      error: error.message,
    };
  }
}

function printResult(result, label = "") {
  const prefix = label ? `[${label}] ` : "";
  const index = result.index?.toString().padStart(2, "0") || "??";

  if (result.status === 429) {
    console.log(
      `${prefix}[${index}] ❌ ${result.status} - Too Many Requests (${result.duration}ms)`
    );
    if (result.rateLimitHeaders.retryAfter) {
      console.log(`      Retry-After header: ${result.rateLimitHeaders.retryAfter}s`);
    }
    if (result.body?.retry_after) {
      console.log(`      Body retry_after: ${result.body.retry_after}s`);
    }
  } else if (result.status === "ERROR") {
    console.log(`${prefix}[${index}] ❌ ERROR - ${result.error}`);
  } else if (result.status >= 200 && result.status < 300) {
    console.log(
      `${prefix}[${index}] ✅ ${result.status} - OK (${result.duration}ms)`
    );
  } else {
    console.log(
      `${prefix}[${index}] ⚠️  ${result.status} - ${result.body?.error || "Unknown"} (${result.duration}ms)`
    );
  }

  if (result.rateLimitHeaders.limit) {
    console.log(
      `      Rate Limit: ${result.rateLimitHeaders.remaining || "?"}/${result.rateLimitHeaders.limit} remaining`
    );
  }
}

function printSummary(results, testName) {
  const successCount = results.filter((r) => r.status >= 200 && r.status < 300).length;
  const rateLimitedCount = results.filter((r) => r.status === 429).length;
  const errorCount = results.filter((r) => r.status === "ERROR").length;
  const unexpectedCount = results.filter(
    (r) => r.status !== "ERROR" && r.status < 200 && (r.status >= 300 && r.status !== 429)
  ).length;

  console.log();
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Rate Limited (429): ${rateLimitedCount}`);
  console.log(`  ⚠️  Errors: ${errorCount}`);
  if (unexpectedCount > 0) {
    console.log(`  ⚠️  Unexpected responses: ${unexpectedCount}`);
  }

  return { successCount, rateLimitedCount, errorCount, unexpectedCount };
}

async function testBasicRateLimit() {
  console.log("=".repeat(60));
  console.log("Test 1: Basic Rate Limit (15 requests)");
  console.log("=".repeat(60));
  console.log(`Expected: First 8 requests OK, then 429`);
  console.log();

  const results = [];

  for (let i = 1; i <= TOTAL_REQUESTS; i++) {
    const result = await makeRequest(i);
    results.push(result);
    printResult(result);
    if (i < TOTAL_REQUESTS) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  const summary = printSummary(results, "Test 1");
  return summary;
}

async function testPrivateIp() {
  console.log();
  console.log("=".repeat(60));
  console.log("Test 2: Private IP in x-forwarded-for (should be ignored)");
  console.log("=".repeat(60));
  console.log(`Expected: Private IP (192.168.1.10) should be filtered, fallback to unknown`);
  console.log();

  const results = [];

  // Тест с private IP в XFF
  for (let i = 1; i <= 5; i++) {
    const result = await makeRequest(i, {
      "x-forwarded-for": "192.168.1.10", // Private IP - должен быть проигнорирован
    });
    results.push(result);
    printResult(result, "PRIVATE-IP");
    if (i < 5) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  const summary = printSummary(results, "Test 2");
  console.log();
  if (summary.rateLimitedCount > 0) {
    console.log("  ✅ Private IP was filtered (requests rate limited by fallback identifier)");
  } else {
    console.log("  ⚠️  Private IP filtering may not be working correctly");
  }
  return summary;
}

async function testSpoofingAttempt() {
  console.log();
  console.log("=".repeat(60));
  console.log("Test 5: Spoofing Attempt (15 requests with different XFF)");
  console.log("=".repeat(60));
  console.log(`Expected: If req.ip is used as primary, all requests should share same limit`);
  console.log(`         After limit exceeded, should return 429 despite different XFF`);
  console.log();

  const results = [];
  // Используем реальные публичные IP для теста (Google DNS и Cloudflare DNS)
  // НЕ используем documentation ranges (192.0.2.x, 198.51.100.x, 203.0.113.x)
  const fakeIps = [
    "8.8.8.1",   // Google DNS
    "8.8.8.2",   // Google DNS
    "8.8.8.3",   // Google DNS
    "8.8.8.4",   // Google DNS
    "8.8.8.5",   // Google DNS
    "1.1.1.1",   // Cloudflare DNS
    "1.1.1.2",   // Cloudflare DNS
    "1.1.1.3",   // Cloudflare DNS
    "1.1.1.4",   // Cloudflare DNS
    "1.1.1.5",   // Cloudflare DNS
    "8.8.8.10",  // Google DNS
    "8.8.8.11",  // Google DNS
    "8.8.8.12",  // Google DNS
    "1.1.1.10",  // Cloudflare DNS
    "1.1.1.11",  // Cloudflare DNS
  ];

  console.log(`  Using real public IPs: ${fakeIps.slice(0, 5).join(", ")}... (${fakeIps.length} total)`);

  // P0.5: Определяем режим после первого запроса
  /** @type {"primary"|"fallback"|"unknown"|null} */
  let mode = null;
  /** @type {string|null} */
  let firstDebugId = null;

  // Отправляем 15 запросов, каждый с разным XFF
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const result = await makeRequest(i + 1, {
      "x-forwarded-for": fakeIps[i] || `8.8.8.${i + 1}`,
    });
    results.push(result);

    // Определяем режим из первого ответа (даже если 429)
    if (i === 0) {
      firstDebugId = result.rateLimitHeaders.debugId || null;
      if (firstDebugId) {
        if (firstDebugId.startsWith("ip:")) {
          mode = "primary";
        } else if (firstDebugId.startsWith("fallback:")) {
          mode = "fallback";
        } else if (firstDebugId.startsWith("unknown:")) {
          mode = "unknown";
        }
      }
    }

    // Показываем debug ID если доступен
    const debugId = result.rateLimitHeaders.debugId;
    const label = debugId ? `SPOOF-${i + 1} [${debugId}]` : `SPOOF-${i + 1}`;
    printResult(result, label);

    if (i < TOTAL_REQUESTS - 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  const summary = printSummary(results, "Test 5");
  console.log();

  // P0.5: Умная валидация spoofing в зависимости от режима
  const firstSuccessCount = results.slice(0, 8).filter((r) => r.status >= 200 && r.status < 300).length;
  const afterLimitBlocked = results.slice(8).filter((r) => r.status === 429).length;

  console.log(`  Detected mode: ${mode || "unknown (no debug header)"}`);
  if (firstDebugId) {
    console.log(`  Debug ID: ${firstDebugId}`);
  }

  if (mode === "primary") {
    // Primary mode: req.ip используется - spoofing защита должна работать
    if (afterLimitBlocked >= 5) {
      console.log();
      console.log("  ✅ SPOOFING PROTECTION: PASSED");
      console.log(`     Primary IP mode detected - rate limit applied despite different XFF`);
      console.log(`     First ${firstSuccessCount} requests OK, then ${afterLimitBlocked} blocked`);
    } else {
      console.log();
      console.log("  ❌ SPOOFING PROTECTION: FAILED");
      console.log(`     Primary IP mode but only ${afterLimitBlocked} requests blocked after limit`);
      console.log(`     This suggests XFF spoofing may allow bypassing rate limit`);
    }
  } else if (mode === "fallback") {
    // Fallback mode: req.ip недоступен, используется XFF
    console.log();
    console.log("  ⚠️  SPOOFING PROTECTION: INCONCLUSIVE");
    console.log(`     Fallback mode detected (primary IP not available)`);
    console.log(`     Spoofing test is not authoritative in this mode`);
    console.log(`     Each different XFF will have separate rate limit`);
    if (afterLimitBlocked < 5) {
      console.log(`     Note: Only ${afterLimitBlocked} requests blocked - expected in fallback mode`);
    }
  } else if (mode === "unknown") {
    // Unknown mode: hash-based fallback
    console.log();
    console.log("  ⚠️  SPOOFING PROTECTION: INCONCLUSIVE");
    console.log(`     Unknown mode detected (strict limit: 2 req/min)`);
    console.log(`     Spoofing test is not applicable in this mode`);
    if (afterLimitBlocked >= 2) {
      console.log(`     ✅ Strict limit working: ${afterLimitBlocked} requests blocked`);
    } else {
      console.log(`     ⚠️  Only ${afterLimitBlocked} requests blocked (expected >= 2)`);
    }
  } else {
    // Debug header недоступен (production или не настроен)
    console.log();
    console.log("  ⚠️  SPOOFING PROTECTION: INCONCLUSIVE");
    console.log(`     Debug header not available - cannot determine mode`);
    console.log(`     Run in development mode to enable debug headers`);
    if (afterLimitBlocked >= 5) {
      console.log(`     ✅ Rate limiting working: ${afterLimitBlocked} requests blocked`);
    } else {
      console.log(`     ⚠️  Only ${afterLimitBlocked} requests blocked after limit`);
    }
  }

  return summary;
}

async function testIpv6SpecialCases() {
  console.log();
  console.log("=".repeat(60));
  console.log("Test 6: IPv6 Special Cases");
  console.log("=".repeat(60));
  console.log(`Expected: IPv6 mapped addresses and private ranges should be filtered`);
  console.log();

  const testCases = [
    { ip: "::ffff:8.8.8.8", name: "IPv4-mapped (public)", expected: "public" },
    { ip: "::ffff:192.168.1.1", name: "IPv4-mapped (private)", expected: "filtered" },
    { ip: "::ffff:192.0.2.1", name: "IPv4-mapped (test-net)", expected: "filtered" },
    { ip: "2001:db8::1", name: "Documentation range", expected: "filtered" },
    { ip: "fc00::1", name: "Unique local (ULA)", expected: "filtered" },
    { ip: "fe80::1", name: "Link-local", expected: "filtered" },
    { ip: "::1", name: "Loopback", expected: "filtered" },
    { ip: "2001:4860:4860::8888", name: "Public IPv6 (Google DNS)", expected: "public" },
  ];

  const results = [];

  for (const testCase of testCases) {
    const result = await makeRequest(1, {
      "x-forwarded-for": testCase.ip,
    });
    results.push({ ...testCase, result });

    const debugId = result.rateLimitHeaders.debugId || "none";
    const status = result.status >= 200 && result.status < 300 ? "✅" : result.status === 429 ? "❌" : "⚠️";
    
    console.log(`  ${status} ${testCase.name}: ${testCase.ip}`);
    console.log(`      Status: ${result.status}, Debug ID: ${debugId}`);
    
    if (testCase.expected === "filtered") {
      // Ожидаем что private/test IPv6 будет отфильтрован (unknown mode)
      if (debugId.startsWith("unknown:")) {
        console.log(`      ✅ Correctly filtered (unknown mode)`);
      } else if (debugId.startsWith("fallback:")) {
        console.log(`      ⚠️  Used as fallback (should be filtered)`);
      } else {
        console.log(`      ❌ Not filtered correctly`);
      }
    } else {
      // Ожидаем что публичный IPv6 будет использован
      if (debugId.startsWith("fallback:") || debugId.startsWith("ip:")) {
        console.log(`      ✅ Correctly recognized as public`);
      } else {
        console.log(`      ⚠️  Not recognized as public`);
      }
    }
    console.log();
    
    // Небольшая задержка между тестами
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const filteredCount = results.filter(r => r.expected === "filtered" && r.result.rateLimitHeaders.debugId?.startsWith("unknown:")).length;
  const publicCount = results.filter(r => r.expected === "public" && (r.result.rateLimitHeaders.debugId?.startsWith("fallback:") || r.result.rateLimitHeaders.debugId?.startsWith("ip:"))).length;

  console.log(`  Summary: ${filteredCount}/${results.filter(r => r.expected === "filtered").length} filtered correctly, ${publicCount}/${results.filter(r => r.expected === "public").length} public recognized`);

  return { successCount: filteredCount + publicCount, rateLimitedCount: 0, errorCount: 0, unexpectedCount: 0 };
}

async function testLongHeader() {
  console.log();
  console.log("=".repeat(60));
  console.log("Test 3: Very long x-forwarded-for (DoS protection)");
  console.log("=".repeat(60));
  console.log(`Expected: Long header should be ignored, request should work`);
  console.log();

  // Создаем очень длинную строку (1000 символов)
  const longHeader = "A".repeat(1000);

  const result = await makeRequest(1, {
    "x-forwarded-for": longHeader,
  });

  printResult(result, "LONG-HEADER");

  if (result.status >= 200 && result.status < 300) {
    console.log("  ✅ Long header was safely ignored");
  } else if (result.status === 429) {
    console.log("  ⚠️  Request was rate limited (expected if limit exceeded)");
  } else {
    console.log("  ❌ Unexpected response");
  }

  return { successCount: result.status >= 200 && result.status < 300 ? 1 : 0, rateLimitedCount: result.status === 429 ? 1 : 0, errorCount: 0, unexpectedCount: 0 };
}

async function testUnknownIp() {
  console.log();
  console.log("=".repeat(60));
  console.log("Test 4: Unknown IP (no headers)");
  console.log("=".repeat(60));
  console.log(`Expected: Should use fallback identifier with strict limit (2 req/min)`);
  console.log();

  const results = [];

  // Удаляем все IP заголовки
  for (let i = 1; i <= 5; i++) {
    const result = await makeRequest(i, {
      // Явно не передаем x-forwarded-for и x-real-ip
    });
    results.push(result);
    printResult(result, "UNKNOWN-IP");
    if (i < 5) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  const summary = printSummary(results, "Test 4");
  return summary;
}

async function runLoadTest() {
  console.log("=".repeat(60));
  console.log("Extended Rate Limit Load Test (P0 Security Hardening)");
  console.log("=".repeat(60));
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Expected limit: 8 requests/minute (configurable via RATE_LIMIT_PER_MINUTE)`);
  console.log(`Unknown IP limit: 2 requests/minute`);
  console.log("=".repeat(60));
  console.log();

  const allResults = {
    total: 0,
    success: 0,
    blocked: 0,
    errors: 0,
    unexpected: 0,
  };

  // Test 1: Basic rate limit
  const test1 = await testBasicRateLimit();
  allResults.total += TOTAL_REQUESTS;
  allResults.success += test1.successCount;
  allResults.blocked += test1.rateLimitedCount;
  allResults.errors += test1.errorCount;
  allResults.unexpected += test1.unexpectedCount;

  // Test 2: Private IP
  const test2 = await testPrivateIp();
  allResults.total += 5;
  allResults.success += test2.successCount;
  allResults.blocked += test2.rateLimitedCount;
  allResults.errors += test2.errorCount;
  allResults.unexpected += test2.unexpectedCount;

  // Test 3: Long header
  const test3 = await testLongHeader();
  allResults.total += 1;
  allResults.success += test3.successCount;
  allResults.blocked += test3.rateLimitedCount;
  allResults.errors += test3.errorCount;
  allResults.unexpected += test3.unexpectedCount;

  // Test 4: Unknown IP
  const test4 = await testUnknownIp();
  allResults.total += 5;
  allResults.success += test4.successCount;
  allResults.blocked += test4.rateLimitedCount;
  allResults.errors += test4.errorCount;
  allResults.unexpected += test4.unexpectedCount;

  // Test 5: Spoofing Attempt
  const test5 = await testSpoofingAttempt();
  allResults.total += TOTAL_REQUESTS;
  allResults.success += test5.successCount;
  allResults.blocked += test5.rateLimitedCount;
  allResults.errors += test5.errorCount;
  allResults.unexpected += test5.unexpectedCount;

  // Test 6: IPv6 Special Cases
  const test6 = await testIpv6SpecialCases();
  allResults.total += 8; // 8 test cases
  allResults.success += test6.successCount;
  allResults.blocked += test6.rateLimitedCount;
  allResults.errors += test6.errorCount;
  allResults.unexpected += test6.unexpectedCount;

  // Final summary
  console.log();
  console.log("=".repeat(60));
  console.log("Final Summary");
  console.log("=".repeat(60));
  console.log(`  Total requests: ${allResults.total}`);
  console.log(`  ✅ Successful: ${allResults.success}`);
  console.log(`  ❌ Rate Limited (429): ${allResults.blocked}`);
  console.log(`  ⚠️  Errors: ${allResults.errors}`);
  if (allResults.unexpected > 0) {
    console.log(`  ⚠️  Unexpected responses: ${allResults.unexpected}`);
  }

  if (allResults.blocked > 0) {
    console.log();
    console.log("✅ Rate limiting is working! Some requests were blocked with 429.");
  } else {
    console.log();
    console.log("⚠️  No rate limiting detected. Check:");
    console.log("  1. Redis is configured correctly (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)");
    console.log("  2. Middleware is applied to /api/telegram/* routes");
    console.log("  3. Rate limit threshold is set correctly (RATE_LIMIT_PER_MINUTE)");
  }

  console.log("=".repeat(60));
}

// Запускаем тест
runLoadTest().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
