import { describe, test, expect, beforeAll } from "vitest";
import { makeProcessor, render } from "./utils";

let processor: Awaited<ReturnType<typeof makeProcessor>>;
beforeAll(async () => {
  processor = await makeProcessor();
});

describe("highlight", () => {
  test("==x== is wrapped in <mark class=text-highlight>", async () => {
    const html = await render(processor, "==hi==");
    expect(html).toContain('<mark class="text-highlight">hi</mark>');
  });

  test("plain text is not falsely highlighted", async () => {
    const html = await render(processor, "just a sentence");
    expect(html).not.toContain("text-highlight");
  });

  test("==**bold**== keeps the strong inside the mark (split markers)", async () => {
    const html = await render(processor, "==**bold**==");
    expect(html).toContain(
      '<mark class="text-highlight"><strong>bold</strong></mark>',
    );
    expect(html).not.toContain("==");
  });

  test("A ==B== C highlights only B (non-space on both inner ends)", async () => {
    const html = await render(processor, "A ==B== C");
    expect(html).toContain('<mark class="text-highlight">B</mark>');
  });

  test("an unclosed ==hi more is literal", async () => {
    const html = await render(processor, "==hi more");
    expect(html).not.toContain("text-highlight");
  });
});

describe("highlight: flanking (Astro `**` parity)", () => {
  let p: Awaited<ReturnType<typeof makeProcessor>>;
  beforeAll(async () => {
    p = await makeProcessor();
  });

  test("both sides spaced == hi == is not highlighted", async () => {
    const html = await render(p, "== hi ==");
    expect(html).not.toContain("text-highlight");
  });

  test("opening side spaced == hi== is not highlighted", async () => {
    const html = await render(p, "== hi==");
    expect(html).not.toContain("text-highlight");
  });

  test("closing side spaced ==hi == is not highlighted", async () => {
    const html = await render(p, "==hi ==");
    expect(html).not.toContain("text-highlight");
  });

  test("prose A == B, C ==D is not highlighted", async () => {
    const html = await render(p, "A == B, C ==D");
    expect(html).not.toContain("text-highlight");
  });
});
