import { describe, test, expect, beforeAll } from "vitest";
import { makeProcessor, render } from "./utils";

let processor: Awaited<ReturnType<typeof makeProcessor>>;
beforeAll(async () => {
  processor = await makeProcessor();
});

describe("note embed (placeholder)", () => {
  test("![[notes/target]] emits an embed placeholder", async () => {
    const html = await render(processor, "![[notes/target]]");
    expect(html).toContain('class="embed"');
    expect(html).toContain('data-embed-src="/notes/target/"');
    expect(html).toContain('class="embed-title"');
  });

  test("![[notes/target#Heading]] sets anchor-type=heading and an anchor-id", async () => {
    const html = await render(processor, "![[notes/target#Section]]");
    expect(html).toContain('data-embed-anchor-type="heading"');
    expect(html).toContain('data-embed-anchor-id="section"');
  });

  test("![[notes/target#^block]] sets anchor-type=block and the id without ^", async () => {
    const html = await render(processor, "![[notes/target#^block]]");
    expect(html).toContain('data-embed-anchor-type="block"');
    expect(html).toContain('data-embed-anchor-id="block"');
  });

  test("![[notes/target]] with no anchor sets anchor-type=full", async () => {
    const html = await render(processor, "![[notes/target]]");
    expect(html).toContain('data-embed-anchor-type="full"');
  });

  test("non-image media ![[movie.mp4]] renders an embed-error (images only)", async () => {
    const html = await render(processor, "![[movie.mp4]]");
    expect(html).toContain('class="embed-error"');
    expect(html).toContain("Embed not found: movie.mp4");
  });
});
