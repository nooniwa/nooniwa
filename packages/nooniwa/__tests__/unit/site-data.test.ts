import { describe, test, expect, vi, beforeEach } from "vitest";
import { buildSiteData } from "../../utils/site-data";
import { buildPageUrlMapFromEntries } from "../../utils/resolution-map";
import { buildPageLinks } from "../../utils/page-links";
import { buildGraphData } from "../../utils/graph";
import { buildTagData } from "../../utils/tag-data";
import type { CollectionEntry } from "astro:content";

const page = (
  id: string,
  body: string,
  data: { title?: string; tags?: string[] } = {},
) =>
  ({
    id,
    body,
    data: { publish: true, ...data },
  }) as unknown as CollectionEntry<"pages">;

describe("buildSiteData (single source for aggregation)", () => {
  test("matches a direct compose of the individual builders (no drift)", () => {
    const a = page("a", "see [[b]] and #foo", { title: "A" });
    const b = page("b", "see [[a]]", { title: "B" });
    const pages = [a, b];
    const allPages = [a, b];

    const result = buildSiteData(pages, allPages);

    const { pageUrlMap, publishedSlugs } = buildPageUrlMapFromEntries(allPages);
    const pageLinks = buildPageLinks(pages, pageUrlMap, publishedSlugs);
    expect(result.pageLinks).toEqual(pageLinks);
    expect(result.fullGraphData).toEqual(buildGraphData(pageLinks));
    expect(result.tagData).toEqual(buildTagData(pages));
  });

  test("mutual wikilinks and #foo yield one undirected edge and a collected tag", () => {
    const a = page("a", "see [[b]] and #foo", { title: "A" });
    const b = page("b", "see [[a]]", { title: "B" });
    const { fullGraphData, tagData } = buildSiteData([a, b], [a, b]);

    expect(fullGraphData.nodes).toHaveLength(2);
    expect(fullGraphData.links).toHaveLength(1);
    expect(tagData["foo"]?.[0]?.path).toBe("/a/");
  });
});

describe("loadSiteData (lazy client loader)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  const payload = { graph: { nodes: [], links: [] }, tags: {} };

  test("multiple calls fetch once and return the same cached result", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal("fetch", fetchMock);

    const { loadSiteData } = await import("../../scripts/site-data");
    const first = await loadSiteData();
    const second = await loadSiteData();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(first).toEqual(payload);
  });

  test("a non-ok (500) response throws, drops the cache and re-fetches next time", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: async () => payload });
    vi.stubGlobal("fetch", fetchMock);

    const { loadSiteData } = await import("../../scripts/site-data");
    await expect(loadSiteData()).rejects.toThrow();
    const retry = await loadSiteData();

    expect(retry).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
