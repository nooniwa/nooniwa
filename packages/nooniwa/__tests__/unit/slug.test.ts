import { describe, test, expect } from "vitest";
import {
  getContentRelativePath,
  filePathToSlug,
  slugToUrl,
  headingToAnchor,
} from "../../utils/slug";

describe("getContentRelativePath", () => {
  test("extracts the part after src/content/", () => {
    expect(getContentRelativePath("/abs/src/content/folder/index.md")).toBe(
      "folder/index.md",
    );
    expect(getContentRelativePath("src/content/note with space.md")).toBe(
      "note with space.md",
    );
  });

  test("returns undefined when not under content/", () => {
    expect(getContentRelativePath("some/other/file.md")).toBeUndefined();
    expect(getContentRelativePath(undefined)).toBeUndefined();
  });
});

describe("filePathToSlug", () => {
  test("lowercases and hyphenates each segment", () => {
    expect(filePathToSlug("Foo Bar.md")).toBe("foo-bar");
    expect(filePathToSlug("Tech/My Note.md")).toBe("tech/my-note");
  });

  test("keeps a trailing index (matching key, not URL)", () => {
    expect(filePathToSlug("folder/index.md")).toBe("folder/index");
  });

  test("strips URL-unsafe symbols, keeps underscores", () => {
    expect(filePathToSlug("Foo & Bar!.md")).toBe("foo--bar");
    expect(filePathToSlug("A/B C/d_e.md")).toBe("a/b-c/d_e");
  });

  test("keeps Unicode characters", () => {
    expect(filePathToSlug("日本語ノート.md")).toBe("日本語ノート");
  });
});

describe("slugToUrl", () => {
  test("maps index / empty to root", () => {
    expect(slugToUrl("index")).toBe("/");
    expect(slugToUrl("")).toBe("/");
  });

  test("collapses a trailing index and wraps in slashes", () => {
    expect(slugToUrl("folder/index")).toBe("/folder/");
    expect(slugToUrl("tech/astro")).toBe("/tech/astro/");
  });

  test("only collapses index at the end", () => {
    expect(slugToUrl("docs/index/page")).toBe("/docs/index/page/");
    expect(slugToUrl("a/index")).toBe("/a/");
  });
});

describe("headingToAnchor", () => {
  test("slugifies heading text", () => {
    expect(headingToAnchor("My Heading")).toBe("my-heading");
  });
});
