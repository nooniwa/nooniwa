import { fileURLToPath } from "node:url";
import { z } from "astro/zod";

export function ComponentConfigSchema() {
  const defaults = {
    Page: fileURLToPath(new URL("../components/Page.astro", import.meta.url)),
  };
  return z
    .object({
      Page: z.string().default(defaults.Page),
    })
    .default(defaults);
}

export type ComponentName = keyof z.infer<
  ReturnType<typeof ComponentConfigSchema>
>;
