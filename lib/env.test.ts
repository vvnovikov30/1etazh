import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEnv, getEnvOptional } from "@/lib/env";

const ORIGINAL_ENV = process.env;

describe("lib/env.ts", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("getEnv returns value when variable exists (trimmed)", () => {
    process.env.TEST_EXISTING_ENV = "  hello  ";
    expect(getEnv("TEST_EXISTING_ENV")).toBe("hello");
  });

  it("getEnvOptional returns undefined when variable is missing", () => {
    delete process.env.TEST_OPTIONAL_MISSING;
    expect(getEnvOptional("TEST_OPTIONAL_MISSING")).toBeUndefined();
  });

  it("getEnv handles empty string in development mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.TEST_EMPTY_ENV = "   ";

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(getEnv("TEST_EMPTY_ENV")).toBe("");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith("[ENV] Missing environment variable: TEST_EMPTY_ENV");
  });

  it("getEnv throws in production mode for missing variable", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.TEST_REQUIRED_PROD;

    expect(() => getEnv("TEST_REQUIRED_PROD")).toThrow(
      "Missing required environment variable: TEST_REQUIRED_PROD"
    );
  });

  it("getEnv does not leak secret values to logs in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.SECRET_TOKEN = "";

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    getEnv("SECRET_TOKEN");

    const allMessages = warnSpy.mock.calls.flat().map(String).join(" ");
    expect(allMessages).toContain("SECRET_TOKEN");
    expect(allMessages).not.toContain("super-secret-value");
  });
});
