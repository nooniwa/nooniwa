import { fileURLToPath } from "node:url";
import { z } from "astro/zod";

export function ComponentConfigSchema() {
  const path = (name: string) =>
    fileURLToPath(new URL(`../components/${name}.astro`, import.meta.url));

  const defaults = {
    Page: path("Page"),
    PageFrame: path("PageFrame"),
    PageLeft: path("PageLeft"),
    PageRight: path("PageRight"),
    PageMain: path("PageMain"),
    PageBody: path("PageBody"),
    PageBeforeBody: path("PageBeforeBody"),
    PageAfterBody: path("PageAfterBody"),
    PageOverlays: path("PageOverlays"),
    PageTitle: path("PageTitle"),
    PageMetadata: path("PageMetadata"),
    Backlinks: path("Backlinks"),
    FolderTree: path("FolderTree"),
    TableOfContents: path("TableOfContents"),
    GraphView: path("GraphView"),
    GraphModal: path("GraphModal"),
    TagModal: path("TagModal"),
    Header: path("Header"),
    Footer: path("Footer"),
    SiteTitle: path("SiteTitle"),
    SocialIcons: path("SocialIcons"),
    ThemeToggle: path("ThemeToggle"),
    SkipLink: path("SkipLink"),
  };
  return z
    .object({
      Page: z.string().default(defaults.Page),
      PageFrame: z.string().default(defaults.PageFrame),
      PageLeft: z.string().default(defaults.PageLeft),
      PageRight: z.string().default(defaults.PageRight),
      PageMain: z.string().default(defaults.PageMain),
      PageBody: z.string().default(defaults.PageBody),
      PageBeforeBody: z.string().default(defaults.PageBeforeBody),
      PageAfterBody: z.string().default(defaults.PageAfterBody),
      PageOverlays: z.string().default(defaults.PageOverlays),
      PageTitle: z.string().default(defaults.PageTitle),
      PageMetadata: z.string().default(defaults.PageMetadata),
      Backlinks: z.string().default(defaults.Backlinks),
      FolderTree: z.string().default(defaults.FolderTree),
      TableOfContents: z.string().default(defaults.TableOfContents),
      GraphView: z.string().default(defaults.GraphView),
      GraphModal: z.string().default(defaults.GraphModal),
      TagModal: z.string().default(defaults.TagModal),
      Header: z.string().default(defaults.Header),
      Footer: z.string().default(defaults.Footer),
      SiteTitle: z.string().default(defaults.SiteTitle),
      SocialIcons: z.string().default(defaults.SocialIcons),
      ThemeToggle: z.string().default(defaults.ThemeToggle),
      SkipLink: z.string().default(defaults.SkipLink),
    })
    .default(defaults);
}

export type ComponentName = keyof z.infer<
  ReturnType<typeof ComponentConfigSchema>
>;
