import { visit } from "unist-util-visit";
import type { Root, Text, Link, Image, Parent, PhrasingContent } from "mdast";
import type { VFile } from "vfile";
import type { AstroIntegrationLogger } from "astro";
import type { ResolutionMap } from "../../utils/resolution-map";
import { resolveWikilink, resolveImage } from "./resolve";
import { WIKILINK_REGEX } from "./wikilink";
import { isImageFile, computeRelativeImagePath } from "./image";
import {
  headingToAnchor,
  getContentRelativePath,
  getSlugPath,
  slugToUrl,
} from "../../utils/slug";
import { escapeHtml } from "./utils";

export interface RemarkNooniwaOptions {
  pageUrlMap: ResolutionMap;
  imageFileMap?: ResolutionMap;
  publishedSlugs?: ReadonlySet<string>;
  logger?: AstroIntegrationLogger;
}

function processTextNode(
  text: string,
  pageUrlMap: ResolutionMap,
  currentSlugPath?: string,
  imageFileMap?: ResolutionMap,
  mdContentRelPath?: string,
  publishedSlugs?: ReadonlySet<string>,
  logger?: AstroIntegrationLogger,
): PhrasingContent[] {
  const nodes: PhrasingContent[] = [];
  let lastIndex = 0;

  WIKILINK_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = WIKILINK_REGEX.exec(text)) !== null) {
    const [fullMatch, embedMarker, target = "", anchor, alias] = match;
    const isEmbed = embedMarker === "!";

    if (match.index > lastIndex) {
      nodes.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    lastIndex = match.index + fullMatch.length;

    if (isEmbed && isImageFile(target)) {
      if (!imageFileMap) {
        nodes.push({ type: "text", value: fullMatch });
        continue;
      }

      const imageContentPath = resolveImage(
        target,
        imageFileMap,
        currentSlugPath,
      );
      if (!imageContentPath) {
        nodes.push({
          type: "html",
          value: `<div class="embed-error">Image not found: ${target}</div>`,
        });
        logger?.info(`Image not found: ${target}`);
        continue;
      }

      const imageSrc = mdContentRelPath
        ? computeRelativeImagePath(mdContentRelPath, imageContentPath)
        : imageContentPath;

      let width: string | undefined;
      let height: string | undefined;
      let alt = target.replace(/\.[^.]+$/, "");
      if (alias) {
        const sizeMatch = alias.match(/^(\d+)(?:x(\d+))?$/);
        if (sizeMatch) {
          width = sizeMatch[1];
          height = sizeMatch[2];
        } else {
          alt = alias;
        }
      }

      const imageNode: Image = {
        type: "image",
        url: imageSrc,
        alt,
        data: {
          hProperties: {
            ...(width && { width }),
            ...(height && { height }),
          },
        },
      };
      nodes.push(imageNode);
      continue;
    }

    if (isEmbed) {
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
  const { pageUrlMap, imageFileMap, publishedSlugs, logger } = options;

  return (tree: Root, file: VFile) => {
    const currentSlugPath = getSlugPath(file.path);
    const mdContentRelPath = getContentRelativePath(file.path);

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
          imageFileMap,
          mdContentRelPath,
          publishedSlugs,
          logger,
        );
        parent.children.splice(index, 1, ...newNodes);

        return index + newNodes.length;
      },
    );
  };
}
