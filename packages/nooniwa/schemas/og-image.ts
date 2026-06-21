import { z } from "astro/zod";

export const OgImageSchema = () =>
  z
    .object({
      src: z.string(),
      alt: z.string().default(""),
    })
    .optional();

export type OgImageUserConfig = z.input<ReturnType<typeof OgImageSchema>>;
export type OgImageConfig = z.output<ReturnType<typeof OgImageSchema>>;
