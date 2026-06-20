import { describe, test, expect, beforeAll } from "vitest";
import { makeProcessor, render } from "./utils";

let processor: Awaited<ReturnType<typeof makeProcessor>>;
beforeAll(async () => {
  processor = await makeProcessor();
});

describe("inline-tag", () => {
  test("#foo becomes a tag button", async () => {
    const html = await render(processor, "text #foo here");
    expect(html).toContain('class="tag"');
    expect(html).toContain('data-tag="foo"');
    expect(html).toContain("#foo");
  });

  test("#code inside inline code is not tagged (code is a separate node)", async () => {
    const html = await render(processor, "`#code` and #real");
    expect(html).toContain('data-tag="real"');
    expect(html).not.toContain('data-tag="code"');
  });

  test("a CJK tag #日本語タグ is tagged (Unicode letters allowed)", async () => {
    const html = await render(processor, "text #日本語タグ end");
    expect(html).toContain('data-tag="日本語タグ"');
  });

  test("digits-only #1984 is not a tag (needs one non-digit char)", async () => {
    const html = await render(processor, "no #1984 here");
    expect(html).not.toContain('class="tag"');
    expect(html).toContain("#1984");
  });

  test("a tag with one non-digit char is valid whether it starts with a letter or a digit", async () => {
    expect(await render(processor, "id #y1984 here")).toContain(
      'data-tag="y1984"',
    );
    expect(await render(processor, "id #1984y here")).toContain(
      'data-tag="1984y"',
    );
  });

  test("a slash-separated #foo/bar keeps the slash in data-tag (nested tag)", async () => {
    const html = await render(processor, "topic #foo/bar here");
    expect(html).toContain('data-tag="foo/bar"');
  });

  test("a #fragment in a bare URL is not tagged (GFM autolink subtree is skipped)", async () => {
    const html = await render(processor, "see https://x.com/#section now");
    expect(html).not.toContain('class="tag"');
    expect(html).toContain("https://x.com/#section");
  });

  test("a #api inside a link label stays literal (link subtree is skipped)", async () => {
    const html = await render(processor, "[docs #api](https://example.com/)");
    expect(html).not.toContain('class="tag"');
    expect(html).toContain("docs #api");
  });

  test("a #api nested under strong inside a link is still not tagged (whole subtree skipped)", async () => {
    const html = await render(
      processor,
      "[**docs #api**](https://example.com/)",
    );
    expect(html).not.toContain('class="tag"');
  });

  test("path#anchor (a # preceded by a word char) does not fire (lookbehind)", async () => {
    const html = await render(processor, "see docs/setup#install here");
    expect(html).not.toContain('class="tag"');
    expect(html).toContain("docs/setup#install");
  });
});
