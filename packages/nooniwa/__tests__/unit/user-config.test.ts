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
    expect(result.data.search).toBe(true);
    expect(result.data.rss).toBe(true);
    expect(result.data.sitemap).toBe(true);
    expect(result.data.robots).toBe(true);
    expect(result.data.favicon).toEqual({});
    expect(result.data.logo).toBeUndefined();
    expect(result.data.ogImage).toBeUndefined();
    expect(result.data.head).toEqual([]);
  });

  test("accepts search set to false", () => {
    const result = OptionsSchema.safeParse({ ...minimal, search: false });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.search).toBe(false);
  });

  test("accepts rss/sitemap/robots opted out", () => {
    const result = OptionsSchema.safeParse({
      ...minimal,
      rss: false,
      sitemap: false,
      robots: false,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rss).toBe(false);
    expect(result.data.sitemap).toBe(false);
    expect(result.data.robots).toBe(false);
  });

  test("rejects when search is not a boolean", () => {
    expect(OptionsSchema.safeParse({ ...minimal, search: "yes" }).success).toBe(
      false,
    );
  });
});

describe("OptionsSchema (strict / unknown keys)", () => {
  test("rejects an unknown top-level key (typo detection)", () => {
    const result = OptionsSchema.safeParse({ ...minimal, siteTtile: "typo" });
    expect(result.success).toBe(false);
  });
});

describe("OptionsSchema (site assets)", () => {
  test("accepts a partial favicon (only the given slots)", () => {
    const result = OptionsSchema.safeParse({
      ...minimal,
      favicon: { svg: "/icon.svg" },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.favicon).toEqual({ svg: "/icon.svg" });
  });

  test("accepts a single-image logo ({ src })", () => {
    expect(
      OptionsSchema.safeParse({ ...minimal, logo: { src: "/logo.svg" } })
        .success,
    ).toBe(true);
  });

  test("accepts a dark/light logo ({ dark, light })", () => {
    expect(
      OptionsSchema.safeParse({
        ...minimal,
        logo: { dark: "/dark.svg", light: "/light.svg" },
      }).success,
    ).toBe(true);
  });
});

describe("OptionsSchema (head)", () => {
  test("accepts script entries (the GA4-style shape)", () => {
    const result = OptionsSchema.safeParse({
      ...minimal,
      head: [
        { tag: "script", attrs: { async: true, src: "https://x/gtag.js" } },
        { tag: "script", content: "gtag('config', 'G-X');" },
      ],
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.head).toHaveLength(2);
  });

  test("rejects an unknown tag name", () => {
    const result = OptionsSchema.safeParse({
      ...minimal,
      head: [{ tag: "div" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("OptionsSchema (expressiveCode)", () => {
  test("defaults to {} (enabled with the baseline)", () => {
    const result = OptionsSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.expressiveCode).toEqual({});
  });

  test("normalizes true to {}", () => {
    const result = OptionsSchema.safeParse({
      ...minimal,
      expressiveCode: true,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.expressiveCode).toEqual({});
  });

  test("keeps false (disabled)", () => {
    const result = OptionsSchema.safeParse({
      ...minimal,
      expressiveCode: false,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.expressiveCode).toBe(false);
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
