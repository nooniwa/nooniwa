import { z } from "astro/zod";
import { ComponentConfigSchema } from "../schemas/components";
import { CopyrightSchema } from "../schemas/copyright";
import { SocialSchema } from "../schemas/social";

export const OptionsSchema = z.strictObject({
  siteTitle: z.string(),
  siteDescription: z.string().optional(),
  lang: z.string().default("en"),
  styles: z.string().min(1),
  copyright: CopyrightSchema(),
  social: SocialSchema(),
  credits: z.boolean().default(true),
  components: ComponentConfigSchema(),
  search: z.boolean().default(true),
});

export type NooniwaConfig = z.infer<typeof OptionsSchema>;
export type NooniwaUserConfig = z.input<typeof OptionsSchema>;
