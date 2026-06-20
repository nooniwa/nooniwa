import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";

export function rehypeExternalLinks() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;

      const href = node.properties?.href;
      if (typeof href !== "string") return;
      if (!href.startsWith("http://") && !href.startsWith("https://")) return;

      node.properties = node.properties || {};
      node.properties.target = "_blank";
      node.properties.rel = "noopener noreferrer";

      const existingClass = node.properties.className;
      const classes: string[] = [];
      if (Array.isArray(existingClass)) {
        classes.push(...existingClass.map(String));
      } else if (typeof existingClass === "string") {
        classes.push(existingClass);
      }
      if (!classes.includes("external-link")) classes.push("external-link");

      node.properties.className = classes;
    });
  };
}
