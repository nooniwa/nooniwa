import { describe, test, expect, beforeAll } from "vitest";
import { makeProcessor, render } from "./utils";

let processor: Awaited<ReturnType<typeof makeProcessor>>;
beforeAll(async () => {
  processor = await makeProcessor();
});

describe("wikilink", () => {
  test("resolved [[wikilink/basic]] becomes <a href> + class=internal-link", async () => {
    const html = await render(processor, "[[wikilink/basic]]");
    expect(html).toContain('href="/wikilink/basic/"');
    expect(html).toContain('class="internal-link"');
    expect(html).toContain(">wikilink/basic<");
  });

  test("[[target|alias]] keeps the href but changes the display text", async () => {
    const html = await render(processor, "[[wikilink/basic|表示名]]");
    expect(html).toContain('href="/wikilink/basic/"');
    expect(html).toContain(">表示名<");
  });

  test("[[target#heading]] adds a #anchor to the href", async () => {
    const html = await render(processor, "[[wikilink/basic#見出し]]");
    expect(html).toContain('href="/wikilink/basic/#');
    expect(html).toContain("見出し");
  });

  test("block ref [[target#^id]] drops the ^ to #id", async () => {
    const html = await render(processor, "[[wikilink/basic#^block]]");
    expect(html).toContain('href="/wikilink/basic/#block"');
  });

  test("same-page [[#heading]] (no target) yields an anchor-only href", async () => {
    const html = await render(processor, "[[#見出し名]]");
    expect(html).toContain('href="#');
    expect(html).not.toContain('href="/');
    expect(html).toContain(">見出し名<");
  });

  test("same-page block [[#^block]] (no target) yields href=#block", async () => {
    const html = await render(processor, "[[#^block]]");
    expect(html).toContain('href="#block"');
    expect(html).toContain(">^block<");
  });

  test("unresolved [[nope]] becomes an unresolved span (build not blocked)", async () => {
    const html = await render(processor, "[[nope]]");
    expect(html).toContain('class="internal-link-unresolved"');
    expect(html).toContain('title="Page not found: nope"');
  });

  test("unresolved alias with < is escaped, no raw tag leaks", async () => {
    const html = await render(processor, "[[nope|a<b]]");
    expect(html).toContain('class="internal-link-unresolved"');
    expect(html).toMatch(/a(&lt;|&#x3C;)b/);
    expect(html).not.toContain("a<b");
  });
});
