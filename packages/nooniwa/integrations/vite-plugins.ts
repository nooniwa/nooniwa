import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ViteUserConfig } from "astro";
import type { NooniwaConfig } from "../types";

type VitePlugin = NonNullable<ViteUserConfig["plugins"]>[number];

function resolveVirtualModuleId<T extends string>(id: T): `\0${T}` {
  return `\0${id}`;
}

const VM_PREFIX = "virtual:nooniwa/";

interface PluginOptions {
  config: NooniwaConfig;
  userStylesPath: string;
}

export function vitePluginUserConfig(options: PluginOptions): VitePlugin[] {
  const packagePath = fileURLToPath(new URL("..", import.meta.url));

  const { config, userStylesPath } = options;

  const modules = {
    [`${VM_PREFIX}config`]: `export default ${JSON.stringify(config)};`,
    [`${VM_PREFIX}styles`]: `import ${JSON.stringify(userStylesPath)};`,
  } satisfies Record<string, string>;

  const resolutionMap = Object.fromEntries(
    (Object.keys(modules) as (keyof typeof modules)[]).map((key) => [
      resolveVirtualModuleId(key),
      key,
    ]),
  ) as Record<string, keyof typeof modules>;

  return [
    {
      name: "vite-plugin-user-virtual-modules",
      resolveId(id): string | void {
        if (id in modules) return resolveVirtualModuleId(id);
      },
      load(id): string | void {
        const resolution = resolutionMap[id];
        if (resolution) return modules[resolution];
      },
    },
    {
      name: "vite-plugin-user-styles",
      load(id: string) {
        if (id !== userStylesPath) return;
        const userStyles = readFileSync(userStylesPath, "utf-8");
        return [`@source "${packagePath}**/*.astro";`, userStyles].join("\n");
      },
    },
  ];
}
