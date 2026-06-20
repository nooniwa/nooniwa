import { describe, test, expect } from "vitest";
import { buildGraphData, getLocalGraph } from "../../utils/graph";
import type { PageLinks } from "../../utils/page-links";

const pageLinks: PageLinks[] = [
  { id: "a", url: "/a/", title: "A", targets: ["/b/"] },
  { id: "b", url: "/b/", title: "B", targets: ["/a/"] },
];

describe("buildGraphData", () => {
  test("a mutual a↔b link yields 2 nodes and one deduped undirected edge", () => {
    const { nodes, links } = buildGraphData(pageLinks);
    expect(nodes).toHaveLength(2);
    expect(links).toHaveLength(1);
    expect(links[0]).toEqual({ source: "/a/", target: "/b/" });
  });

  test("an edge to a non-existent node is not drawn", () => {
    const { links } = buildGraphData([
      { id: "a", url: "/a/", title: "A", targets: ["/missing/"] },
    ]);
    expect(links).toHaveLength(0);
  });

  test("a one-way a→b link still produces exactly one edge", () => {
    const { links } = buildGraphData([
      { id: "a", url: "/a/", title: "A", targets: ["/b/"] },
      { id: "b", url: "/b/", title: "B", targets: [] },
    ]);
    expect(links).toHaveLength(1);
    expect(links[0]).toEqual({ source: "/a/", target: "/b/" });
  });
});

describe("getLocalGraph", () => {
  test("depth 1 collects the origin and its direct neighbors", () => {
    const graph = buildGraphData(pageLinks);
    const local = getLocalGraph(graph, "/a/", 1);
    expect(local.nodes).toHaveLength(2);
  });
});
