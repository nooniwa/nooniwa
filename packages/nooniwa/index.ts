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

        updateConfig({
          vite: {
            plugins: vitePluginUserConfig({
              config: parsed,
              userStylesPath,
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
