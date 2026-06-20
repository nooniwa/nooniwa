import { describe, test, expect, beforeAll } from "vitest";
import { makeProcessor, render } from "./utils";

let processor: Awaited<ReturnType<typeof makeProcessor>>;
beforeAll(async () => {
  processor = await makeProcessor();
});

describe("external link", () => {
  test("http(s) link opens in a new tab and is not an internal-link", async () => {
    const html = await render(processor, "[ext](https://example.com)");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('class="external-link"');
    expect(html).not.toContain("internal-link");
  });

  test("a bare URL is GFM-autolinked and also gets external-link", async () => {
    const html = await render(processor, "see https://example.com here");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('class="external-link"');
    expect(html).toContain('target="_blank"');
  });
});
