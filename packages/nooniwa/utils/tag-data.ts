import { slugToUrl } from "./slug";
import { removeCommentsAndCode, removeLinks } from "./remove";
import { INLINE_TAG_REGEX } from "../plugins/remark/inline-tag";

export interface TagPageInfo {
  title: string;
  path: string;
}

export interface TagData {
  [tag: string]: TagPageInfo[];
}

interface PageEntry {
  id: string;
  body?: string;
  data: {
    title?: string | undefined;
    tags?: string[] | undefined;
  };
}

function getTitle(entry: PageEntry): string {
  return (
    entry.data.title ??
    entry.id.split("/").pop()?.replace(/\.md$/, "") ??
    "Untitled"
  );
}

function extractInlineTags(content: string): string[] {
  const tags = new Set<string>();
  INLINE_TAG_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = INLINE_TAG_REGEX.exec(content)) !== null) {
    if (match[1]) {
      tags.add(match[1]);
    }
  }

  return Array.from(tags);
}

export function buildTagData(pages: PageEntry[]): TagData {
  const tagData: TagData = {};

  for (const page of pages) {
    const pageInfo: TagPageInfo = {
      title: getTitle(page),
      path: slugToUrl(page.id),
    };

    const frontmatterTags = page.data.tags ?? [];

    const inlineTags = extractInlineTags(
      removeLinks(removeCommentsAndCode(page.body ?? "")),
    );

    const allTags = new Set([...frontmatterTags, ...inlineTags]);

    for (const rawTag of allTags) {
      const tag = rawTag.toLowerCase();
      const list = tagData[tag] ?? (tagData[tag] = []);
      if (!list.some((p) => p.path === pageInfo.path)) {
        list.push(pageInfo);
      }
    }
  }

  return tagData;
}

export function compareTagPagesByPath(a: TagPageInfo, b: TagPageInfo): number {
  return a.path.localeCompare(b.path, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}
