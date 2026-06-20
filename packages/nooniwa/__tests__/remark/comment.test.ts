import { describe, test, expect, beforeAll } from "vitest";
import { makeProcessor, render } from "./utils";

let processor: Awaited<ReturnType<typeof makeProcessor>>;
beforeAll(async () => {
  processor = await makeProcessor();
});

describe("comment removal", () => {
  test("%%...%% is removed while the surrounding text stays", async () => {
    const html = await render(processor, "before %%secret%% after");
    expect(html).not.toContain("secret");
    expect(html).toContain("before");
    expect(html).toContain("after");
  });

  test("a comment spanning paragraphs removes its inner paragraphs and wikilink", async () => {
    const html = await render(
      processor,
      "%%\npara1\n\npara2 with [[basic]]\n%%",
    );
    expect(html).not.toContain("para1");
    expect(html).not.toContain("para2");
    expect(html).not.toContain("internal-link");
    expect(html).not.toContain("%%");
    expect(html).not.toContain("<p></p>");
  });

  test("paragraphs around a spanning comment are kept", async () => {
    const html = await render(processor, "before\n\n%%\nh1\n\nh2\n%%\n\nafter");
    expect(html).toContain("before");
    expect(html).toContain("after");
    expect(html).not.toContain("h1");
    expect(html).not.toContain("h2");
    expect(html).not.toContain("<p></p>");
  });

  test("an unclosed %% stays literal (pairs required)", async () => {
    const html = await render(processor, "before %% after");
    expect(html).toContain("%%");
    expect(html).toContain("before");
    expect(html).toContain("after");
  });

  test("%% inside inline code is not counted as a marker", async () => {
    const html = await render(processor, "a `%%` b %%hide%% d");
    expect(html).toContain("<code>%%</code>");
    expect(html).not.toContain("hide");
    expect(html).toContain("b");
    expect(html).toContain("d");
  });
});
