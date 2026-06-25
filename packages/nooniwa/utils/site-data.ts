import type { CollectionEntry } from "astro:content";
import { buildPageUrlMapFromEntries } from "./resolution-map";
import { buildPageLinks, type PageLinks } from "./page-links";
import { buildGraphData, type GraphData } from "./graph";
import { buildTagData, type TagData } from "./tag-data";
import { isListablePage } from "./pages";
import { memoizeForBuild } from "./memoize";

export interface SiteData {
  pageLinks: PageLinks[];
  fullGraphData: GraphData;
  tagData: TagData;
}

export function buildSiteData(
  pages: CollectionEntry<"pages">[],
  allPages: CollectionEntry<"pages">[],
): SiteData {
  const { pageUrlMap, publishedSlugs } = buildPageUrlMapFromEntries(allPages);
  const pageLinks = buildPageLinks(pages, pageUrlMap, publishedSlugs);
  const fullGraphData = buildGraphData(pageLinks);
  const tagData = buildTagData(pages);

  return { pageLinks, fullGraphData, tagData };
}

async function computeSiteData(): Promise<SiteData> {
  const { getCollection } = await import("astro:content");
  const pages = await getCollection("pages", isListablePage);
  const allPages = await getCollection("pages");
  return buildSiteData(pages, allPages);
}

export const getSiteData: () => Promise<SiteData> = memoizeForBuild(
  computeSiteData,
  import.meta.env.PROD,
);
