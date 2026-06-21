import { z } from "astro/zod";

export const FaviconSchema = () =>
  z
    .object({
      ico: z.string().optional(),
      svg: z.string().optional(),
      appleTouchIcon: z.string().optional(),
    })
    .default({});

export type FaviconUserConfig = z.input<ReturnType<typeof FaviconSchema>>;
export type FaviconConfig = z.output<ReturnType<typeof FaviconSchema>>;
