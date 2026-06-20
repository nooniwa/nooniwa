import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { remarkNooniwa } from "../../plugins/remark/index";
import { rehypeInternalLinks } from "../../plugins/rehype/internal-links";
import { addPageEntry } from "../../utils/resolution-map";
import type { ResolutionMap } from "../../utils/resolution-map";

export const pageUrlMap: ResolutionMap = (() => {
  const map: ResolutionMap = {};
  addPageEntry(map, "wikilink/basic");
  addPageEntry(map, "wikilink/astro");
  return map;
})();

export async function makeProcessor() {
  return createMarkdownProcessor({
    remarkPlugins: [[remarkNooniwa, { pageUrlMap }]],
    rehypePlugins: [rehypeInternalLinks],
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
