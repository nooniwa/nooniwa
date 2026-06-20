import { slugToUrl } from "./slug";
import type { PageLinks } from "./page-links";

export interface BacklinkEntry {
  id: string;
  title: string;
  url: string;
}

export function buildBacklinksMap(
  pageLinks: PageLinks[],
): Map<string, BacklinkEntry[]> {
  const backlinksMap = new Map<string, BacklinkEntry[]>();

  for (const page of pageLinks) {
    const backlinkEntry: BacklinkEntry = {
      id: page.id,
      title: page.title,
      url: page.url,
    };

    for (const target of page.targets) {
      const existing = backlinksMap.get(target);
      if (existing) {
        existing.push(backlinkEntry);
      } else {
        backlinksMap.set(target, [backlinkEntry]);
      }
    }
  }

  return backlinksMap;
}

export function getBacklinksForPage(
  pageId: string,
  backlinksMap: Map<string, BacklinkEntry[]>,
): BacklinkEntry[] {
  const url = slugToUrl(pageId);
  return backlinksMap.get(url) ?? [];
}
