import { z } from "astro/zod";

export const LogoSchema = () =>
  z
    .union([
      z.object({
        src: z.string(),
        alt: z.string().default(""),
        replacesTitle: z.boolean().default(false),
      }),
      z.object({
        dark: z.string(),
        light: z.string(),
        alt: z.string().default(""),
        replacesTitle: z.boolean().default(false),
      }),
    ])
    .optional();

export type LogoUserConfig = z.input<ReturnType<typeof LogoSchema>>;
export type LogoConfig = z.output<ReturnType<typeof LogoSchema>>;
