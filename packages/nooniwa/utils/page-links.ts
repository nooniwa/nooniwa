import { WIKILINK_REGEX } from "../plugins/remark/wikilink";
import { resolveWikilink } from "../plugins/remark/resolve";
import { removeCommentsAndCode } from "./remove";
import { slugToUrl, getSlugPath, filePathToSlug } from "./slug";
import type { ResolutionMap } from "./resolution-map";

export interface PageLinks {
  id: string;
  url: string;
  title: string;
  targets: string[];
}

interface PageEntry {
  id: string;
  filePath?: string;
  body?: string;
  data: {
    title?: string | undefined;
  };
}

export function buildPageLinks(
  entries: PageEntry[],
  pageUrlMap: ResolutionMap,
  publishedSlugs?: ReadonlySet<string>,
): PageLinks[] {
  return entries.map((entry) => {
    const url = slugToUrl(entry.id);
    const title =
      entry.data.title ??
      entry.id.split("/").pop()?.replace(/\.md$/, "") ??
      "Untitled";

    const targets: string[] = [];

    if (entry.body) {
      const cleanBody = removeCommentsAndCode(entry.body);
      const sourceSlugPath =
        getSlugPath(entry.filePath) ?? `/${filePathToSlug(entry.id)}`;
      const seen = new Set<string>();

      const regex = new RegExp(WIKILINK_REGEX.source, WIKILINK_REGEX.flags);
      for (const match of cleanBody.matchAll(regex)) {
        const target = match[2];
        if (!target) continue;

        const resolvedSlug = resolveWikilink(
          target,
          pageUrlMap,
          sourceSlugPath,
          publishedSlugs,
        );
        if (!resolvedSlug) continue;
        const resolvedUrl = slugToUrl(resolvedSlug);
        if (resolvedUrl === url) continue;
        if (seen.has(resolvedUrl)) continue;
        seen.add(resolvedUrl);
        targets.push(resolvedUrl);
      }
    }

    return { id: entry.id, url, title, targets };
  });
}
