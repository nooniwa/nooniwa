import { fileURLToPath } from "node:url";
import { z } from "astro/zod";

export function ComponentConfigSchema() {
  const path = (name: string) =>
    fileURLToPath(new URL(`../components/${name}.astro`, import.meta.url));

  const defaults = {
    Page: path("Page"),
    PageFrame: path("PageFrame"),
    PageMain: path("PageMain"),
    PageBody: path("PageBody"),
    PageBeforeBody: path("PageBeforeBody"),
    PageAfterBody: path("PageAfterBody"),
    PageTitle: path("PageTitle"),
    PageMetadata: path("PageMetadata"),
    Backlinks: path("Backlinks"),
    Header: path("Header"),
    Footer: path("Footer"),
    SiteTitle: path("SiteTitle"),
    SkipLink: path("SkipLink"),
  };
  return z
    .object({
      Page: z.string().default(defaults.Page),
      PageFrame: z.string().default(defaults.PageFrame),
      PageMain: z.string().default(defaults.PageMain),
      PageBody: z.string().default(defaults.PageBody),
      PageBeforeBody: z.string().default(defaults.PageBeforeBody),
      PageAfterBody: z.string().default(defaults.PageAfterBody),
      PageTitle: z.string().default(defaults.PageTitle),
      PageMetadata: z.string().default(defaults.PageMetadata),
      Backlinks: z.string().default(defaults.Backlinks),
      Header: z.string().default(defaults.Header),
      Footer: z.string().default(defaults.Footer),
      SiteTitle: z.string().default(defaults.SiteTitle),
      SkipLink: z.string().default(defaults.SkipLink),
    })
    .default(defaults);
}

export type ComponentName = keyof z.infer<
  ReturnType<typeof ComponentConfigSchema>
>;
