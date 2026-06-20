import { defineCollection } from "astro:content";
import { pagesLoader, pagesSchema } from "nooniwa";

const pages = defineCollection({
  loader: pagesLoader(),
  schema: pagesSchema(),
});

export const collections = { pages };
