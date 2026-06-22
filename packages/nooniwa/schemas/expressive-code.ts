import { z } from "astro/zod";
import type { AstroExpressiveCodeOptions } from "astro-expressive-code";

export const ExpressiveCodeSchema = () =>
  z
    .boolean()
    .transform((val): false | Partial<AstroExpressiveCodeOptions> =>
      val ? {} : false,
    )
    .or(z.custom<Partial<AstroExpressiveCodeOptions>>(() => true))
    .optional()
    .default({});

export type ExpressiveCodeUserConfig = z.input<
  ReturnType<typeof ExpressiveCodeSchema>
>;
export type ExpressiveCodeConfig = z.output<
  ReturnType<typeof ExpressiveCodeSchema>
>;
