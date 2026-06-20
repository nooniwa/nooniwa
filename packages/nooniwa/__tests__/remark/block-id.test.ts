import { describe, test, expect, beforeAll } from "vitest";
import { makeProcessor, render } from "./utils";

let processor: Awaited<ReturnType<typeof makeProcessor>>;
beforeAll(async () => {
  processor = await makeProcessor();
});

describe("block-id", () => {
  test("trailing ^block on a paragraph sets id and consumes the marker", async () => {
    const html = await render(processor, "a paragraph ^block");
    expect(html).toContain('id="block"');
    expect(html).toContain("a paragraph");
    expect(html).not.toContain("^block");
  });

  test("^id on its own line after a quote sets id on the blockquote (standalone)", async () => {
    const html = await render(processor, "> a quote\n\n^quoteblock");
    expect(html).toContain('<blockquote id="quoteblock"');
    expect(html).not.toContain("^quoteblock");
  });

  test("^id on its own line after a list sets id on the list (standalone)", async () => {
    const html = await render(processor, "- one\n- two\n\n^listblock");
    expect(html).toContain('<ul id="listblock"');
    expect(html).not.toContain("^listblock");
  });

  test("non-ASCII ^見出し is not a block ID and stays literal", async () => {
    const html = await render(processor, "a paragraph ^見出し");
    expect(html).not.toContain("id=");
    expect(html).toContain("^見出し");
  });
});
