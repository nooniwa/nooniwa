import { z } from "astro/zod";

export const pagesSchema = () =>
  z.object({
    title: z
      .string()
      .nullish()
      .transform((val) => val || undefined),
    description: z
      .string()
      .nullish()
      .transform((val) => val || undefined),
    created: z.coerce
      .date()
      .nullish()
      .transform((val) => val ?? undefined),
    updated: z.coerce
      .date()
      .nullish()
      .transform((val) => val ?? undefined),
    tags: z
      .array(z.string())
      .nullish()
      .transform((val) => val ?? []),
    publish: z
      .boolean()
      .nullish()
      .transform((val) => val === true),
  });
