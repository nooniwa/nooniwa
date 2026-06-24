import { describe, test, expect } from "vitest";
import { escapeHtml } from "../../plugins/remark/utils";
import { getSlugPath } from "../../utils/slug";
import {
  normalizeCalloutType,
  getCalloutTitle,
} from "../../plugins/remark/callout";
import { isSpecialPage, isListablePage } from "../../utils/pages";
import type { CollectionEntry } from "astro:content";

describe("escapeHtml", () => {
  test("replaces < > & with entities", () => {
    expect(escapeHtml("<b>")).toBe("&lt;b&gt;");
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });
});

describe("getSlugPath", () => {
  test("slugifies a content path and prefixes a leading slash", () => {
    expect(getSlugPath("/abs/src/content/wikilink/basic.md")).toBe(
      "/wikilink/basic",
    );
  });

  test("keeps index unfolded (proximity origin, not the URL)", () => {
    expect(getSlugPath("/abs/src/content/folder/index.md")).toBe(
      "/folder/index",
    );
  });

  test("returns undefined outside content/ or for undefined", () => {
    expect(getSlugPath("some/other/file.md")).toBeUndefined();
    expect(getSlugPath(undefined)).toBeUndefined();
  });
});

describe("callout helpers", () => {
  test("normalizeCalloutType resolves aliases, lowercases unknowns", () => {
    expect(normalizeCalloutType("NOTE")).toBe("note");
    expect(normalizeCalloutType("tldr")).toBe("abstract");
    expect(normalizeCalloutType("unknown")).toBe("unknown");
  });

  test("getCalloutTitle capitalizes the type name", () => {
    expect(getCalloutTitle("note")).toBe("Note");
  });
});

describe("page filters", () => {
  const entry = (id: string, publish: boolean) =>
    ({ id, data: { publish } }) as unknown as CollectionEntry<"pages">;

  test("isSpecialPage is true for 404, false for index", () => {
    expect(isSpecialPage("404")).toBe(true);
    expect(isSpecialPage("index")).toBe(false);
  });

  test("isListablePage is true only for published, non-special pages", () => {
    expect(isListablePage(entry("post", true))).toBe(true);
    expect(isListablePage(entry("404", true))).toBe(false);
    expect(isListablePage(entry("post", false))).toBe(false);
  });
});
