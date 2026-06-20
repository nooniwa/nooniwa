import { describe, test, expect } from "vitest";
import {
  buildTagData,
  compareTagPagesByPath,
  type TagPageInfo,
} from "../../utils/tag-data";

const page = (
  id: string,
  body: string,
  data: { title?: string; tags?: string[] },
) => ({ id, body, data });

describe("buildTagData", () => {
  test("collects both frontmatter tags and body #tags", () => {
    const data = buildTagData([
      page("a", "the body has #foo", { title: "A", tags: ["meta"] }),
    ]);
    expect(Object.keys(data).sort()).toEqual(["foo", "meta"]);
    expect(data["foo"]?.[0]?.path).toBe("/a/");
    expect(data["foo"]?.[0]?.title).toBe("A");
  });

  test("a #tag inside code is not collected (via removeCommentsAndCode)", () => {
    const data = buildTagData([
      page("a", "`#code` ignored, #real collected", { tags: [] }),
    ]);
    expect(data["real"]).toBeDefined();
    expect(data["code"]).toBeUndefined();
  });

  test("a #tag inside a %%comment%% is not collected (via removeComments)", () => {
    const data = buildTagData([
      page("a", "%%#hidden%% and #shown", { tags: [] }),
    ]);
    expect(data["shown"]).toBeDefined();
    expect(data["hidden"]).toBeUndefined();
  });

  test("a tag in both frontmatter and body lists the page once (deduped)", () => {
    const data = buildTagData([
      page("a", "the body also has #foo", { title: "A", tags: ["foo"] }),
    ]);
    expect(data["foo"]).toHaveLength(1);
    expect(data["foo"]?.[0]?.path).toBe("/a/");
  });

  test("a #tag in a URL fragment or link label is not a ghost tag (via removeLinks)", () => {
    const data = buildTagData([
      page(
        "a",
        "see https://x.com/#section and [docs #api](https://example.com/#frag) plus #real",
        { tags: [] },
      ),
    ]);
    expect(data["real"]).toBeDefined();
    expect(data["section"]).toBeUndefined();
    expect(data["api"]).toBeUndefined();
    expect(data["frag"]).toBeUndefined();
  });

  test("#Foo and #foo merge under the lowercase key foo (case-insensitive)", () => {
    const data = buildTagData([
      page("a", "body #Foo", { title: "A" }),
      page("b", "body #foo", { title: "B" }),
    ]);
    expect(Object.keys(data)).toEqual(["foo"]);
    expect(data["foo"]?.map((p) => p.path).sort()).toEqual(["/a/", "/b/"]);
  });
});

describe("compareTagPagesByPath", () => {
  const p = (path: string): TagPageInfo => ({ title: path, path });

  test("sorts paths numerically (/p2/ before /p10/, not lexicographically)", () => {
    const sorted = [p("/p10/"), p("/p2/"), p("/p1/")]
      .sort(compareTagPagesByPath)
      .map((x) => x.path);
    expect(sorted).toEqual(["/p1/", "/p2/", "/p10/"]);
  });

  test("across folders, sorts by URL path (close to folder reading order)", () => {
    const sorted = [p("/b/x/"), p("/a/z/"), p("/a/a/")]
      .sort(compareTagPagesByPath)
      .map((x) => x.path);
    expect(sorted).toEqual(["/a/a/", "/a/z/", "/b/x/"]);
  });
});
