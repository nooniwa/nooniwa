import type { AstroIntegration } from "astro";

export default function nooniwa(): AstroIntegration {
  return {
    name: "nooniwa",
    hooks: {
      "astro:config:setup": ({ injectRoute }) => {
        injectRoute({
          pattern: "/[...id]",
          entrypoint: "nooniwa/routes/[...id].astro",
        });
      },
    },
  };
}

export { pagesSchema } from "./schema";
export { pagesLoader } from "./loaders";
