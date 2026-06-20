import type { AstroIntegrationLogger } from "astro";
import type { ResolutionMap } from "../../utils/resolution-map";
import { resolveWikilink } from "./resolve";
import { slugToUrl, headingToAnchor } from "../../utils/slug";
import { escapeHtml } from "./utils";
import { renderIconHtml } from "../../icons";

const EXPAND_ICON = renderIconHtml("maximize-2", 16);

function resolveAnchor(anchor: string | undefined): {
  type: "heading" | "block" | "full";
  id: string;
  label: string;
} {
  if (!anchor) return { type: "full", id: "", label: "" };
  if (anchor.startsWith("^")) {
    const blockId = anchor.slice(1);
    return { type: "block", id: blockId, label: `^${blockId}` };
  }
  return { type: "heading", id: headingToAnchor(anchor), label: anchor };
}

export function processEmbed(
  target: string,
  anchor: string | undefined,
  pageUrlMap: ResolutionMap,
  currentSlugPath?: string,
  publishedSlugs?: ReadonlySet<string>,
  logger?: AstroIntegrationLogger,
): string {
  const embedError = (message: string): string =>
    `<div class="embed-error">${escapeHtml(message)}</div>`;

  const resolvedSlug = resolveWikilink(
    target,
    pageUrlMap,
    currentSlugPath,
    publishedSlugs,
  );

  if (!resolvedSlug) {
    logger?.info(`Embed target not found: ${target}`);
    return embedError(`Embed not found: ${target}`);
  }

  const resolvedUrl = slugToUrl(resolvedSlug);

  const {
    type: anchorType,
    id: anchorId,
    label: anchorLabel,
  } = resolveAnchor(anchor);

  const base = target.split("/").pop() ?? target;
  const displayTitle = anchorLabel ? `${base} > ${anchorLabel}` : base;
  const linkUrl = anchorId ? `${resolvedUrl}#${anchorId}` : resolvedUrl;

  return (
    `<div class="embed" data-embed-src="${escapeHtml(resolvedUrl)}"` +
    ` data-embed-anchor-type="${anchorType}" data-embed-anchor-id="${escapeHtml(anchorId)}">` +
    `<div class="embed-header">` +
    `<span class="embed-title">${escapeHtml(displayTitle)}</span>` +
    `<a href="${escapeHtml(linkUrl)}" class="embed-expand" title="Open ${escapeHtml(displayTitle)}">${EXPAND_ICON}</a>` +
    `</div>` +
    `<div class="embed-content">` +
    `<span class="embed-fallback">loading...</span>` +
    `</div>` +
    `</div>`
  );
}
