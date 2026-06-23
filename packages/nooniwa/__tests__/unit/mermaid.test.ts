import { describe, test, expect } from "vitest";
import type { Root, Element } from "hast";

import { rehypeMermaidPictureToClassToggle } from "../../plugins/mermaid";

function pictureTree(): Root {
  const picture: Element = {
    type: "element",
    tagName: "picture",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "source",
        properties: {
          media: "(prefers-color-scheme: dark)",
          srcSet: "DARK",
        },
        children: [],
      },
      {
        type: "element",
        tagName: "img",
        properties: { id: "mermaid-0", src: "LIGHT" },
        children: [],
      },
    ],
  };
  return {
    type: "root",
    children: [
      { type: "element", tagName: "p", properties: {}, children: [picture] },
    ],
  };
}

function runTransform(tree: Root): void {
  rehypeMermaidPictureToClassToggle()(tree);
}

function findFigure(tree: Root): Element | undefined {
  const p = tree.children[0] as Element;
  return p.children.find(
    (c): c is Element => c.type === "element" && c.tagName === "span",
  );
}

describe("rehypeMermaidPictureToClassToggle", () => {
  test("rewrites <picture> into span.mermaid-figure with two imgs", () => {
    const tree = pictureTree();
    runTransform(tree);

    const figure = findFigure(tree);
    expect(figure?.properties?.["className"]).toEqual(["mermaid-figure"]);

    const imgs = figure!.children.filter(
      (c): c is Element => c.type === "element" && c.tagName === "img",
    );
    expect(imgs).toHaveLength(2);
    expect(imgs[0]?.properties?.["className"]).toEqual(["mermaid-light"]);
    expect(imgs[1]?.properties?.["className"]).toEqual(["mermaid-dark"]);
  });

  test("maps the dark source to mermaid-dark and the img to mermaid-light", () => {
    const tree = pictureTree();
    runTransform(tree);

    const imgs = findFigure(tree)!.children as Element[];
    expect(imgs[0]?.properties?.["src"]).toBe("LIGHT");
    expect(imgs[1]?.properties?.["src"]).toBe("DARK");
  });

  test("drops the img id so it isn't duplicated across both copies", () => {
    const tree = pictureTree();
    runTransform(tree);

    const imgs = findFigure(tree)!.children as Element[];
    expect(imgs[0]?.properties?.["id"]).toBeUndefined();
    expect(imgs[1]?.properties?.["id"]).toBeUndefined();
  });

  test("leaves a <picture> without a prefers-color-scheme source untouched", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "picture",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "img",
              properties: { src: "X" },
              children: [],
            },
          ],
        },
      ],
    };
    runTransform(tree);
    expect((tree.children[0] as Element).tagName).toBe("picture");
  });
});
