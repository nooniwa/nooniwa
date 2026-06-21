import { describe, test, expect } from "vitest";
import { OptionsSchema } from "../../utils/user-config";

const minimal = { siteTitle: "My Site", styles: "./src/styles/global.css" };

describe("OptionsSchema (required fields)", () => {
  test("rejects when siteTitle is missing", () => {
    expect(OptionsSchema.safeParse({ styles: "./s.css" }).success).toBe(false);
  });

  test("rejects when styles is missing", () => {
    expect(OptionsSchema.safeParse({ siteTitle: "x" }).success).toBe(false);
  });

  test("rejects when styles is an empty string (min(1))", () => {
    expect(OptionsSchema.safeParse({ ...minimal, styles: "" }).success).toBe(
      false,
    );
  });

  test("accepts an empty siteTitle", () => {
    expect(OptionsSchema.safeParse({ ...minimal, siteTitle: "" }).success).toBe(
      true,
    );
  });
});

describe("OptionsSchema (defaults)", () => {
  test("accepts the minimal config and fills defaults", () => {
    const result = OptionsSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.lang).toBe("en");
    expect(result.data.credits).toBe(true);
  });
});

describe("OptionsSchema (strict / unknown keys)", () => {
  test("rejects an unknown top-level key (typo detection)", () => {
    const result = OptionsSchema.safeParse({ ...minimal, siteTtile: "typo" });
    expect(result.success).toBe(false);
  });
});

describe("OptionsSchema (social)", () => {
  test("rejects when a social icon is not a registered name", () => {
    const result = OptionsSchema.safeParse({
      ...minimal,
      social: [{ icon: "xxx", href: "https://example.com" }],
    });
    expect(result.success).toBe(false);
  });

  test("rejects when a social href is not a valid URL", () => {
    const result = OptionsSchema.safeParse({
      ...minimal,
      social: [{ icon: "github", href: "not-a-url" }],
    });
    expect(result.success).toBe(false);
  });

  test("accepts a valid social entry", () => {
    const result = OptionsSchema.safeParse({
      ...minimal,
      social: [{ icon: "github", href: "https://github.com/me" }],
    });
    expect(result.success).toBe(true);
  });
});
