// @ts-check
import { defineConfig } from "astro/config";
import nooniwa from "nooniwa";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://nooniwa.dev",
  integrations: [
    nooniwa({
      siteTitle: "nooniwa",
      siteDescription:
        "nooniwa is an Astro theme (Astro integration) for digital gardens. Your Markdown notes become a website.",
      styles: "./src/styles/global.css",
      social: [{ icon: "github", href: "https://github.com/nooniwa/nooniwa" }],
      copyright: {
        name: "Ryota Hagihara",
        href: "https://www.ryotahagihara.com",
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
