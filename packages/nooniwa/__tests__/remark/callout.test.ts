import { describe, test, expect, beforeAll } from "vitest";
import { makeProcessor, render } from "./utils";

let processor: Awaited<ReturnType<typeof makeProcessor>>;
beforeAll(async () => {
  processor = await makeProcessor();
});

describe("callout", () => {
  test("> [!note] becomes a callout block", async () => {
    const html = await render(processor, "> [!note] Title\n> Body");
    expect(html).toContain('class="callout callout-note"');
    expect(html).toContain('data-callout="note"');
    expect(html).toContain('class="callout-title"');
    expect(html).toContain("Title");
    expect(html).toContain('class="callout-content"');
  });

  test("an unknown type stays a plain blockquote", async () => {
    const html = await render(processor, "> [!unknowntype] x\n> y");
    expect(html).not.toContain("callout-unknowntype");
  });

  test("an alias drives the canonical class end-to-end", async () => {
    const tip = await render(processor, "> [!hint] Hint\n> Body");
    expect(tip).toContain('class="callout callout-tip"');
    expect(tip).toContain('data-callout="tip"');
    const abstract = await render(processor, "> [!summary] Summary\n> Body");
    expect(abstract).toContain('class="callout callout-abstract"');
  });

  test("fold markers add is-collapsible (and is-collapsed for `-`)", async () => {
    const collapsed = await render(processor, "> [!note]- Folded\n> Body");
    expect(collapsed).toContain("is-collapsible");
    expect(collapsed).toContain("is-collapsed");
    expect(collapsed).toContain('class="callout-fold"');
    const expanded = await render(processor, "> [!note]+ Expanded\n> Body");
    expect(expanded).toContain("is-collapsible");
    expect(expanded).not.toContain("is-collapsed");
  });

  test("an omitted title defaults to the capitalized type name", async () => {
    const html = await render(processor, "> [!note]\n> Body without a title");
    expect(html).toContain('class="callout-title">Note<');
  });

  test("a title-only callout emits no callout-content", async () => {
    const html = await render(processor, "> [!tip] Just a title");
    expect(html).toContain('class="callout callout-tip"');
    expect(html).toContain('class="callout-title">Just a title<');
    expect(html).not.toContain('class="callout-content"');
  });

  test("a wikilink in the title is resolved inside callout-title", async () => {
    const html = await render(processor, "> [!note] [[basic]]\n> Body");
    expect(html).toMatch(
      /class="callout-title">[^]*class="internal-link"[^]*<\/div>/,
    );
  });
});
