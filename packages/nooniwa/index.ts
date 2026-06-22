/// <reference path="./virtual.d.ts" />

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { AstroError } from "astro/errors";
import sitemap from "@astrojs/sitemap";
import * as pagefind from "pagefind";
import { vitePluginUserConfig } from "./integrations/vite-plugins";
import { buildContentMaps } from "./utils/content-scanner";
import { remarkNooniwa } from "./plugins/remark/index";
import { rehypeExternalLinks } from "./plugins/rehype/external-links";
import { rehypeInternalLinks } from "./plugins/rehype/internal-links";
import { OptionsSchema, type NooniwaUserConfig } from "./utils/user-config";
import { nooniwaExpressiveCode } from "./integrations/expressive-code";

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
        if (!config.site && (parsed.rss || parsed.sitemap || parsed.robots)) {
          logger.warn(
            "`site` is not set in astro.config. RSS, sitemap and robots.txt will be skipped. Set `site` to enable them.",
          );
        }

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
          pattern: "/404",
          entrypoint: "nooniwa/routes/404.astro",
        });

        injectRoute({
          pattern: "/_nooniwa/site-data.json",
          entrypoint: "nooniwa/routes/site-data.json.ts",
        });

        if (parsed.rss && config.site) {
          injectRoute({
            pattern: "/rss.xml",
            entrypoint: "nooniwa/routes/rss.xml.ts",
          });
        }
        if (parsed.robots && config.site) {
          injectRoute({
            pattern: "/robots.txt",
            entrypoint: "nooniwa/routes/robots.txt.ts",
          });
        }

        if (
          parsed.sitemap &&
          config.site &&
          !config.integrations.find((i) => i.name === "@astrojs/sitemap")
        ) {
          updateConfig({
            integrations: [sitemap({ lastmod: new Date() })],
          });
        }

        if (
          parsed.expressiveCode !== false &&
          !config.integrations.find((i) => i.name === "astro-expressive-code")
        ) {
          updateConfig({
            integrations: [nooniwaExpressiveCode(parsed.expressiveCode)],
          });
        }
      },
      "astro:build:done": async ({ dir, logger: astroLogger }) => {
        const logger = astroLogger.fork("nooniwa/pagefind");

        if (!parsed.search) {
          logger.info("Search disabled, skipping index build");
          return;
        }

        try {
          const now = performance.now();
          logger.info("Building search index...");

          const { index, errors: createErrors } = await pagefind.createIndex();
          if (createErrors.length > 0) {
            for (const error of createErrors) logger.error(error);
            throw new Error("Failed to create Pagefind index.");
          }

          const { page_count, errors: addErrors } = await index!.addDirectory({
            path: fileURLToPath(dir),
          });
          if (addErrors.length > 0) {
            for (const error of addErrors) logger.error(error);
            throw new Error("Failed to add directory to Pagefind index.");
          }

          logger.info(`Indexed ${page_count} pages`);

          const { errors: writeErrors } = await index!.writeFiles({
            outputPath: fileURLToPath(new URL("./pagefind/", dir)),
          });
          if (writeErrors.length > 0) {
            for (const error of writeErrors) logger.error(error);
            throw new Error("Failed to write Pagefind files.");
          }

          const elapsed = performance.now() - now;
          logger.info(
            `Search index built in ${elapsed < 750 ? `${Math.round(elapsed)}ms` : `${(elapsed / 1000).toFixed(2)}s`}`,
          );
        } catch (cause) {
          throw new Error("Failed to build search index.", { cause });
        } finally {
          await pagefind.close();
        }
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
