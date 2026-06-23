import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";
import rehypeMermaid, { type RehypeMermaidOptions } from "rehype-mermaid";

export function nooniwaMermaid(userConfig: Partial<RehypeMermaidOptions> = {}) {
  const options: Partial<RehypeMermaidOptions> = {
    strategy: "img-svg",
    dark: { theme: "dark" },
    ...userConfig,
  };
  return {
    rehypePlugins: [
      [rehypeMermaid, options] as const,
      rehypeMermaidPictureToClassToggle,
    ],
  };
}

export function rehypeMermaidPictureToClassToggle() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "picture" || parent == null || index == null) return;

      const source = node.children.find(
        (c): c is Element => c.type === "element" && c.tagName === "source",
      );
      const img = node.children.find(
        (c): c is Element => c.type === "element" && c.tagName === "img",
      );
      if (!source || !img) return;

      const media = source.properties?.["media"];
      if (
        typeof media !== "string" ||
        !media.includes("prefers-color-scheme")
      ) {
        return;
      }

      const isDarkSource = media.includes("dark");
      const srcset =
        source.properties?.["srcSet"] ?? source.properties?.["srcset"];
      const sourceSrc = Array.isArray(srcset) ? srcset[0] : srcset;
      const imgSrc = img.properties?.["src"];

      const lightSrc = isDarkSource ? imgSrc : sourceSrc;
      const darkSrc = isDarkSource ? sourceSrc : imgSrc;

      const baseProps = { ...img.properties };
      delete baseProps["src"];
      delete baseProps["id"];

      const wrapper: Element = {
        type: "element",
        tagName: "span",
        properties: { className: ["mermaid-figure"] },
        children: [
          {
            type: "element",
            tagName: "img",
            properties: {
              ...baseProps,
              className: ["mermaid-light"],
              src: lightSrc,
            },
            children: [],
          },
          {
            type: "element",
            tagName: "img",
            properties: {
              ...baseProps,
              className: ["mermaid-dark"],
              src: darkSrc,
            },
            children: [],
          },
        ],
      };
      parent.children[index] = wrapper;
    });
  };
}
