import { glob } from "astro/loaders";
import { slug as githubSlug } from "github-slugger";

export const pagesLoader = () =>
  glob({
    pattern: "**/*.md",
    base: "./src/content",
    generateId: ({ entry }) =>
      entry
        .replace(/\.[^/.]+$/, "")
        .split("/")
        .map((segment) => githubSlug(segment))
        .join("/")
        .replace(/\/index$/, ""),
  });
