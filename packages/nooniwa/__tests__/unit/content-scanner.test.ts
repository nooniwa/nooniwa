import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { AstroIntegrationLogger } from "astro";
import { buildContentMaps } from "../../utils/content-scanner";
import type { ResolutionMap } from "../../utils/resolution-map";

function makeLogger() {
  const warn = vi.fn();
  const info = vi.fn();
  const error = vi.fn();
  const logger = { warn, info, error } as unknown as AstroIntegrationLogger;
  return { logger, warn, info, error };
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nooniwa-scanner-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeMd(relPath: string, frontmatter: string, body = "x") {
  const full = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `---\n${frontmatter}\n---\n${body}\n`, "utf-8");
}

function writeRaw(relPath: string, content = "") {
  const full = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf-8");
}

function maps(map: ResolutionMap, key: string, target: string): boolean {
  const v = map[key];
  if (v === undefined) return false;
  return Array.isArray(v) ? v.includes(target) : v === target;
}

function scan() {
  const { logger } = makeLogger();
  return buildContentMaps(pathToFileURL(tmpDir + path.sep), logger);
}

describe("buildContentMaps: publish detection uses the schema's parser", () => {
  test("true / True / true #comment all count as published", () => {
    writeMd("lower.md", "publish: true");
    writeMd("caps.md", "publish: True");
    writeMd("comment.md", "publish: true #test");

    const { publishedSlugs } = scan();

    expect(publishedSlugs.has("lower")).toBe(true);
    expect(publishedSlugs.has("caps")).toBe(true);
    expect(publishedSlugs.has("comment")).toBe(true);
  });

  test('false / missing / string "true" are not published (but still indexed)', () => {
    writeMd("falsey.md", "publish: false");
    writeMd("missing.md", "title: No publish key");
    writeMd("stringy.md", 'publish: "true"');

    const { pageUrlMap, publishedSlugs } = scan();

    expect(publishedSlugs.has("falsey")).toBe(false);
    expect(publishedSlugs.has("missing")).toBe(false);
    expect(publishedSlugs.has("stringy")).toBe(false);
    expect(maps(pageUrlMap, "falsey", "falsey")).toBe(true);
    expect(maps(pageUrlMap, "missing", "missing")).toBe(true);
    expect(maps(pageUrlMap, "stringy", "stringy")).toBe(true);
  });

  test("a leading `_` carries no special meaning (visibility is publish only)", () => {
    writeMd("_private.md", "publish: true");
    writeMd("_drafts/note.md", "publish: false");

    const { pageUrlMap, publishedSlugs } = scan();

    expect(maps(pageUrlMap, "_private", "_private")).toBe(true);
    expect(maps(pageUrlMap, "_drafts/note", "_drafts/note")).toBe(true);
    expect(publishedSlugs.has("_private")).toBe(true);
    expect(publishedSlugs.has("_drafts/note")).toBe(false);
  });

  test("`slug:` frontmatter warns per-file (published pages only)", () => {
    writeMd("custom.md", "publish: true\nslug: my-custom-url");
    writeMd("draft.md", "publish: false\nslug: ignored-too");
    const { logger, warn } = makeLogger();

    buildContentMaps(pathToFileURL(tmpDir + path.sep), logger);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("`slug:`");
  });
});

describe("buildContentMaps: extension filters (.md pages, image exts)", () => {
  test("non-.md files (.mdx / .mdoc / .txt) are not indexed as pages", () => {
    writeMd("note.md", "publish: true");
    writeRaw("comp.mdx", "---\npublish: true\n---\nx\n");
    writeRaw("doc.mdoc", "---\npublish: true\n---\nx\n");
    writeRaw("data.txt", "x");

    const { pageUrlMap, publishedSlugs } = scan();

    expect(maps(pageUrlMap, "note", "note")).toBe(true);
    expect(pageUrlMap["comp"]).toBeUndefined();
    expect(pageUrlMap["doc"]).toBeUndefined();
    expect(pageUrlMap["data"]).toBeUndefined();
    expect(publishedSlugs.has("comp")).toBe(false);
  });

  test("image extensions (incl. .avif) are indexed; non-images are not", () => {
    writeRaw("attachments/pic.png");
    writeRaw("attachments/modern.avif");
    writeRaw("attachments/notes.txt");

    const { imageFileMap } = scan();

    expect(maps(imageFileMap, "pic.png", "attachments/pic.png")).toBe(true);
    expect(maps(imageFileMap, "modern.avif", "attachments/modern.avif")).toBe(
      true,
    );
    expect(imageFileMap["notes.txt"]).toBeUndefined();
  });
});

describe("buildContentMaps: commented publish on root index", () => {
  test("`publish: true #test` on root index.md still publishes [[index]]", () => {
    writeMd("index.md", "publish: true #test");
    writeMd("sub/index.md", "publish: true");

    const { pageUrlMap, publishedSlugs } = scan();

    expect(publishedSlugs.has("index")).toBe(true);
    expect(maps(pageUrlMap, "index", "index")).toBe(true);
    expect(maps(pageUrlMap, "index", "sub/index")).toBe(true);
  });
});
