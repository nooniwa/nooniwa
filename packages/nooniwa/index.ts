/// <reference path="./virtual.d.ts" />

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { AstroError } from "astro/errors";
import { vitePluginUserConfig } from "./integrations/vite-plugins";
import { buildContentMaps } from "./utils/content-scanner";
import { remarkNooniwa } from "./plugins/remark/index";
import { rehypeExternalLinks } from "./plugins/rehype/external-links";
import { rehypeInternalLinks } from "./plugins/rehype/internal-links";
import { OptionsSchema, type NooniwaUserConfig } from "./utils/user-config";

export default function nooniwa(options: NooniwaUserConfig): AstroIntegration {
  const result = OptionsSchema.safeParse(options);
  if (!result.success) {
    throw new AstroError(
      "Invalid configuration passed to nooniwa",
      result.error.issues
        .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
        .join("\n"),
    );
  }

  const parsed = result.data;

  return {
    name: "nooniwa",
    hooks: {
      "astro:config:setup": ({ injectRoute, updateConfig, config, logger }) => {
        const rootPath = fileURLToPath(config.root);
        const userStylesPath = resolve(rootPath, parsed.styles);

        const contentDir = new URL("src/content/", config.root);
        const { pageUrlMap, imageFileMap, publishedSlugs } = buildContentMaps(
          contentDir,
          logger,
        );

        updateConfig({
          markdown: {
            remarkRehype: { footnoteBackContent: "↩︎" },
            remarkPlugins: [
              [
                remarkNooniwa,
                { pageUrlMap, imageFileMap, publishedSlugs, logger },
              ],
            ],
            rehypePlugins: [rehypeExternalLinks, rehypeInternalLinks],
          },
        });

        const resolveUserPath = (id: string): string =>
          id.startsWith(".") ? resolve(rootPath, id) : id;

        const componentPaths = Object.fromEntries(
          Object.entries(parsed.components).map(([name, path]) => [
            name,
            resolveUserPath(path),
          ]),
        ) as Record<import("./schemas/components.ts").ComponentName, string>;

        updateConfig({
          vite: {
            plugins: vitePluginUserConfig({
              config: parsed,
              userStylesPath,
              componentPaths,
            }),
          },
        });

        injectRoute({
          pattern: "/[...id]",
          entrypoint: "nooniwa/routes/[...id].astro",
        });

        injectRoute({
          pattern: "/_nooniwa/site-data.json",
          entrypoint: "nooniwa/routes/site-data.json.ts",
        });
      },
    },
  };
}

export { pagesSchema } from "./schema";
export { pagesLoader } from "./loaders";
export type { NooniwaConfig, NooniwaUserConfig } from "./types";
export type { BacklinkEntry } from "./utils/backlinks";
export type { GraphNode, GraphLink, GraphData } from "./utils/graph";
export type { TreeNode } from "./utils/folder-tree";
export type { TagData, TagPageInfo } from "./utils/tag-data";
