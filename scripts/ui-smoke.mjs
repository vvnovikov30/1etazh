import { spawn } from "node:child_process";
import net from "node:net";
import { setTimeout as sleep } from "node:timers/promises";

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? "3100", 10);

/** Run a command and return the child process */
function run(cmd, args, options = {}) {
  if (process.platform === "win32") {
    const commandLine = [cmd, ...args]
      .map((part) => (/\s/.test(part) ? `"${part.replace(/"/g, '\\"')}"` : part))
      .join(" ");
    return spawn(commandLine, {
      stdio: "inherit",
      shell: true,
      ...options,
    });
  }

  return spawn(cmd, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });
}

async function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "::");
  });
}

async function findFreePort(startPort) {
  for (let port = startPort; port < startPort + 50; port += 1) {
    if (await isPortFree(port)) {
      return port;
    }
  }
  throw new Error(`Could not find free port in range ${startPort}-${startPort + 49}`);
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
  const port = await findFreePort(DEFAULT_PORT);
  const baseUrl = `http://localhost:${port}`;

  if (port !== DEFAULT_PORT) {
    console.log(`ℹ️ Port ${DEFAULT_PORT} is busy, using fallback port ${port}`);
  }

  console.log("🔧 UI smoke: next build");
  await new Promise((resolve, reject) => {
    const build = run("npm", ["run", "build"], { env: process.env });
    build.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`next build failed with code ${code}`));
    });
  });

  console.log("🚀 UI smoke: next start");
  const server = run("npx", ["next", "start", "--port", String(port)], {
    env: {
      ...process.env,
      // Minimal non-secret defaults so rate-limit middleware can initialize
      NODE_ENV: "production",
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? "https://example.com/redis",
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? "test-token",
    },
  });

  try {
    await waitForReady(`${baseUrl}/`);

    const routes = ["/", "/blog/natural-light-full-final", "/blog/plita-na-penoplaste"];

    for (const route of routes) {
      const url = `${baseUrl}${route}`;
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

