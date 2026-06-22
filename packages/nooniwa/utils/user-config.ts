import { z } from "astro/zod";
import { ComponentConfigSchema } from "../schemas/components";
import { CopyrightSchema } from "../schemas/copyright";
import { ExpressiveCodeSchema } from "../schemas/expressive-code";
import { FaviconSchema } from "../schemas/favicon";
import { HeadSchema } from "../schemas/head";
import { LogoSchema } from "../schemas/logo";
import { MathSchema } from "../schemas/math";
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
  head: HeadSchema(),
  expressiveCode: ExpressiveCodeSchema(),
  math: MathSchema(),
  credits: z.boolean().default(true),
  components: ComponentConfigSchema(),
  search: z.boolean().default(true),
  rss: z.boolean().default(true),
  sitemap: z.boolean().default(true),
  robots: z.boolean().default(true),
});

export type NooniwaConfig = z.infer<typeof OptionsSchema>;
export type NooniwaUserConfig = z.input<typeof OptionsSchema>;
