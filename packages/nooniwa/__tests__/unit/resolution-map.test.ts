import { describe, test, expect } from "vitest";
import {
  addPageEntry,
  addImageEntry,
  buildPageUrlMapFromEntries,
} from "../../utils/resolution-map";
import type { ResolutionMap } from "../../utils/resolution-map";

describe("addPageEntry", () => {
  test("registers full-path and filename headings, both returning the slug", () => {
    const map: ResolutionMap = {};
    addPageEntry(map, "a/folder/note");
    expect(map["a/folder/note"]).toBe("a/folder/note");
    expect(map["note"]).toBe("a/folder/note");
  });

  test("collides same filename into an array (for proximity tie-break)", () => {
    const map: ResolutionMap = {};
    addPageEntry(map, "a/note");
    addPageEntry(map, "b/note");
    expect(map["a/note"]).toBe("a/note");
    expect(map["b/note"]).toBe("b/note");
    expect(map["note"]).toEqual(["a/note", "b/note"]);
  });
});

describe("addImageEntry", () => {
  test("lowercases the key but keeps the original-case value (value !== key)", () => {
    const map: ResolutionMap = {};
    addImageEntry(map, "Attachments/Photo.PNG");
    expect(map["attachments/photo.png"]).toBe("Attachments/Photo.PNG");
    expect(map["photo.png"]).toBe("Attachments/Photo.PNG");
  });

  test("collides same filename in different folders into an array", () => {
    const map: ResolutionMap = {};
    addImageEntry(map, "a/sub/photo.png");
    addImageEntry(map, "b/photo.png");
    expect(map["photo.png"]).toEqual(["a/sub/photo.png", "b/photo.png"]);
  });
});

describe("buildPageUrlMapFromEntries", () => {
  test("keys/values are filePath-derived slugs (value is the slug, not a URL)", () => {
    const { pageUrlMap } = buildPageUrlMapFromEntries([
      { id: "folder/note", filePath: "/x/src/content/folder/note.md" },
    ]);
    expect(pageUrlMap["folder/note"]).toBe("folder/note");
    expect(pageUrlMap["note"]).toBe("folder/note");
  });

  test("indexes every note but collects only publish:true into publishedSlugs", () => {
    const { pageUrlMap, publishedSlugs } = buildPageUrlMapFromEntries([
      {
        id: "a/pub",
        filePath: "/x/src/content/a/pub.md",
        data: { publish: true },
      },
      {
        id: "a/draft",
        filePath: "/x/src/content/a/draft.md",
        data: { publish: false },
      },
    ]);
    expect(pageUrlMap["a/pub"]).toBe("a/pub");
    expect(pageUrlMap["a/draft"]).toBe("a/draft");
    expect(publishedSlugs.has("a/pub")).toBe(true);
    expect(publishedSlugs.has("a/draft")).toBe(false);
  });
});
