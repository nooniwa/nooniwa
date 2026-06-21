import { z } from "astro/zod";

export const HeadSchema = () =>
  z
    .array(
      z.object({
        tag: z.enum([
          "title",
          "base",
          "link",
          "style",
          "meta",
          "script",
          "noscript",
          "template",
        ]),
        attrs: z
          .record(z.string(), z.union([z.string(), z.boolean(), z.undefined()]))
          .optional(),
        content: z.string().optional(),
      }),
    )
    .default([]);

export type HeadUserConfig = z.input<ReturnType<typeof HeadSchema>>;
export type HeadConfig = z.output<ReturnType<typeof HeadSchema>>;
