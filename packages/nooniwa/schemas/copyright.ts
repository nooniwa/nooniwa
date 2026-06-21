import { z } from "astro/zod";

export const CopyrightSchema = () =>
  z
    .object({
      name: z.string(),
      href: z.string().optional(),
      year: z.union([z.string(), z.number()]).optional(),
    })
    .optional();

export type CopyrightUserConfig = z.input<ReturnType<typeof CopyrightSchema>>;
export type CopyrightConfig = z.output<ReturnType<typeof CopyrightSchema>>;
