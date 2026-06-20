import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { remarkNooniwa } from "../../plugins/remark/index";
import { rehypeExternalLinks } from "../../plugins/rehype/external-links";
import { rehypeInternalLinks } from "../../plugins/rehype/internal-links";
import { addPageEntry, addImageEntry } from "../../utils/resolution-map";
import type { ResolutionMap } from "../../utils/resolution-map";

export const pageUrlMap: ResolutionMap = (() => {
  const map: ResolutionMap = {};
  addPageEntry(map, "wikilink/basic");
  addPageEntry(map, "wikilink/astro");
  addPageEntry(map, "notes/target");
  return map;
})();

export const imageFileMap: ResolutionMap = (() => {
  const map: ResolutionMap = {};
  addImageEntry(map, "attachments/photo.png");
  return map;
})();

export async function makeProcessor() {
  return createMarkdownProcessor({
    remarkPlugins: [[remarkNooniwa, { pageUrlMap, imageFileMap }]],
    rehypePlugins: [rehypeExternalLinks, rehypeInternalLinks],
  });
}

const DEFAULT_FILE_URL = new URL(
  "./_fixtures/src/content/page.md",
  import.meta.url,
);

export async function render(
  processor: Awaited<ReturnType<typeof makeProcessor>>,
  markdown: string,
  fileURL: URL = DEFAULT_FILE_URL,
): Promise<string> {
  const result = await processor.render(markdown, { fileURL });
  return result.code;
}
