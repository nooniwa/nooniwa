declare module "virtual:nooniwa/config" {
  const config: import("./types").NooniwaConfig;
  export default config;
}

declare module "virtual:nooniwa/styles" {}

declare module "virtual:nooniwa/components/Page" {
  const Page: typeof import("./components/Page.astro").default;
  export default Page;
}
