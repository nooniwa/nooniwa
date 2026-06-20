import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";

export function rehypeInternalLinks() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;

      const href = node.properties?.href;
      if (typeof href !== "string") return;

      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#")
      ) {
        return;
      }

      node.properties = node.properties || {};

      const existingClass = node.properties.className;
      const classes: string[] = [];
      if (Array.isArray(existingClass)) {
        classes.push(...existingClass.map(String));
      } else if (typeof existingClass === "string") {
        classes.push(existingClass);
      }

      if (!classes.includes("internal-link")) classes.push("internal-link");

      node.properties.className = classes;
    });
  };
}
