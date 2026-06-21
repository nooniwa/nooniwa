import { fileURLToPath } from "node:url";
import { z } from "astro/zod";

export function ComponentConfigSchema() {
  const path = (name: string) =>
    fileURLToPath(new URL(`../components/${name}.astro`, import.meta.url));

  const defaults = {
    Page: path("Page"),
    PageMain: path("PageMain"),
    PageBody: path("PageBody"),
    PageBeforeBody: path("PageBeforeBody"),
    PageTitle: path("PageTitle"),
    PageMetadata: path("PageMetadata"),
    SkipLink: path("SkipLink"),
  };
  return z
    .object({
      Page: z.string().default(defaults.Page),
      PageMain: z.string().default(defaults.PageMain),
      PageBody: z.string().default(defaults.PageBody),
      PageBeforeBody: z.string().default(defaults.PageBeforeBody),
      PageTitle: z.string().default(defaults.PageTitle),
      PageMetadata: z.string().default(defaults.PageMetadata),
      SkipLink: z.string().default(defaults.SkipLink),
    })
    .default(defaults);
}

export type ComponentName = keyof z.infer<
  ReturnType<typeof ComponentConfigSchema>
>;
