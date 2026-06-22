import { z } from "astro/zod";
import type { KatexOptions } from "katex";

export const MathSchema = () =>
  z
    .boolean()
    .transform((val): false | Partial<KatexOptions> => (val ? {} : false))
    .or(z.custom<Partial<KatexOptions>>(() => true))
    .optional()
    .default({});

export type MathUserConfig = z.input<ReturnType<typeof MathSchema>>;
export type MathConfig = z.output<ReturnType<typeof MathSchema>>;
