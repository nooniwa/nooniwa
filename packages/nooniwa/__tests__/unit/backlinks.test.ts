import { describe, test, expect } from "vitest";
import { buildBacklinksMap, getBacklinksForPage } from "../../utils/backlinks";
import type { PageLinks } from "../../utils/page-links";

const pageLinks: PageLinks[] = [
  { id: "a", url: "/a/", title: "A", targets: ["/b/"] },
  { id: "b", url: "/b/", title: "B", targets: [] },
];

describe("buildBacklinksMap / getBacklinksForPage", () => {
  test("with a→b, b's backlinks list the linking page a", () => {
    const map = buildBacklinksMap(pageLinks);
    const backlinksOfB = getBacklinksForPage("b", map);
    expect(backlinksOfB).toHaveLength(1);
    expect(backlinksOfB[0]?.id).toBe("a");
    expect(backlinksOfB[0]?.url).toBe("/a/");
  });

  test("a page nobody links to has an empty backlinks list", () => {
    const map = buildBacklinksMap(pageLinks);
    expect(getBacklinksForPage("a", map)).toEqual([]);
  });
});
