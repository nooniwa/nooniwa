import { describe, test, expect } from "vitest";
import type { Root } from "mdast";
import { removeCommentsAcrossNodes } from "../../plugins/remark/comment";

describe("removeCommentsAcrossNodes", () => {
  test("removes a pair whose markers span an inline (non-text) node", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", value: "a %%" },
            { type: "inlineCode", value: "code" },
            { type: "text", value: "%% b" },
          ],
        },
      ],
    };
    removeCommentsAcrossNodes(tree);
    expect(tree.children[0]).toMatchObject({
      type: "paragraph",
      children: [
        { type: "text", value: "a " },
        { type: "inlineCode", value: "code" },
        { type: "text", value: " b" },
      ],
    });
  });

  test("drops a paragraph emptied entirely by a comment", () => {
    const tree: Root = {
      type: "root",
      children: [
        { type: "paragraph", children: [{ type: "text", value: "%%gone%%" }] },
        { type: "paragraph", children: [{ type: "text", value: "kept" }] },
      ],
    };
    removeCommentsAcrossNodes(tree);
    expect(tree.children).toMatchObject([
      { type: "paragraph", children: [{ type: "text", value: "kept" }] },
    ]);
  });

  test("leaves an unclosed %% literal", () => {
    const tree: Root = {
      type: "root",
      children: [
        { type: "paragraph", children: [{ type: "text", value: "a %% b" }] },
      ],
    };
    removeCommentsAcrossNodes(tree);
    expect(tree.children).toMatchObject([
      { type: "paragraph", children: [{ type: "text", value: "a %% b" }] },
    ]);
  });
});
