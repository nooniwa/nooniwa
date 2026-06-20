import { filePathToSlug, getContentRelativePath } from "./slug";

export type ResolutionMap = Record<string, string | string[]>;

function addResolutionTarget(
  map: ResolutionMap,
  key: string,
  target: string,
): void {
  const existing = map[key];
  if (existing === undefined) {
    map[key] = target;
  } else if (typeof existing === "string") {
    if (existing !== target) map[key] = [existing, target];
  } else if (!existing.includes(target)) {
    existing.push(target);
  }
}

export const imageNameToKey = (name: string): string =>
  name.toLowerCase().trim();

function addResolutionEntry(
  map: ResolutionMap,
  value: string,
  toKey: (name: string) => string,
): void {
  addResolutionTarget(map, toKey(value), value);
  const filename = value.split("/").pop() ?? value;
  addResolutionTarget(map, toKey(filename), value);
}

export function addPageEntry(map: ResolutionMap, slug: string): void {
  addResolutionEntry(map, slug, filePathToSlug);
}

export function addImageEntry(map: ResolutionMap, relPath: string): void {
  addResolutionEntry(map, relPath, imageNameToKey);
}

interface PageEntry {
  id: string;
  filePath?: string;
  data?: { publish?: boolean };
}

export function buildPageUrlMapFromEntries(entries: PageEntry[]): {
  pageUrlMap: ResolutionMap;
  publishedSlugs: Set<string>;
} {
  const pageUrlMap: ResolutionMap = {};
  const publishedSlugs = new Set<string>();

  for (const entry of entries) {
    const contentRel =
      getContentRelativePath(entry.filePath) ?? `${entry.id}.md`;
    const slug = filePathToSlug(contentRel);
    addPageEntry(pageUrlMap, slug);
    if (entry.data?.publish === true) publishedSlugs.add(slug);
  }

  return { pageUrlMap, publishedSlugs };
}
