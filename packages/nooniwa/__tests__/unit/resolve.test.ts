import { describe, test, expect } from "vitest";
import { resolveWikilink, resolveImage } from "../../plugins/remark/resolve";
import { addPageEntry, addImageEntry } from "../../utils/resolution-map";
import type { ResolutionMap } from "../../utils/resolution-map";

describe("resolveWikilink: resolves [[target]] to a slug", () => {
  const map: ResolutionMap = {
    "wikilink/basic": "wikilink/basic",
    basic: "wikilink/basic",
  };

  test("filename or full path both resolve to the same slug", () => {
    expect(resolveWikilink("basic", map)).toBe("wikilink/basic");
    expect(resolveWikilink("wikilink/basic", map)).toBe("wikilink/basic");
  });

  test("uppercase / spaces are slugified before matching", () => {
    expect(resolveWikilink("Basic", map)).toBe("wikilink/basic");
  });

  test("returns null when the target is not indexed", () => {
    expect(resolveWikilink("nope", map)).toBeNull();
  });

  test("picks the closest candidate by proximity when names collide", () => {
    const m: ResolutionMap = {};
    addPageEntry(m, "wikilink/proximity-a/shared");
    addPageEntry(m, "wikilink/proximity-b/shared");

    expect(resolveWikilink("shared", m, "/wikilink/proximity-a/deep")).toBe(
      "wikilink/proximity-a/shared",
    );
    expect(resolveWikilink("shared", m, "/wikilink/proximity-b/deep")).toBe(
      "wikilink/proximity-b/shared",
    );
  });

  test("folder-note collision picks the same-folder candidate", () => {
    const m: ResolutionMap = {};
    addPageEntry(m, "x/sub/sub");
    addPageEntry(m, "x/sub");

    expect(resolveWikilink("sub", m, "/x/sub/note")).toBe("x/sub/sub");
  });

  test("index-page collision is resolved in index-preserving slug space", () => {
    const m: ResolutionMap = {};
    addPageEntry(m, "a/index");
    addPageEntry(m, "a/b/index");

    expect(resolveWikilink("index", m, "/a/b/note")).toBe("a/b/index");
  });
});

describe("resolveWikilink: publish gate", () => {
  const fullMap: ResolutionMap = {};
  addPageEntry(fullMap, "a/t1/test");
  addPageEntry(fullMap, "a/t1/t2/test");
  const start = "/a/index";

  test("nearest is unpublished → null, not the farther published note", () => {
    const published = new Set(["a/t1/t2/test"]);
    expect(resolveWikilink("test", fullMap, start, published)).toBeNull();
  });

  test("both published → nearest wins (proximity unchanged)", () => {
    const published = new Set(["a/t1/test", "a/t1/t2/test"]);
    expect(resolveWikilink("test", fullMap, start, published)).toBe(
      "a/t1/test",
    );
  });

  test("explicit path to an unpublished note is also gated", () => {
    const published = new Set(["a/t1/t2/test"]);
    expect(resolveWikilink("t1/test", fullMap, start, published)).toBeNull();
  });

  test("no publishedSlugs → no gate, nearest is returned", () => {
    expect(resolveWikilink("test", fullMap, start)).toBe("a/t1/test");
  });

  test("sole candidate unpublished + gate → null", () => {
    const m: ResolutionMap = {};
    addPageEntry(m, "a/only");
    expect(resolveWikilink("only", m, start, new Set())).toBeNull();
  });

  test("normal resolution to a published page is unchanged by the gate", () => {
    const m: ResolutionMap = {};
    addPageEntry(m, "a/pub");
    expect(resolveWikilink("pub", m, start, new Set(["a/pub"]))).toBe("a/pub");
  });
});

describe("resolveImage: looks up ![[image]] in the index", () => {
  test("matches by filename case-insensitively (no slugifying)", () => {
    const m: ResolutionMap = {};
    addImageEntry(m, "attachments/test-image.jpg");
    expect(resolveImage("Test-Image.JPG", m)).toBe(
      "attachments/test-image.jpg",
    );
  });

  test("returns the original-case spelling even when looked up lowercased", () => {
    const m: ResolutionMap = {};
    addImageEntry(m, "Attachments/Photo.PNG");
    expect(resolveImage("photo.png", m)).toBe("Attachments/Photo.PNG");
    expect(resolveImage("PHOTO.PNG", m)).toBe("Attachments/Photo.PNG");
  });

  test("same-name images in different folders resolve by proximity", () => {
    const m: ResolutionMap = {};
    addImageEntry(m, "a/sub/photo.png");
    addImageEntry(m, "b/photo.png");

    expect(resolveImage("photo.png", m, "/a/sub/note")).toBe("a/sub/photo.png");
    expect(resolveImage("photo.png", m, "/b/note")).toBe("b/photo.png");
  });
});
