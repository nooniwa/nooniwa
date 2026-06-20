import type { PhrasingContent } from "mdast";

export const INLINE_TAG_REGEX =
  /(?<![[\w])#([\p{L}_\-/][\p{L}0-9_\-/]*|[0-9]+[\p{L}_\-/][\p{L}0-9_\-/]*)(?=[\s,.:;!?)}\]】」』）。、！？]|$)/gu;

export function processInlineTags(text: string): PhrasingContent[] {
  const nodes: PhrasingContent[] = [];
  let lastIndex = 0;

  INLINE_TAG_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = INLINE_TAG_REGEX.exec(text)) !== null) {
    const [fullMatch, tagName] = match;

    if (match.index > lastIndex) {
      nodes.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    nodes.push({
      type: "html",
      value: `<button type="button" class="tag" data-tag="${tagName}">#${tagName}</button>`,
    });

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", value: text.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : [{ type: "text", value: text }];
}

export function processInlineTagsFromNodes(
  nodes: PhrasingContent[],
): PhrasingContent[] {
  const result: PhrasingContent[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      result.push(...processInlineTags(node.value));
    } else {
      result.push(node);
    }
  }

  return result;
}
