import { z } from "astro/zod";
import { ComponentConfigSchema } from "../schemas/components";
import { CopyrightSchema } from "../schemas/copyright";
import { FaviconSchema } from "../schemas/favicon";
import { LogoSchema } from "../schemas/logo";
import { OgImageSchema } from "../schemas/og-image";
import { SocialSchema } from "../schemas/social";

export const OptionsSchema = z.strictObject({
  siteTitle: z.string(),
  siteDescription: z.string().optional(),
  lang: z.string().default("en"),
  styles: z.string().min(1),
  copyright: CopyrightSchema(),
  social: SocialSchema(),
  favicon: FaviconSchema(),
  logo: LogoSchema(),
  ogImage: OgImageSchema(),
  credits: z.boolean().default(true),
  components: ComponentConfigSchema(),
  search: z.boolean().default(true),
  rss: z.boolean().default(true),
  sitemap: z.boolean().default(true),
  robots: z.boolean().default(true),
});

export type NooniwaConfig = z.infer<typeof OptionsSchema>;
export type NooniwaUserConfig = z.input<typeof OptionsSchema>;
