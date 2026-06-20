import type {
  Blockquote,
  ListItem,
  Nodes,
  Paragraph,
  Parent,
  Text,
} from "mdast";
import { visit } from "unist-util-visit";
import type {} from "mdast-util-to-hast";

const BLOCK_ID_REGEX = /\s\^([a-zA-Z0-9][a-zA-Z0-9-]*)$/;

const STANDALONE_BLOCK_ID_REGEX = /^\^([a-zA-Z0-9][a-zA-Z0-9-]*)$/;

function assignBlockId(node: Nodes, blockId: string) {
  if (!node.data) node.data = {};
  if (!node.data.hProperties) node.data.hProperties = {};
  (node.data.hProperties as Record<string, string>).id = blockId;
}

function processStandaloneBlockIds(tree: Parent) {
  visit(tree, "paragraph", (node: Paragraph, index, parent) => {
    if (index === undefined || !parent) return;

    // Only a paragraph made of a single text node qualifies.
    if (node.children.length !== 1) return;
    const child = node.children[0];
    if (child?.type !== "text") return;

    const match = (child as Text).value.match(STANDALONE_BLOCK_ID_REGEX);
    if (!match) return;
    const blockId = match[1] as string;

    const prevSibling = parent.children.at(index - 1);
    if (!prevSibling) return;

    assignBlockId(prevSibling, blockId);
    parent.children.splice(index, 1);
    return index;
  });
}

function processInlineBlockIds(tree: Parent) {
  const processBlockId = (node: Paragraph | ListItem | Blockquote) => {
    if (node.type === "blockquote" && node.data?.hProperties) return;
    if (!node.children || node.children.length === 0) return;

    const lastChild = node.children.at(-1);
    if (!lastChild) return;

    let targetTextNode: Text | null = null;
    let targetParent: Parent = node as Parent;
    if (lastChild.type === "text") {
      targetTextNode = lastChild as Text;
    } else if (lastChild.type === "paragraph") {
      const para = lastChild as Paragraph;
      const paraLastChild = para.children.at(-1);
      if (paraLastChild?.type === "text") {
        targetTextNode = paraLastChild as Text;
        targetParent = para;
      }
    }
    if (!targetTextNode) return;

    const match = targetTextNode.value.match(BLOCK_ID_REGEX);
    if (!match) return;
    const blockId = match[1] as string;

    targetTextNode.value = targetTextNode.value.replace(BLOCK_ID_REGEX, "");
    if (targetTextNode.value === "") {
      const idx = targetParent.children.indexOf(targetTextNode);
      if (idx !== -1) targetParent.children.splice(idx, 1);
    }

    assignBlockId(node, blockId);
  };

  visit(tree, "paragraph", (node: Paragraph) => processBlockId(node));
  visit(tree, "listItem", (node: ListItem) => processBlockId(node));
  visit(tree, "blockquote", (node: Blockquote) => processBlockId(node));
}

export function applyBlockIds(tree: Parent) {
  processStandaloneBlockIds(tree);
  processInlineBlockIds(tree);
}
