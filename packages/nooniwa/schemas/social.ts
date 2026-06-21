import { z } from "astro/zod";
import { Icons, type IconName } from "../icons";

const iconNames = Object.keys(Icons) as [IconName, ...IconName[]];

export const SocialSchema = () =>
  z
    .array(
      z.object({
        icon: z.enum(iconNames),
        href: z.url(),
        label: z.string().optional(),
      }),
    )
    .optional();

export type SocialUserConfig = z.input<ReturnType<typeof SocialSchema>>;
export type SocialConfig = z.output<ReturnType<typeof SocialSchema>>;
