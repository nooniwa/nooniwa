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
      copyright: {
        name: "nooniwa",
        href: "https://github.com/nooniwa/nooniwa",
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
