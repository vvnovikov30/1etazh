import { describe, expect, it } from "vitest";
import {
  isValidE164RuPhone,
  isValidRuPhoneE164,
  normalizePhoneToE164,
} from "@/lib/phone";

describe("lib/phone.ts - normalizePhoneToE164", () => {
  it("normalizes valid +7XXXXXXXXXX format as is", () => {
    expect(normalizePhoneToE164("+79850961086")).toBe("+79850961086");
  });

  it("converts number with leading 8 to +7", () => {
    expect(normalizePhoneToE164("89850961086")).toBe("+79850961086");
  });

  it("converts 10 digits to +7 prefix", () => {
    expect(normalizePhoneToE164("9850961086")).toBe("+79850961086");
  });

  it("normalizes number with spaces, brackets and dashes", () => {
    expect(normalizePhoneToE164("+7 (985) 096-10-86")).toBe("+79850961086");
  });

  it("returns empty string for empty input", () => {
    expect(normalizePhoneToE164("")).toBe("");
  });

  it("returns empty string for too long number", () => {
    expect(normalizePhoneToE164("+7 (985) 096-10-86 55")).toBe("");
  });

  it("returns empty string for clearly invalid input", () => {
    expect(normalizePhoneToE164("abcdef")).toBe("");
  });
});

describe("lib/phone.ts - validation", () => {
  it("accepts valid RU E.164 number", () => {
    expect(isValidRuPhoneE164("+79850961086")).toBe(true);
    expect(isValidE164RuPhone("+79850961086")).toBe(true);
  });

  it("rejects invalid phone formats", () => {
    const invalidCases = [
      "",
      "79850961086",
      "+7",
      "+7123456789",
      "+712345678901",
      "+7abcdefghij",
    ];

    for (const value of invalidCases) {
      expect(isValidRuPhoneE164(value)).toBe(false);
      expect(isValidE164RuPhone(value)).toBe(false);
    }
  });

  it("documents current duplication: both validators behave identically", () => {
    const sampleValues = [
      "+79850961086",
      "+70000000000",
      "+79999999999",
      "",
      "foo",
      "+7 985 096 10 86",
      "+7123456789",
      "+712345678901",
    ];

    for (const value of sampleValues) {
      expect(isValidRuPhoneE164(value)).toBe(isValidE164RuPhone(value));
    }
  });
});
