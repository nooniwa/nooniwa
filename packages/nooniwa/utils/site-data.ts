import type { CollectionEntry } from "astro:content";
import { buildPageUrlMapFromEntries } from "./resolution-map";
import { buildPageLinks } from "./page-links";
import { buildGraphData, type GraphData } from "./graph";
import { buildTagData, type TagData } from "./tag-data";
import { isListablePage } from "./pages";

export interface SiteData {
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

  return { fullGraphData, tagData };
}

export async function getSiteData(): Promise<SiteData> {
  const { getCollection } = await import("astro:content");
  const pages = await getCollection("pages", isListablePage);
  const allPages = await getCollection("pages");
  return buildSiteData(pages, allPages);
}
