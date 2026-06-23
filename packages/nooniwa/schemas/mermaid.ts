import { z } from "astro/zod";
import type { RehypeMermaidOptions } from "rehype-mermaid";

export const MermaidSchema = () =>
  z
    .boolean()
    .transform((val): false | Partial<RehypeMermaidOptions> =>
      val ? {} : false,
    )
    .or(z.custom<Partial<RehypeMermaidOptions>>(() => true))
    .optional()
    .default(false);

export type MermaidUserConfig = z.input<ReturnType<typeof MermaidSchema>>;
export type MermaidConfig = z.output<ReturnType<typeof MermaidSchema>>;
