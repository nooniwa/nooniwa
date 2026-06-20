import type { Blockquote, Paragraph, PhrasingContent, Root } from "mdast";
import { visit } from "unist-util-visit";
import { renderIconHtml, type IconName } from "../../icons";

export const CALLOUT_REGEX = /^\[!(\w+)\]([+-])?(.*)$/;

const CALLOUT_TYPE_MAP: Record<string, string> = {
  note: "note",
  abstract: "abstract",
  summary: "abstract",
  tldr: "abstract",
  info: "info",
  todo: "todo",
  tip: "tip",
  hint: "tip",
  important: "tip",
  success: "success",
  check: "success",
  done: "success",
  question: "question",
  help: "question",
  faq: "question",
  warning: "warning",
  attention: "warning",
  caution: "warning",
  failure: "failure",
  missing: "failure",
  fail: "failure",
  danger: "danger",
  error: "danger",
  bug: "bug",
  example: "example",
  quote: "quote",
  cite: "quote",
};

const CALLOUT_ICON_NAMES: Record<string, IconName> = {
  note: "pencil",
  abstract: "clipboard-list",
  info: "info",
  todo: "circle-check-big",
  tip: "flame",
  success: "check",
  question: "circle-question-mark",
  warning: "triangle-alert",
  failure: "x",
  danger: "zap",
  bug: "bug",
  example: "list",
  quote: "quote",
};

export function normalizeCalloutType(type: string): string {
  const normalized = type.toLowerCase();
  return CALLOUT_TYPE_MAP[normalized] ?? normalized;
}

export function getCalloutTitle(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function applyCallouts(tree: Root) {
  visit(tree, "blockquote", (node: Blockquote) => {
    if (node.children.length === 0) return;

    const firstChild = node.children[0];
    if (firstChild?.type !== "paragraph") return;

    const firstText = firstChild.children[0];
    if (!firstText || firstText.type !== "text") return;

    const text = firstText.value;
    const lines = text.split("\n");
    const firstLine = lines[0];
    if (!firstLine) return;

    const match = firstLine.match(CALLOUT_REGEX);
    if (!match) return;

    const [, rawType, foldChar, titleText] = match;
    if (!rawType) return;

    const calloutType = normalizeCalloutType(rawType);

    const iconName = CALLOUT_ICON_NAMES[calloutType];
    if (!iconName) return;
    const icon = renderIconHtml(iconName, 20);

    const isCollapsible = foldChar === "+" || foldChar === "-";
    const isCollapsed = foldChar === "-";

    const titleNodes: PhrasingContent[] = [];
    const pushTitleText = (value: string) => {
      const v = titleNodes.length === 0 ? value.replace(/^\s+/, "") : value;
      if (v) titleNodes.push({ type: "text", value: v });
    };
    if (titleText) pushTitleText(titleText);

    const remainingLines = lines.slice(1);
    const remainingText = remainingLines.join("\n");

    const newFirstChildChildren: PhrasingContent[] = [];
    if (remainingText.trim()) {
      newFirstChildChildren.push({ type: "text", value: remainingText });
    }

    let titleLineEnded = lines.length > 1;
    for (let c = 1; c < firstChild.children.length; c++) {
      const child = firstChild.children[c];
      if (!child) continue;

      if (titleLineEnded) {
        newFirstChildChildren.push(child as PhrasingContent);
        continue;
      }

      if (child.type === "text") {
        const newlinePos = child.value.indexOf("\n");
        if (newlinePos !== -1) {
          if (newlinePos > 0) pushTitleText(child.value.slice(0, newlinePos));
          const afterNewline = child.value.slice(newlinePos + 1);
          if (afterNewline.trim()) {
            newFirstChildChildren.push({ type: "text", value: afterNewline });
          }
          titleLineEnded = true;
        } else {
          pushTitleText(child.value);
        }
      } else {
        titleNodes.push(child as PhrasingContent);
      }
    }

    if (titleNodes.length === 0) {
      titleNodes.push({ type: "text", value: getCalloutTitle(calloutType) });
    }

    const calloutClasses = ["callout", `callout-${calloutType}`];
    if (isCollapsible) calloutClasses.push("is-collapsible");
    if (isCollapsed) calloutClasses.push("is-collapsed");

    const foldIcon = isCollapsible
      ? `<div class="callout-fold">${renderIconHtml("chevron-down", 20)}</div>`
      : "";

    const titleNode: Paragraph = {
      type: "paragraph",
      data: { hName: "div", hProperties: { className: ["callout-title"] } },
      children: titleNodes,
    };

    node.data = {
      hProperties: {
        className: calloutClasses.join(" "),
        "data-callout": calloutType,
      },
    };

    const contentNodes: (Paragraph | { type: "html"; value: string })[] = [];
    if (newFirstChildChildren.length > 0) {
      contentNodes.push({ type: "paragraph", children: newFirstChildChildren });
    }
    if (node.children.length > 1) {
      contentNodes.push(...(node.children.slice(1) as Paragraph[]));
    }

    const newChildren: (Paragraph | { type: "html"; value: string })[] = [
      {
        type: "html",
        value: `<div class="callout-header"><div class="callout-icon">${icon}</div>`,
      },
      titleNode,
      { type: "html", value: `${foldIcon}</div>` },
    ];

    if (contentNodes.length > 0) {
      newChildren.push({
        type: "html",
        value: `<div class="callout-content">`,
      });
      newChildren.push(...contentNodes);
      newChildren.push({ type: "html", value: `</div>` });
    }

    node.children = newChildren;
  });
}
