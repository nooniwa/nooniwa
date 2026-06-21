import type { CollectionEntry } from "astro:content";

export const SPECIAL_PAGE_IDS = ["404"] as const;

export function isSpecialPage(id: string): boolean {
  return (SPECIAL_PAGE_IDS as readonly string[]).includes(id);
}

export function isListablePage(entry: CollectionEntry<"pages">): boolean {
  return entry.data.publish && !isSpecialPage(entry.id);
}
