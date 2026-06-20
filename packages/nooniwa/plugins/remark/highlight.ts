import type { PhrasingContent } from "mdast";
import { escapeHtml } from "./utils";

const HIGHLIGHT_REGEX = /==([^\s=](?:[^=]*[^\s=])?)==/g;

export function processHighlights(text: string): PhrasingContent[] {
  const nodes: PhrasingContent[] = [];
  let lastIndex = 0;

  HIGHLIGHT_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = HIGHLIGHT_REGEX.exec(text)) !== null) {
    const [fullMatch, content] = match;

    if (match.index > lastIndex) {
      nodes.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    nodes.push({
      type: "html",
      value: `<mark class="text-highlight">${escapeHtml(content ?? "")}</mark>`,
    });

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", value: text.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : [{ type: "text", value: text }];
}
