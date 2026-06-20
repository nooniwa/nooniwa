import { visit } from "unist-util-visit";
import type { Root, Text, Link, Parent, PhrasingContent } from "mdast";
import type { VFile } from "vfile";
import type { AstroIntegrationLogger } from "astro";
import type { ResolutionMap } from "../../utils/resolution-map";
import { resolveWikilink } from "./resolve";
import { WIKILINK_REGEX } from "./wikilink";
import { headingToAnchor, getSlugPath, slugToUrl } from "../../utils/slug";
import { escapeHtml } from "./utils";

export interface RemarkNooniwaOptions {
  pageUrlMap: ResolutionMap;
  publishedSlugs?: ReadonlySet<string>;
  logger?: AstroIntegrationLogger;
}

function processTextNode(
  text: string,
  pageUrlMap: ResolutionMap,
  currentSlugPath?: string,
  publishedSlugs?: ReadonlySet<string>,
  logger?: AstroIntegrationLogger,
): PhrasingContent[] {
  const nodes: PhrasingContent[] = [];
  let lastIndex = 0;

  WIKILINK_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = WIKILINK_REGEX.exec(text)) !== null) {
    const [fullMatch, embedMarker, target = "", anchor, alias] = match;

    if (match.index > lastIndex) {
      nodes.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    lastIndex = match.index + fullMatch.length;

    if (embedMarker === "!") {
      nodes.push({ type: "text", value: fullMatch });
      continue;
    }

    if (!target && !anchor) {
      nodes.push({ type: "text", value: fullMatch });
      continue;
    }

    const resolvedSlug = target
      ? resolveWikilink(target, pageUrlMap, currentSlugPath, publishedSlugs)
      : null;
    const resolvedUrl = resolvedSlug !== null ? slugToUrl(resolvedSlug) : null;
    const isSamePageLink = !target && anchor !== undefined;

    let anchorSuffix = "";
    if (anchor) {
      anchorSuffix = anchor.startsWith("^")
        ? `#${anchor.slice(1)}`
        : `#${headingToAnchor(anchor)}`;
    }

    let displayText: string;
    if (alias !== undefined) {
      displayText = alias;
    } else if (isSamePageLink && anchor !== undefined) {
      displayText = anchor;
    } else if (anchor !== undefined) {
      displayText = `${target} > ${anchor}`;
    } else {
      displayText = target;
    }

    if (resolvedUrl || isSamePageLink) {
      const linkUrl = isSamePageLink
        ? anchorSuffix
        : (resolvedUrl ?? "") + anchorSuffix;
      const linkNode: Link = {
        type: "link",
        url: linkUrl,
        children: [{ type: "text", value: displayText }],
      };
      nodes.push(linkNode);
    } else {
      nodes.push({
        type: "html",
        value: `<span class="internal-link-unresolved" title="Page not found: ${escapeHtml(target)}">${escapeHtml(displayText)}</span>`,
      });
      logger?.info(`Broken wikilink: [[${target}]]`);
    }
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", value: text.slice(lastIndex) });
  }

  return nodes;
}

export function remarkNooniwa(options: RemarkNooniwaOptions) {
  const { pageUrlMap, publishedSlugs, logger } = options;

  return (tree: Root, file: VFile) => {
    const currentSlugPath = getSlugPath(file.path);

    visit(
      tree,
      "text",
      (node: Text, index: number | undefined, parent: Parent | undefined) => {
        if (index === undefined || !parent) return;
        if (!node.value.includes("[[")) return;

        const newNodes = processTextNode(
          node.value,
          pageUrlMap,
          currentSlugPath,
          publishedSlugs,
          logger,
        );
        parent.children.splice(index, 1, ...newNodes);

        return index + newNodes.length;
      },
    );
  };
}
