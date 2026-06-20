// @ts-check
import { defineConfig } from "astro/config";
import nooniwa from "nooniwa";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [
    nooniwa({
      siteTitle: "nooniwa",
      styles: "./src/styles/global.css",
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
