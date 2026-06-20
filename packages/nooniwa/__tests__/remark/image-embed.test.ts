import { describe, test, expect, beforeAll } from "vitest";
import { makeProcessor, render } from "./utils";

let processor: Awaited<ReturnType<typeof makeProcessor>>;
beforeAll(async () => {
  processor = await makeProcessor();
});

const subPage = new URL("./_fixtures/src/content/sub/page.md", import.meta.url);

describe("image embed", () => {
  test("![[photo.png]] resolves to a relative src from the markdown file", async () => {
    const html = await render(processor, "![[photo.png]]", subPage);
    expect(html).toContain("../attachments/photo.png");
    expect(html).toContain("__ASTRO_IMAGE_");
  });

  test("![[photo.png|300x200]] carries width=300 and height=200", async () => {
    const html = await render(processor, "![[photo.png|300x200]]", subPage);
    expect(html).toContain("width&#x22;:&#x22;300");
    expect(html).toContain("height&#x22;:&#x22;200");
  });

  test("![[photo.png|300]] carries width=300 only, no height", async () => {
    const html = await render(processor, "![[photo.png|300]]", subPage);
    expect(html).toContain("width&#x22;:&#x22;300");
    expect(html).not.toContain("height&#x22;:");
  });

  test("![[photo.png|caption]] is treated as alt text, not a size", async () => {
    const html = await render(processor, "![[photo.png|caption]]", subPage);
    expect(html).toContain("alt&#x22;:&#x22;caption");
    expect(html).not.toContain("width&#x22;:");
  });

  test("![[missing.png]] not in the index renders an embed-error", async () => {
    const html = await render(processor, "![[missing.png]]", subPage);
    expect(html).toContain('class="embed-error"');
  });
});
