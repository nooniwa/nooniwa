import { visit } from "unist-util-visit";
import type { Root, Text, Parent } from "mdast";

export function removeCommentsAcrossNodes(tree: Root): void {
  const textNodes: Text[] = [];
  visit(tree, "text", (node: Text) => {
    textNodes.push(node);
  });

  interface Marker {
    nodeIndex: number;
    offset: number;
  }
  const markers: Marker[] = [];
  textNodes.forEach((node, nodeIndex) => {
    let from = 0;
    let offset: number;
    while ((offset = node.value.indexOf("%%", from)) !== -1) {
      markers.push({ nodeIndex, offset });
      from = offset + 2;
    }
  });

  const pairCount = Math.floor(markers.length / 2);
  for (let p = pairCount - 1; p >= 0; p--) {
    const open = markers[2 * p];
    const close = markers[2 * p + 1];
    if (!open || !close) continue;
    const openNode = textNodes[open.nodeIndex];
    const closeNode = textNodes[close.nodeIndex];
    if (!openNode || !closeNode) continue;

    if (openNode === closeNode) {
      openNode.value =
        openNode.value.slice(0, open.offset) +
        openNode.value.slice(close.offset + 2);
    } else {
      openNode.value = openNode.value.slice(0, open.offset);
      closeNode.value = closeNode.value.slice(close.offset + 2);
      for (let k = open.nodeIndex + 1; k < close.nodeIndex; k++) {
        const between = textNodes[k];
        if (between) between.value = "";
      }
    }
  }

  cleanupEmptyNodes(tree);
}

const REMOVABLE_WHEN_EMPTY = new Set([
  "paragraph",
  "heading",
  "emphasis",
  "strong",
  "delete",
  "link",
  "blockquote",
]);

function cleanupEmptyNodes(node: Parent): void {
  node.children = node.children.filter((child) => {
    if ("children" in child) {
      cleanupEmptyNodes(child);
      if (child.children.length === 0 && REMOVABLE_WHEN_EMPTY.has(child.type))
        return false;
    }
    if (child.type === "text" && child.value === "") return false;
    return true;
  });
}
