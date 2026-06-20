import { describe, test, expect } from "vitest";
import { buildPageLinks } from "../../utils/page-links";
import { addPageEntry } from "../../utils/resolution-map";
import type { ResolutionMap } from "../../utils/resolution-map";

function makeMap(): ResolutionMap {
  const map: ResolutionMap = {};
  addPageEntry(map, "a");
  addPageEntry(map, "b");
  return map;
}

describe("buildPageLinks", () => {
  test("a body with [[b]] yields targets ['/b/']", () => {
    const links = buildPageLinks(
      [{ id: "a", body: "see [[b]]", data: { title: "A" } }],
      makeMap(),
    );
    expect(links[0]?.targets).toEqual(["/b/"]);
  });

  test("a self-link [[a]] is excluded", () => {
    const links = buildPageLinks(
      [{ id: "a", body: "[[a]] and [[b]]", data: {} }],
      makeMap(),
    );
    expect(links[0]?.targets).toEqual(["/b/"]);
  });

  test("[[b]] inside code is not collected (targets stay empty)", () => {
    const links = buildPageLinks(
      [{ id: "a", body: "`[[b]]` is just code", data: {} }],
      makeMap(),
    );
    expect(links[0]?.targets).toEqual([]);
  });

  test("[[b]] inside a paragraph-spanning %%...%% is not collected", () => {
    const links = buildPageLinks(
      [{ id: "a", body: "%%\npara1\n\npara2 with [[b]]\n%%", data: {} }],
      makeMap(),
    );
    expect(links[0]?.targets).toEqual([]);
  });

  test("a repeated [[b]] is deduped to one target", () => {
    const links = buildPageLinks(
      [{ id: "a", body: "[[b]] and again [[b]]", data: {} }],
      makeMap(),
    );
    expect(links[0]?.targets).toEqual(["/b/"]);
  });

  test("a page without a body still returns one entry with targets:[]", () => {
    const links = buildPageLinks([{ id: "b", data: {} }], makeMap());
    expect(links).toHaveLength(1);
    expect(links[0]?.targets).toEqual([]);
    expect(links[0]?.url).toBe("/b/");
  });

  test("a target that is unpublished (publishedSlugs gate) gets no edge", () => {
    const links = buildPageLinks(
      [{ id: "a", body: "see [[b]]", data: { title: "A" } }],
      makeMap(),
      new Set(["a"]),
    );
    expect(links[0]?.targets).toEqual([]);
  });
});
