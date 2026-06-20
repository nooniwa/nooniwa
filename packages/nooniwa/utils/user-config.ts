import { z } from "astro/zod";

export const OptionsSchema = z.strictObject({
  siteTitle: z.string(),
  siteDescription: z.string().optional(),
  lang: z.string().default("en"),
  styles: z.string().min(1),
});

export type NooniwaConfig = z.infer<typeof OptionsSchema>;
export type NooniwaUserConfig = z.input<typeof OptionsSchema>;
