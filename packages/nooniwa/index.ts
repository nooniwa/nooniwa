/// <reference path="./virtual.d.ts" />

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { AstroError } from "astro/errors";
import { vitePluginUserConfig } from "./integrations/vite-plugins";
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
      "astro:config:setup": ({ injectRoute, updateConfig, config }) => {
        const rootPath = fileURLToPath(config.root);
        const userStylesPath = resolve(rootPath, parsed.styles);

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
      },
    },
  };
}

export { pagesSchema } from "./schema";
export { pagesLoader } from "./loaders";
export type { NooniwaConfig, NooniwaUserConfig } from "./types";
export type { BacklinkEntry } from "./utils/backlinks";
export type { GraphNode, GraphLink, GraphData } from "./utils/graph";
