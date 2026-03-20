import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = process.env.PORT ?? "3100";
const BASE_URL = `http://localhost:${PORT}`;

/** Run a command and return the child process */
function run(cmd, args, options = {}) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  return child;
}

async function waitForReady(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.ok || res.status === 308 || res.status === 307) return;
    } catch {
      // ignore until timeout
    }
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function smoke() {
  console.log("🔧 UI smoke: next build");
  await new Promise((resolve, reject) => {
    const build = run("npm", ["run", "build"], { env: process.env });
    build.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`next build failed with code ${code}`));
    });
  });

  console.log("🚀 UI smoke: next start");
  const server = run("npx", ["next", "start", "--port", PORT], {
    env: {
      ...process.env,
      // Minimal non-secret defaults so rate-limit middleware can initialize
      NODE_ENV: "production",
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? "https://example.com/redis",
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? "test-token",
    },
  });

  try {
    await waitForReady(`${BASE_URL}/`);

    const routes = ["/", "/blog/natural-light-full-final", "/blog/plita-na-penoplaste"];

    for (const route of routes) {
      const url = `${BASE_URL}${route}`;
      console.log(`🌐 Fetch ${url}`);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Expected 2xx for ${route}, got ${res.status}`);
      }
      const html = await res.text();

      // very light content assertions
      if (!html.includes("<h1") && !html.toLowerCase().includes("<h1")) {
        throw new Error(`No <h1> found for route ${route}`);
      }

      if (route !== "/" && !html.includes("<article")) {
        throw new Error(`No <article> found for blog route ${route}`);
      }

      if (!html.includes("<a ")) {
        throw new Error(`No links found for route ${route}`);
      }
    }
  } finally {
    server.kill();
  }
}

smoke().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

